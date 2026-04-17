"""Seed data generation for Agentic Commerce POC.

Generates 800+ products with embeddings, coupons, demo users, and review summaries.

Usage:
    python -m src.db.seed
"""

import asyncio
import json
import random
import uuid
from datetime import datetime, timedelta, timezone

from openai import AsyncOpenAI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.db.models import Base, Coupon, Product, ProductReview, User, UserPreference
from src.db.session import async_session_factory, engine

# ── Product Catalog Data ──────────────────────────────────────────────

FOOTWEAR = {
    "brands": ["Nike", "Altra", "Hoka", "Brooks", "New Balance", "Salomon", "Asics", "Saucony"],
    "subcategories": ["Trail Running", "Road Running", "Hiking", "Walking", "Cross Training"],
    "features": ["cushioning", "stability", "lightweight", "waterproof", "wide-fit", "breathable", "durable", "zero-drop"],
    "products": [
        {"name": "Speedgoat 6", "brand": "Hoka", "sub": "Trail Running", "price": 154.99, "rating": 4.7, "features": ["cushioning", "durable", "wide-fit"]},
        {"name": "Lone Peak 8", "brand": "Altra", "sub": "Trail Running", "price": 139.99, "rating": 4.6, "features": ["zero-drop", "wide-fit", "durable"]},
        {"name": "Ultra Glide 2", "brand": "Salomon", "sub": "Trail Running", "price": 149.99, "rating": 4.5, "features": ["lightweight", "cushioning", "breathable"]},
        {"name": "Pegasus 41", "brand": "Nike", "sub": "Road Running", "price": 129.99, "rating": 4.5, "features": ["cushioning", "breathable", "lightweight"]},
        {"name": "Ghost 16", "brand": "Brooks", "sub": "Road Running", "price": 139.99, "rating": 4.6, "features": ["cushioning", "stability", "breathable"]},
        {"name": "Fresh Foam X 1080v13", "brand": "New Balance", "sub": "Road Running", "price": 159.99, "rating": 4.7, "features": ["cushioning", "stability", "wide-fit"]},
        {"name": "Gel-Nimbus 26", "brand": "Asics", "sub": "Road Running", "price": 159.99, "rating": 4.5, "features": ["cushioning", "stability", "durable"]},
        {"name": "Clifton 9", "brand": "Hoka", "sub": "Road Running", "price": 144.99, "rating": 4.8, "features": ["cushioning", "lightweight", "breathable"]},
        {"name": "Bondi 8", "brand": "Hoka", "sub": "Walking", "price": 164.99, "rating": 4.6, "features": ["cushioning", "stability", "wide-fit"]},
        {"name": "X Ultra 4 GTX", "brand": "Salomon", "sub": "Hiking", "price": 169.99, "rating": 4.7, "features": ["waterproof", "durable", "stability"]},
        {"name": "Moab 3 Mid", "brand": "Merrell", "sub": "Hiking", "price": 144.99, "rating": 4.4, "features": ["waterproof", "durable", "stability"]},
        {"name": "Kinvara 14", "brand": "Saucony", "sub": "Road Running", "price": 119.99, "rating": 4.5, "features": ["lightweight", "breathable", "zero-drop"]},
        {"name": "Torin 7", "brand": "Altra", "sub": "Road Running", "price": 139.99, "rating": 4.4, "features": ["zero-drop", "cushioning", "wide-fit"]},
        {"name": "Triumph 21", "brand": "Saucony", "sub": "Road Running", "price": 159.99, "rating": 4.6, "features": ["cushioning", "stability", "durable"]},
        {"name": "Metcon 9", "brand": "Nike", "sub": "Cross Training", "price": 134.99, "rating": 4.5, "features": ["stability", "durable", "breathable"]},
    ],
}

