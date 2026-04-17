"""Entity detail tools (generic replacement for product-only lookups)."""

import uuid
from typing import Any

from sqlalchemy import select

from src.db.models import Entity
from src.db.session import async_session_factory


async def get_entity_details(entity_id: str) -> dict[str, Any] | None:
    """Get full entity details by primary key.

    Returns:
        Dict with id, entity_type, external_id, name, description, data, image_url
        or None if not found.
    """
    async with async_session_factory() as db:
        result = await db.execute(
            select(Entity).where(Entity.id == uuid.UUID(entity_id))
        )
        entity = result.scalar_one_or_none()
        if not entity:
            return None

        return {
            "id": str(entity.id),
            "entity_type": entity.entity_type,
            "external_id": entity.external_id,
            "name": entity.name,
            "description": entity.description,
            "data": entity.data or {},
            "image_url": entity.image_url,
        }


# Backward-compatible alias
get_product_details = get_entity_details
