"""Graph query tools for agent use — STUBBED (Apache AGE removed).

All functions return empty results. The agent relies on pgvector
semantic search + LLM reasoning instead of graph traversal.
"""

from typing import Any


async def graph_discover(
    user_id: str,
    category: str | None = None,
    max_price: float | None = None,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """No-op: AGE removed. Returns empty list."""
    return []


async def graph_related(product_id: str, limit: int = 5) -> list[dict[str, Any]]:
    """No-op: AGE removed. Returns empty list."""
    return []


async def graph_similar(product_id: str, limit: int = 5) -> list[dict[str, Any]]:
    """No-op: AGE removed. Returns empty list."""
    return []


async def graph_features(product_id: str) -> list[str]:
    """No-op: AGE removed. Returns empty list."""
    return []


async def graph_record_purchase(user_id: str, product_id: str, price: float) -> None:
    """No-op: AGE removed."""
    pass