ELECTRONICS = {
    "brands": ["Sony", "Apple", "Samsung", "Bose", "Jabra", "Sennheiser", "Google", "Anker"],
    "subcategories": ["Headphones", "Smart Watch", "Tablet", "Speaker", "Earbuds"],
    "features": ["noise-cancelling", "wireless", "waterproof", "long-battery", "hi-res-audio", "fast-charging", "smart-assistant"],
    "products": [
        {"name": "WH-1000XM5", "brand": "Sony", "sub": "Headphones", "price": 349.99, "rating": 4.8, "features": ["noise-cancelling", "wireless", "long-battery", "hi-res-audio"]},
        {"name": "WH-1000XM4", "brand": "Sony", "sub": "Headphones", "price": 198.00, "rating": 4.7, "features": ["noise-cancelling", "wireless", "long-battery"]},
        {"name": "AirPods Max", "brand": "Apple", "sub": "Headphones", "price": 549.00, "rating": 4.6, "features": ["noise-cancelling", "wireless", "hi-res-audio"]},
        {"name": "AirPods Pro 2", "brand": "Apple", "sub": "Earbuds", "price": 249.00, "rating": 4.7, "features": ["noise-cancelling", "wireless", "waterproof"]},
        {"name": "QC Ultra Headphones", "brand": "Bose", "sub": "Headphones", "price": 429.00, "rating": 4.7, "features": ["noise-cancelling", "wireless", "long-battery"]},
        {"name": "Galaxy Buds3 Pro", "brand": "Samsung", "sub": "Earbuds", "price": 229.99, "rating": 4.5, "features": ["noise-cancelling", "wireless", "waterproof"]},
        {"name": "Elite 85h", "brand": "Jabra", "sub": "Headphones", "price": 179.99, "rating": 4.4, "features": ["noise-cancelling", "wireless", "long-battery"]},
        {"name": "Momentum 4", "brand": "Sennheiser", "sub": "Headphones", "price": 349.95, "rating": 4.6, "features": ["noise-cancelling", "wireless", "hi-res-audio"]},
        {"name": "Apple Watch Ultra 2", "brand": "Apple", "sub": "Smart Watch", "price": 799.00, "rating": 4.8, "features": ["waterproof", "long-battery", "smart-assistant"]},
        {"name": "Galaxy Watch 7", "brand": "Samsung", "sub": "Smart Watch", "price": 299.99, "rating": 4.5, "features": ["waterproof", "smart-assistant", "fast-charging"]},
        {"name": "Pixel Watch 3", "brand": "Google", "sub": "Smart Watch", "price": 349.99, "rating": 4.4, "features": ["smart-assistant", "waterproof", "fast-charging"]},
        {"name": "iPad Air M2", "brand": "Apple", "sub": "Tablet", "price": 599.00, "rating": 4.8, "features": ["fast-charging", "long-battery"]},
        {"name": "Galaxy Tab S9", "brand": "Samsung", "sub": "Tablet", "price": 449.99, "rating": 4.6, "features": ["waterproof", "fast-charging"]},
        {"name": "SRS-XB100", "brand": "Sony", "sub": "Speaker", "price": 59.99, "rating": 4.5, "features": ["waterproof", "wireless", "long-battery"]},
        {"name": "Soundcore Motion+", "brand": "Anker", "sub": "Speaker", "price": 79.99, "rating": 4.6, "features": ["wireless", "waterproof", "hi-res-audio"]},
    ],
}

HOME_GOODS = {
    "brands": ["Dyson", "Breville", "iRobot", "Blueair", "KitchenAid", "Cuisinart", "Fellow", "Baratza"],
    "subcategories": ["Coffee Maker", "Air Purifier", "Robot Vacuum", "Kitchen Appliance", "Smart Home"],
    "features": ["smart-app", "quiet", "energy-efficient", "easy-clean", "compact", "programmable", "premium-build"],
    "products": [
        {"name": "V15 Detect", "brand": "Dyson", "sub": "Robot Vacuum", "price": 749.99, "rating": 4.7, "features": ["smart-app", "quiet", "easy-clean"]},
        {"name": "Roomba j7+", "brand": "iRobot", "sub": "Robot Vacuum", "price": 599.99, "rating": 4.5, "features": ["smart-app", "quiet", "easy-clean"]},
        {"name": "Barista Express", "brand": "Breville", "sub": "Coffee Maker", "price": 699.95, "rating": 4.7, "features": ["premium-build", "programmable"]},
        {"name": "Precision Brewer", "brand": "Breville", "sub": "Coffee Maker", "price": 299.95, "rating": 4.6, "features": ["programmable", "easy-clean"]},
        {"name": "Ode Brew Grinder", "brand": "Fellow", "sub": "Coffee Maker", "price": 299.00, "rating": 4.5, "features": ["quiet", "premium-build", "compact"]},
        {"name": "Encore ESP", "brand": "Baratza", "sub": "Coffee Maker", "price": 199.95, "rating": 4.4, "features": ["compact", "easy-clean"]},
        {"name": "Stagg EKG", "brand": "Fellow", "sub": "Coffee Maker", "price": 195.00, "rating": 4.8, "features": ["premium-build", "programmable", "compact"]},
        {"name": "Blue Pure 211i Max", "brand": "Blueair", "sub": "Air Purifier", "price": 339.99, "rating": 4.6, "features": ["quiet", "energy-efficient", "smart-app"]},
        {"name": "Purifier Cool TP07", "brand": "Dyson", "sub": "Air Purifier", "price": 569.99, "rating": 4.5, "features": ["smart-app", "quiet", "premium-build"]},
        {"name": "Artisan Stand Mixer", "brand": "KitchenAid", "sub": "Kitchen Appliance", "price": 449.99, "rating": 4.8, "features": ["premium-build", "easy-clean"]},
        {"name": "Food Processor 14-Cup", "brand": "Cuisinart", "sub": "Kitchen Appliance", "price": 229.00, "rating": 4.5, "features": ["easy-clean", "compact"]},
        {"name": "Hot+Cool HP07", "brand": "Dyson", "sub": "Smart Home", "price": 599.99, "rating": 4.4, "features": ["smart-app", "energy-efficient", "quiet"]},
    ],
}

