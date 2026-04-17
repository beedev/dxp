"""Data Pipeline — UI-triggered ingestion + enrichment.

Provides REST endpoints for the portal's Data Pipeline Manager page to:
1. List available data configs
2. Upload source data files (JSON/CSV)
3. Trigger ingestion (source -> pgvector + graph)
4. Trigger graph enrichment (HAS_FEATURE, FREQUENTLY_BOUGHT_WITH)
5. Check pipeline status
"""

import asyncio
import json
import time
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile

from src.api.security import require_admin_key
from src.config import settings

router = APIRouter()

CONFIGS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "configs" / "data"
UPLOAD_DIR = Path("/tmp/agentic_data_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# In-memory pipeline status (per run)
PIPELINE_STATUS: dict[str, dict[str, Any]] = {}


@router.get("/api/data-pipeline/configs")
async def list_data_configs(_auth=Depends(require_admin_key)) -> dict:
    """List available data source configurations."""
    configs = []
    if CONFIGS_DIR.exists():
        for f in sorted(CONFIGS_DIR.glob("*.json")):
            try:
                with open(f) as fp:
                    data = json.load(fp)
                field_map = data.get("entity", {}).get("field_map", {})
                configs.append({
                    "id": f.stem,
                    "description": data.get("description", f.stem),
                    "source_type": data.get("source", {}).get("type", "unknown"),
                    "source_path": data.get("source", {}).get("path", ""),
                    "entity_name": data.get("entity", {}).get("name", ""),
                    "field_map": field_map,
                    "required_fields": list(field_map.keys())[:6],
                    "embedding_model": data.get("embeddings", {}).get("model", ""),
                    "graph_enabled": data.get("graph", {}).get("enabled", False),
                })
            except Exception:
                pass
    return {"configs": configs}


@router.post("/api/data-pipeline/upload-source")
async def upload_source_data(
    config_id: str = Form(...),
    file: UploadFile = File(...),
    _auth=Depends(require_admin_key),
) -> dict:
    """Upload a source data file (JSON or CSV) for a data config.

    The uploaded file path is automatically written into the config's
    source.path so the next ingestion uses it.
    """
    # Validate inputs before any I/O
    import re as _re
    if not _re.match(r"^[a-zA-Z0-9_-]+$", config_id):
        raise HTTPException(status_code=400, detail="Invalid config_id")
    if not (file.content_type or "").startswith(("application/json", "text/csv", "text/")):
        raise HTTPException(status_code=400, detail="Only JSON and CSV files are supported")

    # Stream file with size check to prevent OOM from oversized uploads
    MAX_SIZE = 50 * 1024 * 1024
    chunks: list[bytes] = []
    total = 0
    while chunk := await file.read(64 * 1024):
        total += len(chunk)
        if total > MAX_SIZE:
            raise HTTPException(status_code=413, detail="File too large (max 50MB)")
        chunks.append(chunk)
    data = b"".join(chunks)

    safe_name = "".join(c for c in (file.filename or "data") if c.isalnum() or c in "._-")[:80]
    dest = UPLOAD_DIR / f"{config_id}_{safe_name}"
    with open(dest, "wb") as f:
        f.write(data)

    # Update the data config to point to this file
    config_path = CONFIGS_DIR / f"{config_id}.json"
    if config_path.exists():
        with open(config_path) as fp:
            cfg = json.load(fp)
        cfg["source"]["path"] = str(dest)
        with open(config_path, "w") as fp:
            json.dump(cfg, fp, indent=2)

    # Count records
    record_count = 0
    try:
        if (file.content_type or "").startswith("application/json"):
            records = json.loads(data)
            record_count = len(records) if isinstance(records, list) else 1
    except Exception:
        pass

    return {
        "uploaded": True,
        "filename": safe_name,
        "size_kb": len(data) // 1024,
        "records": record_count,
        "config_id": config_id,
    }


@router.post("/api/data-pipeline/ingest")
async def trigger_ingestion(
    config_id: str = Form(None),
    background_tasks: BackgroundTasks = None,
    _auth=Depends(require_admin_key),
) -> dict:
    """Trigger catalog ingestion for a data config. Runs in background."""
    import re as _re
    cid = config_id or "ace-hardware"
    if not _re.match(r"^[a-zA-Z0-9_-]+$", cid):
        raise HTTPException(status_code=400, detail="Invalid config_id")

    run_id = str(uuid.uuid4())[:8]
    PIPELINE_STATUS[run_id] = {
        "run_id": run_id,
        "config_id": cid,
        "stage": "ingest",
        "status": "running",
        "started_at": time.time(),
        "entities": 0,
        "error": None,
    }

    async def _run():
        try:
            from src.db.ingest import run_ingest
            await run_ingest(cid)
            PIPELINE_STATUS[run_id]["status"] = "completed"
            # Count entities
            from sqlalchemy import func, select
            from src.db.models import Entity
            from src.db.session import async_session_factory
            async with async_session_factory() as db:
                result = await db.execute(select(func.count(Entity.id)))
                PIPELINE_STATUS[run_id]["entities"] = result.scalar() or 0
        except Exception as e:
            PIPELINE_STATUS[run_id]["status"] = "failed"
            PIPELINE_STATUS[run_id]["error"] = str(e)[:500]
        PIPELINE_STATUS[run_id]["completed_at"] = time.time()

    background_tasks.add_task(asyncio.create_task, _run())
    return {"run_id": run_id, "status": "started", "config_id": cid}


@router.post("/api/data-pipeline/enrich")
async def trigger_enrichment(
    background_tasks: BackgroundTasks = None,
    _auth=Depends(require_admin_key),
) -> dict:
    """Trigger knowledge graph enrichment. Runs in background."""
    run_id = str(uuid.uuid4())[:8]
    PIPELINE_STATUS[run_id] = {
        "run_id": run_id,
        "stage": "enrich",
        "status": "running",
        "started_at": time.time(),
        "edges_added": 0,
        "error": None,
    }

    async def _run():
        try:
            from src.db.enrich_graph import run as run_enrich
            await run_enrich()
            PIPELINE_STATUS[run_id]["status"] = "completed"
        except Exception as e:
            PIPELINE_STATUS[run_id]["status"] = "failed"
            PIPELINE_STATUS[run_id]["error"] = str(e)[:500]
        PIPELINE_STATUS[run_id]["completed_at"] = time.time()

    background_tasks.add_task(asyncio.create_task, _run())
    return {"run_id": run_id, "status": "started"}


@router.get("/api/data-pipeline/status")
async def pipeline_status(run_id: str = None, _auth=Depends(require_admin_key)) -> dict:
    """Get the status of a pipeline run, or the most recent run."""
    if run_id and run_id in PIPELINE_STATUS:
        s = PIPELINE_STATUS[run_id]
        elapsed = (s.get("completed_at") or time.time()) - s["started_at"]
        return {**s, "elapsed_seconds": round(elapsed, 1)}

    # Return most recent
    if PIPELINE_STATUS:
        latest = max(PIPELINE_STATUS.values(), key=lambda x: x["started_at"])
        elapsed = (latest.get("completed_at") or time.time()) - latest["started_at"]
        return {**latest, "elapsed_seconds": round(elapsed, 1)}

    return {"status": "idle", "message": "No pipeline runs yet"}


@router.post("/api/data-pipeline/create-config")
async def create_data_config(
    config_id: str = Form(...),
    description: str = Form(""),
    embedding_template: str = Form("{name}. {description}"),
    _auth=Depends(require_admin_key),
) -> dict:
    """Create a new data config with default settings."""
    CONFIGS_DIR.mkdir(parents=True, exist_ok=True)
    safe_id = "".join(c for c in config_id if c.isalnum() or c in "-_").lower()
    path = CONFIGS_DIR / f"{safe_id}.json"

    config = {
        "id": safe_id,
        "description": description or f"{safe_id} catalog",
        "source": {
            "type": "json_file",
            "path": "",
        },
        "entity": {
            "name": safe_id,
            "field_map": {
                "name": "name",
                "description": "description",
            },
        },
        "embeddings": {
            "provider": "openai",
            "model": settings.embedding_model,
            "dimensions": 1536,
            "template": embedding_template,
        },
        "graph": {
            "enabled": True,
            "graph_name": "agentic_commerce",
            "relationships": {
                "similar_to": True,
            },
        },
    }

    with open(path, "w") as f:
        json.dump(config, f, indent=2)

    return {"created": True, "id": safe_id, "path": str(path)}
