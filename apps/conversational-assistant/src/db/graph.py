"""Graph database helper — STUBBED (Apache AGE removed).

AGE has been removed to simplify deployment. All functions return empty
results so callers don't break. Semantic search via pgvector + LLM
reasoning replaces graph traversal.
"""

from typing import Any


GRAPH_NAME = "agentic_commerce"


async def execute_cypher(query: str, params: dict[str, Any] | None = None) -> list[dict]:
    """No-op: AGE removed. Returns empty list."""
    return []


async def create_vertex(label: str, properties: dict[str, Any]) -> dict:
    """No-op: AGE removed."""
    return {}


async def create_edge(
    from_label: str,
    from_match: dict[str, Any],
    to_label: str,
    to_match: dict[str, Any],
    edge_label: str,
    properties: dict[str, Any] | None = None,
) -> dict:
    """No-op: AGE removed."""
    return {}


async def find_user_preferred_products(
    user_id: str,
    category: str | None = None,
    max_price: float | None = None,
    limit: int = 10,
) -> list[dict]:
    """No-op: AGE removed. Use pgvector semantic search + user preferences instead."""
    return []


async def find_related_products(product_id: str, limit: int = 5) -> list[dict]:
    """No-op: AGE removed."""
    return []


async def find_similar_products(product_id: str, limit: int = 5) -> list[dict]:
    """No-op: AGE removed."""
    return []


async def get_product_features(product_id: str) -> list[dict]:
    """No-op: AGE removed."""
    return []


async def update_user_purchase(user_id: str, product_id: str, price: float) -> None:
    """No-op: AGE removed."""
    pass


def _format_value(value: Any) -> str:
    """Format a Python value for Cypher query interpolation (kept for signature compat)."""
    if isinstance(value, str):
        return f"'{value}'"
    if isinstance(value, bool):
        return str(value).lower()
    if value is None:
        return "null"
    return str(value)