COUPONS = [
    {"code": "SPRING15", "desc": "15% off all footwear", "type": "percentage", "value": 15, "categories": ["footwear"]},
    {"code": "TECH10", "desc": "$10 off electronics over $100", "type": "fixed", "value": 10, "categories": ["electronics"], "min": 100},
    {"code": "HOME20", "desc": "20% off home goods", "type": "percentage", "value": 20, "categories": ["home"]},
    {"code": "NEWUSER25", "desc": "25% off first purchase (max $50)", "type": "percentage", "value": 25, "categories": None},
    {"code": "SAVE30", "desc": "$30 off orders over $200", "type": "fixed", "value": 30, "categories": None, "min": 200},
    {"code": "AUDIO15", "desc": "15% off headphones & speakers", "type": "percentage", "value": 15, "categories": ["electronics"], "brands": ["Sony", "Bose", "Jabra", "Sennheiser"]},
    {"code": "RUNNERS10", "desc": "10% off running shoes", "type": "percentage", "value": 10, "categories": ["footwear"], "brands": ["Nike", "Brooks", "Asics", "Saucony"]},
    {"code": "COFFEE20", "desc": "20% off coffee equipment", "type": "percentage", "value": 20, "categories": ["home"], "brands": ["Breville", "Fellow", "Baratza"]},
    {"code": "FREESHIP", "desc": "Free shipping on any order", "type": "fixed", "value": 5.99, "categories": None},
    {"code": "LOYALTY500", "desc": "$5 off with 500+ loyalty points", "type": "fixed", "value": 5, "categories": None},
]

# Fixed UUIDs for demo users (stable across seeds)
DEMO_USERS = [
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "email": "alex@demo.com",
        "name": "Alex (Trail Runner)",
        "spend_limit": 200.00,
        "preferences": [
            {"type": "brand", "category": "footwear", "key": "Altra", "value": {"preferred": True}, "confidence": 0.9},
            {"type": "brand", "category": "footwear", "key": "Hoka", "value": {"preferred": True}, "confidence": 0.85},
            {"type": "size", "category": "footwear", "key": "shoe_size", "value": {"size": "10.5", "width": "wide"}, "confidence": 0.95},
            {"type": "style", "category": None, "key": "sustainable", "value": {"preferred": True}, "confidence": 0.7},
            {"type": "style", "category": None, "key": "minimalist", "value": {"preferred": True}, "confidence": 0.6},
            {"type": "budget", "category": "footwear", "key": "range", "value": {"min": 80, "max": 180}, "confidence": 0.8},
        ],
    },
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "email": "jordan@demo.com",
        "name": "Jordan (Tech Enthusiast)",
        "spend_limit": 500.00,
        "preferences": [
            {"type": "brand", "category": "electronics", "key": "Sony", "value": {"preferred": True}, "confidence": 0.9},
            {"type": "brand", "category": "electronics", "key": "Apple", "value": {"preferred": True}, "confidence": 0.8},
            {"type": "style", "category": None, "key": "premium", "value": {"preferred": True}, "confidence": 0.85},
            {"type": "exclusion", "category": None, "key": "refurbished", "value": {"excluded": True}, "confidence": 0.9},
        ],
    },
    {
        "id": "33333333-3333-3333-3333-333333333333",
        "email": "sam@demo.com",
        "name": "Sam (Home Optimizer)",
        "spend_limit": 200.00,
        "preferences": [
            {"type": "brand", "category": "home", "key": "Dyson", "value": {"preferred": True}, "confidence": 0.8},
            {"type": "brand", "category": "home", "key": "Breville", "value": {"preferred": True}, "confidence": 0.75},
            {"type": "style", "category": None, "key": "smart-home", "value": {"preferred": True}, "confidence": 0.7},
            {"type": "budget", "category": "home", "key": "range", "value": {"min": 100, "max": 400}, "confidence": 0.8},
        ],
    },
]


