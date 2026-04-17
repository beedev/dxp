"""Order management endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Order
from src.db.session import get_db

router = APIRouter()


@router.get("/orders")
async def list_orders(
    user_id: str | None = None,
    limit: int = Query(default=20, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Order).order_by(Order.created_at.desc()).limit(limit)
    if user_id:
        query = query.where(Order.user_id == uuid.UUID(user_id))
    result = await db.execute(query)
    orders = result.scalars().all()
    return [_order_to_dict(o) for o in orders]


@router.get("/orders/{order_id}")
async def get_order(order_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == uuid.UUID(order_id)))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _order_to_dict(order)


def _order_to_dict(o: Order) -> dict:
    return {
        "id": str(o.id),
        "session_id": str(o.session_id),
        "user_id": str(o.user_id),
        "items": o.items,
        "subtotal": float(o.subtotal),
        "discount": float(o.discount),
        "shipping": float(o.shipping),
        "total": float(o.total),
        "coupon_applied": o.coupon_applied,
        "loyalty_points_used": o.loyalty_points_used,
        "shipping_method": o.shipping_method,
        "status": o.status,
        "created_at": o.created_at.isoformat(),
    }
