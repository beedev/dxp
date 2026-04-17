"""Config-driven entity ingestion.

Reads a data-config JSON from `configs/data/<id>.json` and uses it to:
- Load source data (currently supports json_file; easily extensible to API/CSV/DB)
- Map source fields to a generic Entity schema (name + description + JSONB data)
- Generate OpenAI embeddings using a configurable template
- Write to pgvector

Usage:
    python -m src.db.ingest ace-hardware
    python -m src.db.ingest wealth-investment-advisor

To add a new vertical: drop a config file in `configs/data/` and a source
data file in the path specified there. No Python edits needed.
"""

import asyncio
import json
import sys
import uuid
from collections import defaultdict
from pathlib import Path
from typing import Any

from openai import AsyncOpenAI
from sqlalchemy import text

from src.config import settings
from src.db.models import Base, Entity
from src.db.session import async_session_factory, engine

CONFIGS_DIR = Path(__file__).resolve().parent.parent.parent / "configs" / "data"


def load_data_config(config_id: str) -> dict[str, Any]:
    """Load a data config by its internal 'id' field.

    Scans all JSON files in configs/data/ and matches by the 'id' field
    inside the file. Falls back to filename match for backward compat.
    """
    if CONFIGS_DIR.exists():
        for f in CONFIGS_DIR.glob("*.json"):
            try:
                with open(f) as fp:
                    cfg = json.load(fp)
                if cfg.get("id") == config_id:
                    return cfg
            except (json.JSONDecodeError, KeyError):
                continue

    # Fallback: filename match
    path = CONFIGS_DIR / f"{config_id}.json"
    if path.exists():
        with open(path) as f:
            return json.load(f)

    raise FileNotFoundError(f"Data config not found for id: {config_id}")


def load_source_data(source_cfg: dict) -> list[dict]:
    stype = source_cfg.get("type")
    if stype == "json_file":
        p = Path(source_cfg["path"])
        if not p.exists():
            raise FileNotFoundError(f"Source file not found: {p}")
        with open(p) as f:
            return json.load(f)
    raise NotImplementedError(f"Source type {stype} not yet supported")


def apply_field_map(source: dict, field_map: dict) -> dict:
    """Transform a source record using field_map. Maps target_field -> source_field."""
    out = {}
    for target_field, source_field in field_map.items():
        out[target_field] = source.get(source_field)
    return out


def render_embedding_text(record: dict, template: str) -> str:
    """Fill the embedding template with all available fields from the record.

    Uses format_map with a defaultdict so missing template keys produce empty
    strings instead of raising KeyError.
    """
    safe = defaultdict(str, {k: str(v) if v is not None else "" for k, v in record.items()})
    return template.format_map(safe)


async def embed_all(texts: list[str], openai: AsyncOpenAI, model: str) -> list[list[float]]:
    """Batch embeddings for a list of texts."""
    out: list[list[float]] = []
    for i in range(0, len(texts), 50):
        batch = texts[i : i + 50]
        resp = await openai.embeddings.create(model=model, input=batch)
        out.extend([d.embedding for d in resp.data])
        print(f"  Embedded {i + 1}-{min(i + 50, len(texts))}/{len(texts)}")
    return out


async def clear_entities(entity_type: str | None = None) -> None:
    """Clear entities from the database. If entity_type given, only clear that type."""
    async with async_session_factory() as db:
        if entity_type:
            await db.execute(text("DELETE FROM entities WHERE entity_type = :t"), {"t": entity_type})
        else:
            await db.execute(text("DELETE FROM entities"))
        await db.commit()


async def run_ingest(config_id: str, skip_graph: bool = False) -> None:
    print("=" * 60)
    print(f"  Config-driven Ingestion: {config_id}")
    print("=" * 60)

    cfg = load_data_config(config_id)
    source_records = load_source_data(cfg["source"])
    print(f"\nLoaded {len(source_records)} records from source")

    entity_cfg = cfg["entity"]
    entity_type = entity_cfg["name"]
    field_map = entity_cfg["field_map"]
    primary_key_field = entity_cfg.get("primary_key_field", "sku")

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await clear_entities(entity_type)

    # Transform: map source fields, extract name/description, put rest in data JSONB
    transformed = []
    for raw in source_records:
        mapped = apply_field_map(raw, field_map)
        eid = uuid.uuid4()
        external_id = str(mapped.get(primary_key_field) or mapped.get("sku") or mapped.get("name") or f"E-{str(eid)[:8]}")
        name = str(mapped.get("name") or "(unnamed)")
        description = str(mapped.get("description") or "")
        image_url = mapped.get("image_url")

        # Everything goes into data — including name/description for tool access
        data = {k: v for k, v in mapped.items() if v is not None}

        transformed.append({
            "id": eid,
            "entity_type": entity_type,
            "external_id": external_id,
            "name": name,
            "description": description,
            "data": data,
            "image_url": image_url,
        })

    # Embeddings — template uses all mapped field names
    emb_cfg = cfg["embeddings"]
    template = emb_cfg["template"]
    texts = [render_embedding_text(e["data"], template) for e in transformed]
    print(f"\nGenerating {len(texts)} embeddings (model={emb_cfg['model']})...")
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    embeddings = await embed_all(texts, client, emb_cfg["model"])

    # Insert
    display_name = entity_cfg.get("display_name", entity_type)
    print(f"\nInserting {len(transformed)} {display_name} entities...")
    async with async_session_factory() as db:
        for ent, emb in zip(transformed, embeddings):
            db.add(Entity(
                id=ent["id"],
                entity_type=ent["entity_type"],
                external_id=ent["external_id"],
                name=ent["name"],
                description=ent["description"],
                data=ent["data"],
                image_url=ent["image_url"],
                embedding=emb,
            ))
        await db.commit()
    print(f"  Inserted {len(transformed)} entities")

    # Graph seeding removed (AGE no longer required).
    # graph_cfg in data config JSON is ignored.

    print()
    print("=" * 60)
    print(f"  Ingestion complete: {len(transformed)} {display_name} entities")
    print("=" * 60)


if __name__ == "__main__":
    config_id = sys.argv[1] if len(sys.argv) > 1 else "ace-hardware"
    asyncio.run(run_ingest(config_id))
