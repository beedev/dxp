"""User preference management tools."""

import uuid
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import User, UserPreference
from src.db.session import async_session_factory


async def get_user_preferences(user_id: str) -> dict[str, Any]:
    """Load all preferences for a user, organized by type.

    Returns a dict like:
    {
        "sizes": {"shoes": "10.5W", "shirts": "L"},
        "preferred_brands": ["Altra", "Hoka"],
        "styles": ["minimalist", "sustainable"],
        "budget_ranges": {"shoes": [80, 180]},
        "exclusions": ["leather"],
        "spend_limit": 200.0
    }
    """
    async with async_session_factory() as db:
        # Get user's spend limit
        user_result = await db.execute(
            select(User).where(User.id == uuid.UUID(user_id))
        )
        user = user_result.scalar_one_or_none()
        spend_limit = float(user.spend_limit) if user else 200.0

        # Get preferences
        result = await db.execute(
            select(UserPreference)
            .where(UserPreference.user_id == uuid.UUID(user_id))
            .order_by(UserPreference.confidence.desc())
        )
        prefs = result.scalars().all()

        organized: dict[str, Any] = {
            "sizes": {},
            "preferred_brands": [],
            "styles": [],
            "budget_ranges": {},
            "exclusions": [],
            "spend_limit": spend_limit,
        }

        for p in prefs:
            if p.preference_type == "size":
                organized["sizes"][p.category or "general"] = p.value
            elif p.preference_type == "brand":
                organized["preferred_brands"].append(
                    {"name": p.key, "category": p.category, "confidence": p.confidence}
                )
            elif p.preference_type == "style":
                organized["styles"].append(
                    {"name": p.key, "confidence": p.confidence}
                )
            elif p.preference_type == "budget":
                organized["budget_ranges"][p.category or "general"] = p.value
            elif p.preference_type == "exclusion":
                organized["exclusions"].append(p.key)

        return organized


async def upsert_user_preference(
    user_id: str,
    preference_type: str,
    key: str,
    value: dict[str, Any] | None = None,
    category: str | None = None,
    confidence_delta: float = 0.1,
    max_confidence: float = 0.99,
) -> dict[str, Any]:
    """Insert a new preference or strengthen an existing one.

    If a preference with the same (user_id, type, category, key) already exists,
    increase its confidence by `confidence_delta` (capped at `max_confidence`).
    Otherwise insert a new preference with confidence = confidence_delta.
    """
    async with async_session_factory() as db:
        # Look up existing
        stmt = select(UserPreference).where(
            UserPreference.user_id == uuid.UUID(user_id),
            UserPreference.preference_type == preference_type,
            UserPreference.key == key,
        )
        if category is not None:
            stmt = stmt.where(UserPreference.category == category)
        else:
            stmt = stmt.where(UserPreference.category.is_(None))

        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            new_conf = min(
                max_confidence, float(existing.confidence) + confidence_delta
            )
            existing.confidence = new_conf
            if value is not None:
                existing.value = value
            await db.commit()
            return {
                "action": "strengthened",
                "key": key,
                "type": preference_type,
                "category": category,
                "confidence": round(new_conf, 3),
            }
        else:
            pref = UserPreference(
                user_id=uuid.UUID(user_id),
                preference_type=preference_type,
                category=category,
                key=key,
                value=value or {},
                confidence=min(max_confidence, max(0.1, confidence_delta)),
            )
            db.add(pref)
            await db.commit()
            return {
                "action": "created",
                "key": key,
                "type": preference_type,
                "category": category,
                "confidence": round(pref.confidence, 3),
            }
