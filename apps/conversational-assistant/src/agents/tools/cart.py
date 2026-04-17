"""Cart and order management tools."""

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Order
from src.db.session import async_session_factory


async def create_order(
    session_id: str,
    user_id: str,
    items: list[dict[str, Any]],
    subtotal: float,
    discount: float = 0.0,
    shipping: float = 0.0,
    coupon_code: str | None = None,
    loyalty_points_used: int = 0,
    shipping_method: str = "standard",
) -> dict[str, Any]:
    """Create a simulated order in the database."""
    total = subtotal - discount + shipping

    async with async_session_factory() as db:
        order = Order(
            session_id=uuid.UUID(session_id),
            user_id=uuid.UUID(user_id),
            items=items,
            subtotal=subtotal,
            discount=discount,
            shipping=shipping,
            total=total,
            coupon_applied=coupon_code,
            loyalty_points_used=loyalty_points_used,
            shipping_method=shipping_method,
            status="confirmed",
        )
        db.add(order)
        await db.commit()
        await db.refresh(order)

        return {
            "order_id": str(order.id),
            "total": float(order.total),
            "status": order.status,
            "items": items,
        }
