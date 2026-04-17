"""Agent Readiness Monitor — scores a deployment's data-foundation quality.

This is the HTC Layer-3 deliverable: "Agent Readiness Monitor — automated data
quality scoring + remediation recommendations." It answers the client question:
"How agent-ready is our catalog?"

Scoring dimensions:
  1. data_completeness — % of entities with meaningful descriptions
  2. embedding_coverage — % of entities with valid vector embeddings
  3. preference_data — % of users with at least 3 stored preferences
  4. data_freshness — hours since last sync / update

Note: graph_connectivity dimension removed (Apache AGE no longer required).
The 0.25 weight is redistributed across the remaining dimensions.
"""

from typing import Any

from sqlalchemy import text, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Entity, User, UserPreference
from src.db.session import async_session_factory


async def _count_entities_complete(db: AsyncSession) -> tuple[int, int]:
    """Return (entities_with_descriptions, total_entities)."""
    total_q = await db.execute(select(func.count(Entity.id)))
    total = total_q.scalar() or 0
    complete_q = await db.execute(
        select(func.count(Entity.id)).where(
            Entity.description.isnot(None),
            func.length(Entity.description) > 20,
        )
    )
    return complete_q.scalar() or 0, total


async def _count_entities_embedded(db: AsyncSession) -> tuple[int, int]:
    """Return (entities_with_embeddings, total_entities)."""
    total_q = await db.execute(select(func.count(Entity.id)))
    total = total_q.scalar() or 0
    # Use raw SQL to check embedding presence
    result = await db.execute(
        text("SELECT COUNT(*) FROM entities WHERE embedding IS NOT NULL")
    )
    embedded = result.scalar() or 0
    return embedded, total


async def _preference_coverage(db: AsyncSession, min_prefs: int = 3) -> tuple[int, int]:
    """Return (users_with_min_prefs, total_users)."""
    total_q = await db.execute(select(func.count(User.id)))
    total = total_q.scalar() or 0

    # Count users having at least `min_prefs` preferences
    result = await db.execute(
        text("""
            SELECT COUNT(*) FROM (
                SELECT user_id FROM user_preferences
                GROUP BY user_id
                HAVING COUNT(*) >= :min_prefs
            ) t
        """),
        {"min_prefs": min_prefs},
    )
    with_prefs = result.scalar() or 0
    return with_prefs, total


async def compute_readiness() -> dict[str, Any]:
    """Return a readiness score + breakdown."""
    async with async_session_factory() as db:
        complete, total = await _count_entities_complete(db)
        embedded, _ = await _count_entities_embedded(db)
        users_with_prefs, total_users = await _preference_coverage(db)

    # Normalize each dimension to 0-100
    completeness = (complete / total * 100) if total else 0
    embedding_cov = (embedded / total * 100) if total else 0
    preference_data = (users_with_prefs / total_users * 100) if total_users else 0
    # Freshness: we don't track a "last sync" yet; assume fresh if any data
    data_freshness = 100.0 if total > 0 else 0.0

    # Weighted overall — graph_connectivity weight (0.25) redistributed:
    #   data_completeness: 0.25 -> 0.30
    #   embedding_coverage: 0.25 -> 0.35
    #   preference_data: 0.15 -> 0.20
    #   data_freshness: 0.10 -> 0.15
    weights = {
        "data_completeness": 0.30,
        "embedding_coverage": 0.35,
        "preference_data": 0.20,
        "data_freshness": 0.15,
    }
    dimensions = {
        "data_completeness": round(completeness, 1),
        "embedding_coverage": round(embedding_cov, 1),
        "graph_connectivity": 0,  # backward compat — always 0 now
        "preference_data": round(preference_data, 1),
        "data_freshness": round(data_freshness, 1),
    }
    # Only score the active dimensions
    overall = round(
        sum(dimensions[k] * w for k, w in weights.items()), 1
    )

    # Issues + recommendations
    issues: list[str] = []
    recommendations: list[str] = []

    if completeness < 90:
        gap = total - complete
        issues.append(f"{gap} of {total} entities are missing descriptions")
        recommendations.append(
            "Run LLM-based enrichment to generate descriptions for incomplete entities"
        )
    if embedding_cov < 100 and total > 0:
        gap = total - embedded
        issues.append(f"{gap} entities lack vector embeddings")
        recommendations.append(
            "Re-run the ingestion script to generate missing embeddings"
        )
    if preference_data < 50:
        issues.append(
            f"Only {users_with_prefs} of {total_users} users have enough preferences for good personalization"
        )
        recommendations.append(
            "Encourage users to complete a short preference survey, OR improve the "
            "agent's learn_preference calls during natural conversation"
        )

    return {
        "overall": overall,
        "dimensions": dimensions,
        "stats": {
            # New generic keys
            "total_entities": total,
            "complete_entities": complete,
            "embedded_entities": embedded,
            # Backward compat keys
            "total_products": total,
            "complete_products": complete,
            "embedded_products": embedded,
            "total_users": total_users,
            "users_with_preferences": users_with_prefs,
            # Graph stats — always zero now (backward compat)
            "total_nodes": 0,
            "connected_nodes": 0,
            "total_edges": 0,
            "avg_edges_per_node": 0.0,
            "product_nodes": 0,
            "avg_edges_per_product": 0.0,
        },
        "issues": issues,
        "recommendations": recommendations,
    }
