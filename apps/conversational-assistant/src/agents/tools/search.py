"""Semantic entity search using pgvector embeddings."""

from typing import Any

from openai import AsyncOpenAI
from sqlalchemy import text

from src.config import settings
from src.db.models import Entity
from src.db.session import async_session_factory

_openai_client: AsyncOpenAI | None = None


def _get_openai() -> AsyncOpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _openai_client


async def get_embedding(text_input: str) -> list[float]:
    """Generate an embedding vector for the given text."""
    client = _get_openai()
    response = await client.embeddings.create(
        model=settings.embedding_model,
        input=text_input,
    )
    return response.data[0].embedding


# ---------------------------------------------------------------------------
# Filter key validation — only these keys are allowed in JSONB queries.
# Prevents SQL injection via filter key interpolation.
# ---------------------------------------------------------------------------
import re

_ALLOWED_FILTER_KEYS = {
    "category", "brand", "sector", "asset_class", "risk_level",
    "coverage_type", "provider", "exchange", "currency",
    "max_price", "min_rating",
}

_KEY_PATTERN = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")


async def semantic_search(
    query: str,
    *,
    entity_type: str | list[str] | None = None,
    filters: dict[str, Any] | None = None,
    limit: int = 20,
    # Legacy keyword args for backward compatibility
    category: str | None = None,
    max_price: float | None = None,
    min_rating: float | None = None,
) -> list[dict[str, Any]]:
    """Search entities using semantic similarity via pgvector.

    Args:
        query: Natural language search query.
        entity_type: Optional entity type filter (e.g. "product").
        filters: Generic JSONB filters — string keys are matched with ``=``,
                 keys in ``_NUMERIC_FILTER_KEYS`` use ``<=`` / ``>=``.
        limit: Maximum number of results.
        category: (legacy) Shorthand for ``filters={"category": ...}``.
        max_price: (legacy) Shorthand for a numeric ``<=`` filter on ``price``.
        min_rating: (legacy) Shorthand for a numeric ``>=`` filter on ``rating``.

    Returns:
        List of entity dicts ranked by semantic similarity.
    """
    # Merge legacy kwargs into the generic filters dict
    merged: dict[str, Any] = dict(filters) if filters else {}
    if category and "category" not in merged:
        merged["category"] = category
    if max_price is not None and "max_price" not in merged:
        merged["max_price"] = max_price
    if min_rating is not None and "min_rating" not in merged:
        merged["min_rating"] = min_rating

    # Generate query embedding
    query_embedding = await get_embedding(query)

    async with async_session_factory() as db:
        where_clauses: list[str] = []
        params: dict[str, Any] = {"limit": limit}

        # Entity type filter (column-level, not JSONB). Supports both a single
        # type (legacy) and a list (multi-source personas).
        if entity_type:
            if isinstance(entity_type, str):
                where_clauses.append("e.entity_type = :entity_type")
                params["entity_type"] = entity_type
            elif isinstance(entity_type, (list, tuple)) and entity_type:
                placeholders = []
                for i, t in enumerate(entity_type):
                    key = f"entity_type_{i}"
                    placeholders.append(f":{key}")
                    params[key] = t
                where_clauses.append(
                    f"e.entity_type IN ({', '.join(placeholders)})"
                )

        # JSONB filters — keys are validated against allowlist to prevent injection
        for key, value in merged.items():
            if key not in _ALLOWED_FILTER_KEYS or not _KEY_PATTERN.match(key):
                continue  # skip unknown/unsafe keys
            param_name = f"f_{key}"
            if key == "max_price":
                where_clauses.append(f"(e.data->>'{key.removeprefix('max_')}')::numeric <= :{param_name}")
                params[param_name] = value
            elif key == "min_rating":
                where_clauses.append(f"(e.data->>'{key.removeprefix('min_')}')::numeric >= :{param_name}")
                params[param_name] = value
            else:
                where_clauses.append(f"e.data->>'{key}' = :{param_name}")
                params[param_name] = str(value)

        where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        # Embedding vector: each element is coerced through float() to ensure
        # only numeric values. Safe to interpolate since input is from OpenAI API,
        # not user-controlled, and each element is validated as a float.
        embedding_literal = "[" + ",".join(str(float(x)) for x in query_embedding) + "]"

        sql = text(f"""
            SELECT
                e.id,
                e.entity_type,
                e.external_id,
                e.name,
                e.description,
                e.data,
                e.image_url,
                1 - (e.embedding <=> '{embedding_literal}'::vector) AS relevance
            FROM entities e
            {where_sql}
            ORDER BY relevance DESC
            LIMIT :limit
        """)

        result = await db.execute(sql, params)
        rows = result.mappings().all()

        return [
            {
                "id": str(row["id"]),
                "entity_type": row["entity_type"],
                "external_id": row["external_id"],
                "name": row["name"],
                "description": row["description"],
                "data": row["data"] or {},
                "image_url": row["image_url"],
                "relevance_score": float(row["relevance"]),
            }
            for row in rows
        ]


# Backward-compatible alias so existing callers keep working
semantic_product_search = semantic_search
