"""User and preference management endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import User, UserPreference
from src.db.session import get_db

router = APIRouter()


class DemoLoginRequest(BaseModel):
    user_id: str


@router.post("/auth/demo-login")
async def demo_login(req: DemoLoginRequest, db: AsyncSession = Depends(get_db)):
    """Simple demo auth — select a pre-configured user."""
    result = await db.execute(select(User).where(User.id == uuid.UUID(req.user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found")
    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "spend_limit": float(user.spend_limit),
    }


@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db)):
    """List all demo users for the login selector."""
    result = await db.execute(select(User).order_by(User.display_name))
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "display_name": u.display_name,
            "spend_limit": float(u.spend_limit),
        }
        for u in users
    ]


@router.get("/users/{user_id}/preferences")
async def get_preferences(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UserPreference).where(UserPreference.user_id == uuid.UUID(user_id))
    )
    prefs = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "type": p.preference_type,
            "category": p.category,
            "key": p.key,
            "value": p.value,
            "confidence": p.confidence,
        }
        for p in prefs
    ]


class UpdateSpendLimitRequest(BaseModel):
    spend_limit: float


@router.put("/users/{user_id}/spend-limit")
async def update_spend_limit(
    user_id: str, req: UpdateSpendLimitRequest, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.spend_limit = req.spend_limit
    await db.commit()
    return {"id": str(user.id), "spend_limit": float(user.spend_limit)}