# ── Description Generation ────────────────────────────────────────────

DESCRIPTION_TEMPLATES = {
    "footwear": [
        "The {brand} {name} delivers exceptional {feature1} for {subcategory} enthusiasts. "
        "Built with premium materials, this shoe offers {feature2} and {feature3} "
        "for a comfortable, high-performance experience on any terrain.",
        "Engineered for serious {subcategory}, the {brand} {name} features advanced "
        "{feature1} technology with {feature2} design. Perfect for runners who demand "
        "{feature3} without compromising on comfort.",
    ],
    "electronics": [
        "The {brand} {name} sets a new standard in {subcategory} with industry-leading "
        "{feature1}. Featuring {feature2} and {feature3}, it delivers an immersive "
        "audio-visual experience for discerning users.",
        "Experience cutting-edge {subcategory} technology with the {brand} {name}. "
        "Packed with {feature1}, {feature2}, and {feature3} capabilities, "
        "it's designed for those who expect the best.",
    ],
    "home": [
        "The {brand} {name} transforms your home with intelligent {feature1} and "
        "{feature2} design. This {subcategory} appliance combines performance with "
        "{feature3} for effortless daily use.",
        "Elevate your home with the {brand} {name}, a premium {subcategory} featuring "
        "{feature1} and {feature2}. Its {feature3} ensures lasting value "
        "and exceptional performance.",
    ],
}

REVIEW_TEMPLATES = {
    "pros": [
        "Excellent build quality", "Great value for money", "Easy to set up",
        "Comfortable to use", "Long-lasting battery", "Stylish design",
        "Outstanding performance", "Intuitive controls", "Quiet operation",
        "Durable construction", "Responsive customer support", "Fast charging",
    ],
    "cons": [
        "Slightly heavy", "Premium price point", "Limited color options",
        "App could be better", "Takes time to break in", "No carrying case included",
        "Charging cable too short", "Manual could be clearer", "Firmware updates needed",
    ],
}


def generate_description(category: str, product: dict) -> str:
    templates = DESCRIPTION_TEMPLATES.get(category, DESCRIPTION_TEMPLATES["electronics"])
    template = random.choice(templates)
    features = product.get("features", ["quality", "performance", "design"])
    return template.format(
        brand=product["brand"],
        name=product["name"],
        subcategory=product.get("sub", "product"),
        feature1=features[0] if len(features) > 0 else "quality",
        feature2=features[1] if len(features) > 1 else "performance",
        feature3=features[2] if len(features) > 2 else "design",
    )


def generate_review(product: dict) -> dict:
    num_pros = random.randint(2, 4)
    num_cons = random.randint(1, 2)
    return {
        "summary": f"The {product['brand']} {product['name']} is well-regarded by users for its "
                   f"excellent performance and build quality. Most reviewers praise its "
                   f"value proposition at the ${product['price']:.2f} price point.",
        "pros": random.sample(REVIEW_TEMPLATES["pros"], num_pros),
        "cons": random.sample(REVIEW_TEMPLATES["cons"], num_cons),
        "avg_rating": product["rating"],
        "total_reviews": random.randint(50, 2000),
    }


def generate_attributes(category: str, product: dict) -> dict:
    if category == "footwear":
        return {
            "sizes": ["8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"],
            "widths": ["standard", "wide"] if "wide-fit" in product.get("features", []) else ["standard"],
            "colors": random.sample(["Black", "Blue", "White", "Gray", "Red", "Green"], 3),
        }
    elif category == "electronics":
        return {
            "colors": random.sample(["Black", "Silver", "White", "Blue"], 2),
            "connectivity": "Bluetooth 5.3" if "wireless" in product.get("features", []) else "Wired",
        }
    else:
        return {
            "colors": random.sample(["Black", "Silver", "White", "Red"], 2),
            "power": random.choice(["120V", "Universal"]),
        }


