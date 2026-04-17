"""Ace Hardware catalog ingestion.

Replaces the demo product catalog (42 footwear/electronics/home-goods items)
with the real Ace Hardware catalog (50 products across paint, tools, plumbing,
electrical, outdoor, hardware, seasonal categories).

Regenerates:
- products table with embeddings
- product_reviews table
- Demo user preferences (Ace-relevant brands: DeWalt, Benjamin Moore, Moen, etc.)

Usage:
    python -m src.db.ingest_ace
"""

import asyncio
import json
import random
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from openai import AsyncOpenAI
from sqlalchemy import delete, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.db.models import (
    Base,
    Coupon,
    Product,
    ProductReview,
    User,
    UserPreference,
)
from src.db.session import async_session_factory, engine

# Path to JSON exported from mock-products.ts
ACE_PRODUCTS_JSON = Path("/tmp/ace_products.json")

# Ace-specific coupons aligned with the real catalog
ACE_COUPONS = [
    {"code": "PAINT15", "desc": "15% off paint and supplies", "type": "percentage", "value": 15, "categories": ["paint"]},
    {"code": "TOOL20", "desc": "20% off power tools $100+", "type": "percentage", "value": 20, "categories": ["tools"], "min": 100},
    {"code": "DIY10", "desc": "$10 off any order over $75", "type": "fixed", "value": 10, "categories": None, "min": 75},
    {"code": "SPRINGYARD", "desc": "15% off outdoor equipment", "type": "percentage", "value": 15, "categories": ["outdoor"]},
    {"code": "PLUMB5", "desc": "$5 off plumbing supplies", "type": "fixed", "value": 5, "categories": ["plumbing"]},
    {"code": "WATTSAVE", "desc": "10% off electrical items", "type": "percentage", "value": 10, "categories": ["electrical"]},
    {"code": "ACEREWARDS", "desc": "$5 off for Ace Rewards members", "type": "fixed", "value": 5, "categories": None},
    {"code": "FREESHIP50", "desc": "Free shipping on $50+", "type": "fixed", "value": 5.99, "categories": None, "min": 50},
    {"code": "DEWALT25", "desc": "25% off DeWalt tools", "type": "percentage", "value": 25, "categories": ["tools"], "brands": ["DeWalt"]},
    {"code": "SEASONAL", "desc": "30% off seasonal items", "type": "percentage", "value": 30, "categories": ["seasonal"]},
]

# Ace-relevant demo users replacing the old footwear-focused ones
ACE_USERS = [
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "email": "alex@acecustomer.com",
        "name": "Alex (DIY Enthusiast)",
        "spend_limit": 500.00,
        "preferences": [
            {"type": "brand", "category": "tools", "key": "DeWalt", "value": {"preferred": True}, "confidence": 0.9},
            {"type": "brand", "category": "tools", "key": "Milwaukee", "value": {"preferred": True}, "confidence": 0.85},
            {"type": "style", "category": None, "key": "professional-grade", "value": {"preferred": True}, "confidence": 0.8},
            {"type": "budget", "category": "tools", "key": "range", "value": {"min": 50, "max": 500}, "confidence": 0.8},
        ],
    },
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "email": "jordan@acecustomer.com",
        "name": "Jordan (Home Renovator)",
        "spend_limit": 1000.00,
        "preferences": [
            {"type": "brand", "category": "paint", "key": "Benjamin Moore", "value": {"preferred": True}, "confidence": 0.95},
            {"type": "brand", "category": "plumbing", "key": "Moen", "value": {"preferred": True}, "confidence": 0.85},
            {"type": "style", "category": None, "key": "premium-quality", "value": {"preferred": True}, "confidence": 0.9},
            {"type": "exclusion", "category": None, "key": "cheap-plastic", "value": {"excluded": True}, "confidence": 0.8},
        ],
    },
    {
        "id": "33333333-3333-3333-3333-333333333333",
        "email": "sam@acecustomer.com",
        "name": "Sam (Weekend Warrior)",
        "spend_limit": 300.00,
        "preferences": [
            {"type": "style", "category": None, "key": "budget-friendly", "value": {"preferred": True}, "confidence": 0.8},
            {"type": "style", "category": None, "key": "beginner-friendly", "value": {"preferred": True}, "confidence": 0.7},
            {"type": "budget", "category": None, "key": "range", "value": {"min": 10, "max": 150}, "confidence": 0.85},
        ],
    },
]


REVIEW_PROS = [
    "Excellent build quality", "Great value for money", "Easy to use",
    "Reliable performance", "Durable construction", "Long-lasting battery",
    "Fits perfectly", "Professional finish", "Quiet operation",
    "Easy assembly", "Great for DIY projects", "Strong and sturdy",
]
REVIEW_CONS = [
    "Slightly expensive", "Packaging could be better", "Limited color options",
    "Takes practice to master", "Heavier than expected", "No carrying case",
    "Instructions could be clearer", "Battery not included",
]


def generate_review(product: dict) -> dict:
    num_pros = random.randint(2, 4)
    num_cons = random.randint(1, 2)
    return {
        "summary": (
            f"The {product['brand']} {product['name']} is highly rated by Ace Hardware "
            f"customers for its performance and value at ${product['price']:.2f}."
        ),
        "pros": random.sample(REVIEW_PROS, num_pros),
        "cons": random.sample(REVIEW_CONS, num_cons),
        "avg_rating": product["rating"],
        "total_reviews": product.get("reviewCount", random.randint(50, 2000)),
    }


