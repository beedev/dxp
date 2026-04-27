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

APP_ROOT = Path(__file__).resolve().parent.parent.parent
CONFIGS_DIR = APP_ROOT / "configs" / "data"
PERSONA_CONFIGS_DIR = APP_ROOT / "configs"


def load_data_config(config_id: str) -> dict[str, Any]:
    """Load a data config by its internal 'id' field.

    First checks persona configs for an inline 'data' block (merged format).
    Falls back to separate configs/data/ directory (legacy format).
    """
    # Primary: look for 'data' block inside persona config (merged format)
    if PERSONA_CONFIGS_DIR.exists():
        for f in PERSONA_CONFIGS_DIR.glob("*.json"):
            try:
                with open(f) as fp:
                    cfg = json.load(fp)
                if cfg.get("id") == config_id and cfg.get("data"):
                    # Return the data block shaped like a standalone data config
                    data = dict(cfg["data"])
                    data["id"] = config_id
                    if "entity" in data:
                        data["entity"]["display_name"] = data["entity"].get("display_name", data["entity"].get("name", ""))
                        data["entity"]["display_name_plural"] = data["entity"].get("display_name_plural", data["entity"].get("name", "") + "s")
                    return data
            except (json.JSONDecodeError, KeyError):
                continue

    # Fallback: separate configs/data/ directory (legacy format)
    if CONFIGS_DIR.exists():
        for f in CONFIGS_DIR.glob("*.json"):
            try:
                with open(f) as fp:
                    cfg = json.load(fp)
                if cfg.get("id") == config_id:
                    return cfg
            except (json.JSONDecodeError, KeyError):
                continue

    raise FileNotFoundError(f"Data config not found for id: {config_id}")


def load_source_data(source_cfg: dict) -> list[dict]:
    stype = source_cfg.get("type")
    if stype == "json_file":
        raw = source_cfg["path"]
        p = Path(raw)
        # Relative paths resolve against the conv-assistant app root, so
        # personas can reference configs/data/<file>.json from any CWD.
        if not p.is_absolute():
            p = APP_ROOT / p
        if not p.exists():
            raise FileNotFoundError(f"Source file not found: {p}")
        with open(p) as f:
            return json.load(f)
    raise NotImplementedError(f"Source type {stype} not yet supported")


def _resolve_dotted(record: dict, path: str) -> Any:
    """Read a possibly-dotted path from a nested dict (e.g. 'billedAmount.value')."""
    cur: Any = record
    for part in path.split("."):
        if not isinstance(cur, dict):
            return None
        cur = cur.get(part)
    return cur


def apply_field_map(source: dict, field_map: dict) -> dict:
    """Transform a source record using field_map. Maps target_field -> source_field.

    Source paths support dotted access for nested BFF responses
    (e.g. `billedAmount.value` flattens to `billed_amount`).
    """
    out = {}
    for target_field, source_field in field_map.items():
        out[target_field] = _resolve_dotted(source, source_field) if isinstance(source_field, str) else None
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


def _normalize_to_sources(cfg: dict) -> list[dict]:
    """Return a uniform list of per-entity_type source specs.

    Supports two persona schemas:
    - Multi-source (new): cfg["sources"] = [{entity_type, source, field_map, ...}, ...]
    - Single-entity (legacy): cfg["source"] + cfg["entity"] + cfg["embeddings"]["template"]
    """
    if cfg.get("sources"):
        return list(cfg["sources"])

    entity = cfg.get("entity") or {}
    legacy = {
        "entity_type": entity.get("name"),
        "display_name": entity.get("display_name", entity.get("name", "")),
        "display_name_plural": entity.get("display_name_plural", entity.get("name", "") + "s"),
        "source": cfg.get("source", {}),
        "primary_key_field": entity.get("primary_key_field", "sku"),
        "field_map": entity.get("field_map", {}),
        "card_layout": entity.get("card_layout"),
        "action": entity.get("action"),
        "embedding_template": (cfg.get("embeddings") or {}).get(
            "template", "{name}"
        ),
    }
    return [legacy] if legacy["entity_type"] else []


async def _ingest_one_source(spec: dict, emb_cfg: dict, openai: AsyncOpenAI) -> int:
    entity_type = spec["entity_type"]
    field_map = spec["field_map"]
    primary_key_field = spec.get("primary_key_field") or next(iter(field_map), "id")
    template = spec.get("embedding_template") or "{name}"

    print(f"\n--- {entity_type} ---")
    source_records = load_source_data(spec["source"])
    print(f"Loaded {len(source_records)} records")

    if not source_records:
        await clear_entities(entity_type)
        return 0

    transformed = []
    for raw in source_records:
        mapped = apply_field_map(raw, field_map)
        eid = uuid.uuid4()
        external_id = str(
            mapped.get(primary_key_field)
            or mapped.get("name")
            or f"E-{str(eid)[:8]}"
        )
        name = str(mapped.get("name") or "(unnamed)")
        description = str(mapped.get("description") or "")
        image_url = mapped.get("image_url")
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

    texts = [render_embedding_text(e["data"], template) for e in transformed]
    print(f"Embedding {len(texts)} {entity_type} records (model={emb_cfg['model']})...")
    embeddings = await embed_all(texts, openai, emb_cfg["model"])

    await clear_entities(entity_type)
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

    print(f"Inserted {len(transformed)} {entity_type} entities")
    return len(transformed)


async def run_ingest(config_id: str, skip_graph: bool = False) -> None:
    print("=" * 60)
    print(f"  Config-driven Ingestion: {config_id}")
    print("=" * 60)

    cfg = load_data_config(config_id)
    sources = _normalize_to_sources(cfg)
    if not sources:
        raise ValueError(f"No data sources declared in persona '{config_id}'")

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    emb_cfg = cfg.get("embeddings") or {"provider": "openai", "model": "text-embedding-3-small", "dimensions": 1536}
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    total = 0
    for spec in sources:
        total += await _ingest_one_source(spec, emb_cfg, client)
    print(f"\nTotal: {total} entities across {len(sources)} type(s)")

    # Graph seeding removed (AGE no longer required).
    # graph_cfg in data config JSON is ignored.

    print()
    print("=" * 60)
    print(f"  Ingestion complete: {total} entities across {len(sources)} type(s)")
    print("=" * 60)


if __name__ == "__main__":
    config_id = sys.argv[1] if len(sys.argv) > 1 else settings.agentic_config_id
    asyncio.run(run_ingest(config_id))
