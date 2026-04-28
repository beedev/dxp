"""Entity catalog endpoints (backward-compatible at /products)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.tools.search import semantic_search
from src.db.models import Entity
from src.db.session import get_db

router = APIRouter()


@router.get("/products/search")
async def search_products(
    q: str = Query(..., description="Natural-language query, e.g. 'cordless drill under $150'"),
    max_price: float | None = Query(default=None, description="Max unit price (decimal)"),
    min_rating: float | None = None,
    limit: int = Query(default=10, le=25),
):
    """Semantic product search via pgvector + embeddings.

    Same backend the embedded chat's `search_products` tool uses — exposed
    over HTTP so external agents (BFF proxy → ChatGPT, MCP clients) see
    identical results, eliminating SKU/price drift.

    Returns a compact, agent-friendly shape that drops straight into UCP
    `LineItemRef`: `id` is the SKU, `price_cents` is minor units.

    No `category` parameter — embeddings already capture semantic relevance,
    and exposing an exact-match filter just punishes agents whose taxonomy
    differs from ours. Put category-like terms in `q`.
    """
    results = await semantic_search(
        query=q,
        entity_type="product",
        max_price=max_price,
        min_rating=min_rating,
        limit=limit,
    )

    items: list[dict] = []
    for e in results:
        d = e.get("data") or {}
        price = d.get("price")
        items.append({
            "id": e.get("external_id") or str(e.get("id")),
            "sku": e.get("external_id"),
            "name": e.get("name"),
            "brand": d.get("brand"),
            "category": d.get("category"),
            "price_cents": int(round(price * 100)) if price is not None else None,
            "description": e.get("description"),
            "rating": d.get("rating"),
            "review_count": d.get("review_count"),
            "image_url": e.get("image_url"),
        })
    return {"count": len(items), "products": items}


@router.get("/products")
async def list_products(
    entity_type: str | None = None,
    limit: int = Query(default=20, le=100),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List entities, optionally filtered by entity_type and JSONB data fields.

    Any query param not in {entity_type, limit, offset} is treated as a filter
    on Entity.data (e.g. ?brand=Acme filters data->>'brand' = 'Acme').
    """
    query = select(Entity)
    if entity_type:
        query = query.where(Entity.entity_type == entity_type)
    query = query.order_by(Entity.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    entities = result.scalars().all()
    return [_entity_to_dict(e) for e in entities]


@router.get("/products/{entity_id}")
async def get_product(entity_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Entity).where(Entity.id == uuid.UUID(entity_id))
    )
    entity = result.scalar_one_or_none()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    return _entity_to_dict(entity)


def _entity_to_dict(e: Entity) -> dict:
    return {
        "id": str(e.id),
        "entity_type": e.entity_type,
        "external_id": e.external_id,
        "name": e.name,
        "description": e.description,
        "data": e.data,
        "image_url": e.image_url,
    }