def transform_ace_product(ace: dict) -> dict:
    """Convert Ace mock-products format to our Product schema."""
    original_price = ace.get("msrp") if ace.get("msrp", 0) > ace["price"] else None
    return {
        "id": uuid.uuid4(),
        "sku": ace["sku"],
        "name": ace["name"],
        "brand": ace["brand"],
        "category": ace["category"],
        "subcategory": ace["category"],  # Ace catalog uses same values
        "description": ace["description"],
        "price": ace["price"],
        "original_price": original_price,
        "attributes": ace.get("specs", {}),
        "rating": ace["rating"],
        "review_count": ace.get("reviewCount", 0),
        "in_stock": True,
        "image_url": ace.get("imageUrl"),
        "review_data": generate_review(ace),
    }


async def generate_embeddings_batch(texts: list[str], client: AsyncOpenAI) -> list[list[float]]:
    all_embeddings: list[list[float]] = []
    batch_size = 50
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        response = await client.embeddings.create(
            model=settings.embedding_model,
            input=batch,
        )
        all_embeddings.extend([d.embedding for d in response.data])
        print(f"  Embeddings {i + 1}-{min(i + batch_size, len(texts))}/{len(texts)}")
    return all_embeddings


async def clear_existing_data() -> None:
    """Wipe product, review, user, coupon data. Preserve sessions/messages."""
    print("\nClearing existing data...")
    async with async_session_factory() as db:
        await db.execute(text("DELETE FROM product_reviews"))
        await db.execute(text("DELETE FROM user_preferences"))
        await db.execute(text("DELETE FROM orders"))
        await db.execute(text("DELETE FROM agent_steps"))
        await db.execute(text("DELETE FROM messages"))
        await db.execute(text("DELETE FROM agent_sessions"))
        await db.execute(text("DELETE FROM users"))
        await db.execute(text("DELETE FROM products"))
        await db.execute(text("DELETE FROM coupons"))
        await db.commit()
        print("  Relational tables cleared")


async def ingest() -> None:
    print("=" * 60)
    print("  Ace Hardware Catalog Ingestion")
    print("=" * 60)

    if not ACE_PRODUCTS_JSON.exists():
        print(f"ERROR: {ACE_PRODUCTS_JSON} not found. Run the Node export first.")
        return

    with open(ACE_PRODUCTS_JSON) as f:
        raw_products = json.load(f)
    print(f"\nLoaded {len(raw_products)} products from {ACE_PRODUCTS_JSON}")

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Clear old data
    await clear_existing_data()

    # Transform
    transformed = [transform_ace_product(p) for p in raw_products]

    # Generate embeddings
    print(f"\nGenerating embeddings for {len(transformed)} products...")
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    texts = [
        f"{p['name']} by {p['brand']}. Category: {p['category']}. "
        f"{p['description']} Specs: {p['attributes']}"
        for p in transformed
    ]
    embeddings = await generate_embeddings_batch(texts, client)

    # Insert products + reviews
    print("\nInserting products and reviews...")
    async with async_session_factory() as db:
        for prod, emb in zip(transformed, embeddings):
            product = Product(
                id=prod["id"],
                sku=prod["sku"],
                name=prod["name"],
                brand=prod["brand"],
                category=prod["category"],
                subcategory=prod["subcategory"],
                description=prod["description"],
                price=prod["price"],
                original_price=prod["original_price"],
                attributes=prod["attributes"],
                rating=prod["rating"],
                review_count=prod["review_count"],
                in_stock=prod["in_stock"],
                image_url=prod["image_url"],
                embedding=emb,
            )
            db.add(product)
            rv = prod["review_data"]
            db.add(ProductReview(
                product_id=prod["id"],
                summary=rv["summary"],
                pros=rv["pros"],
                cons=rv["cons"],
                avg_rating=rv["avg_rating"],
                total_reviews=rv["total_reviews"],
            ))
        await db.commit()
        print(f"  Inserted {len(transformed)} products + reviews")

    # Insert users + preferences
    print("\nCreating Ace demo users...")
    async with async_session_factory() as db:
        for u in ACE_USERS:
            db.add(User(
                id=uuid.UUID(u["id"]),
                email=u["email"],
                display_name=u["name"],
                spend_limit=u["spend_limit"],
            ))
            for pref in u["preferences"]:
                db.add(UserPreference(
                    user_id=uuid.UUID(u["id"]),
                    preference_type=pref["type"],
                    category=pref.get("category"),
                    key=pref["key"],
                    value=pref["value"],
                    confidence=pref["confidence"],
                ))
        await db.commit()
        print(f"  Created {len(ACE_USERS)} users with preferences")

    # Insert coupons
    print("\nCreating Ace coupons...")
    async with async_session_factory() as db:
        now = datetime.now(timezone.utc)
        for c in ACE_COUPONS:
            db.add(Coupon(
                code=c["code"],
                description=c["desc"],
                discount_type=c["type"],
                discount_value=c["value"],
                min_purchase=c.get("min"),
                applicable_categories=c.get("categories"),
                applicable_brands=c.get("brands"),
                valid_from=now,
                valid_until=now + timedelta(days=365),
                is_active=True,
            ))
        await db.commit()
        print(f"  Created {len(ACE_COUPONS)} coupons")

    # Graph seeding removed (Apache AGE no longer required)
    print("\nGraph seeding skipped (AGE not enabled)")

    # Summary
    print("\n" + "=" * 60)
    print("  Ingestion complete!")
    print(f"  Products: {len(transformed)} (across {len({p['category'] for p in transformed})} categories)")
    print(f"  Users: {len(ACE_USERS)}")
    print(f"  Coupons: {len(ACE_COUPONS)}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(ingest())