# ── Embedding Generation ─────────────────────────────────────────────

async def generate_embeddings(texts: list[str], client: AsyncOpenAI) -> list[list[float]]:
    """Generate embeddings in batches."""
    all_embeddings = []
    batch_size = 50

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        response = await client.embeddings.create(
            model=settings.embedding_model,
            input=batch,
        )
        all_embeddings.extend([d.embedding for d in response.data])
        print(f"  Generated embeddings {i+1}-{min(i+batch_size, len(texts))} of {len(texts)}")

    return all_embeddings


# ── Main Seed Function ────────────────────────────────────────────────

async def seed_database():
    """Seed the entire database with products, users, and coupons."""
    print("=" * 60)
    print("  Agentic Commerce — Database Seed")
    print("=" * 60)

    # Create tables
    print("\nCreating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("  Tables created.")

    openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
    all_products = []

    # Generate products for each category
    for category_name, category_data in [("footwear", FOOTWEAR), ("electronics", ELECTRONICS), ("home", HOME_GOODS)]:
        print(f"\nProcessing {category_name}...")

        for product in category_data["products"]:
            description = generate_description(category_name, product)
            attributes = generate_attributes(category_name, product)
            review = generate_review(product)
            product_id = uuid.uuid4()

            # Add original_price for some products (to show discounts)
            original_price = None
            if random.random() > 0.7:
                original_price = round(product["price"] * random.uniform(1.1, 1.4), 2)

            all_products.append({
                "id": product_id,
                "sku": f"{category_name[:3].upper()}-{product['brand'][:3].upper()}-{random.randint(1000, 9999)}",
                "name": product["name"],
                "brand": product["brand"],
                "category": category_name,
                "subcategory": product["sub"],
                "description": description,
                "price": product["price"],
                "original_price": original_price,
                "attributes": attributes,
                "rating": product["rating"],
                "review_count": review["total_reviews"],
                "in_stock": True,
                "image_url": f"https://placehold.co/400x400/1a1a2e/e0e0e0?text={product['name'].replace(' ', '+')}",
                "features": product.get("features", []),
                "review_data": review,
            })

    # Generate embeddings
    print(f"\nGenerating embeddings for {len(all_products)} products...")
    texts = [f"{p['name']} {p['brand']} {p['category']} {p['subcategory']} {p['description']}" for p in all_products]
    embeddings = await generate_embeddings(texts, openai_client)

    # Insert into database
    print("\nInserting products into database...")
    async with async_session_factory() as db:
        for i, (prod, emb) in enumerate(zip(all_products, embeddings)):
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

            # Add review
            review_data = prod["review_data"]
            review = ProductReview(
                product_id=prod["id"],
                summary=review_data["summary"],
                pros=review_data["pros"],
                cons=review_data["cons"],
                avg_rating=review_data["avg_rating"],
                total_reviews=review_data["total_reviews"],
            )
            db.add(review)

        await db.commit()
        print(f"  Inserted {len(all_products)} products with reviews")

    # Insert demo users
    print("\nCreating demo users...")
    async with async_session_factory() as db:
        for u in DEMO_USERS:
            user = User(
                id=uuid.UUID(u["id"]),
                email=u["email"],
                display_name=u["name"],
                spend_limit=u["spend_limit"],
            )
            db.add(user)

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
        print(f"  Created {len(DEMO_USERS)} demo users with preferences")

    # Insert coupons
    print("\nCreating coupons...")
    async with async_session_factory() as db:
        now = datetime.now(timezone.utc)
        for c in COUPONS:
            coupon = Coupon(
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
            )
            db.add(coupon)
        await db.commit()
        print(f"  Created {len(COUPONS)} coupons")

    # Graph seeding removed (Apache AGE no longer required)
    print("\nGraph seeding skipped (AGE not enabled)")

    print("\n" + "=" * 60)
    print("  Seed complete!")
    print(f"  Products: {len(all_products)}")
    print(f"  Users: {len(DEMO_USERS)}")
    print(f"  Coupons: {len(COUPONS)}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(seed_database())
