"""Entity catalog endpoints (backward-compatible at /products)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Entity
from src.db.session import get_db

router = APIRouter()


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
