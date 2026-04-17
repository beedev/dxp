"""Pricing and deal optimization tools."""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Coupon
from src.db.session import async_session_factory


async def find_applicable_coupons(
    categories: list[str], brands: list[str]
) -> list[dict[str, Any]]:
    """Find coupons applicable to the given product categories and brands."""
    async with async_session_factory() as db:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(Coupon).where(
                and_(
                    Coupon.is_active == True,
                    Coupon.valid_from <= now,
                    Coupon.valid_until >= now,
                )
            )
        )
        all_coupons = result.scalars().all()

        applicable = []
        for c in all_coupons:
            # Check category match
            if c.applicable_categories:
                cat_list = c.applicable_categories if isinstance(c.applicable_categories, list) else []
                if cat_list and not any(cat in cat_list for cat in categories):
                    continue

            # Check brand match
            if c.applicable_brands:
                brand_list = c.applicable_brands if isinstance(c.applicable_brands, list) else []
                if brand_list and not any(b in brand_list for b in brands):
                    continue

            applicable.append({
                "code": c.code,
                "description": c.description,
                "discount_type": c.discount_type,
                "discount_value": float(c.discount_value),
                "min_purchase": float(c.min_purchase) if c.min_purchase else 0,
            })

        return applicable


async def get_loyalty_balance(user_id: str) -> dict[str, Any]:
    """Get user's loyalty points balance (simulated for POC)."""
    # Simulated loyalty balance based on user
    # In production, this would call the loyalty API
    return {
        "points": 500,
        "value": 5.00,
        "tier": "Silver",
    }


def calculate_best_deal(
    price: float,
    coupons: list[dict[str, Any]],
    loyalty_balance: dict[str, Any],
) -> dict[str, Any]:
    """Calculate the best combination of discounts."""
    best_discount = 0.0
    best_coupon = None

    for coupon in coupons:
        if coupon.get("min_purchase", 0) > price:
            continue

        if coupon["discount_type"] == "percentage":
            discount = price * (coupon["discount_value"] / 100)
        elif coupon["discount_type"] == "fixed":
            discount = coupon["discount_value"]
        else:
            discount = 0

        if discount > best_discount:
            best_discount = discount
            best_coupon = coupon

    loyalty_value = min(loyalty_balance.get("value", 0), price - best_discount)

    return {
        "original_price": price,
        "coupon_discount": best_discount,
        "coupon_code": best_coupon["code"] if best_coupon else None,
        "loyalty_discount": loyalty_value,
        "total": max(0, price - best_discount - loyalty_value),
        "total_savings": best_discount + loyalty_value,
    }
