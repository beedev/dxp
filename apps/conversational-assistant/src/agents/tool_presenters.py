"""Tool presenters — declarative mapping of tool invocations to UI events.

Each tool that produces UI-relevant output registers a `ToolPresenter`. The
WebSocket handler uses these to turn tool-call events into:
  - agent_step messages (for the activity feed)
  - side-channel events like cart_updated
  - accumulated products for end-of-turn curation

Adding a new tool = adding its presenter here. No changes to chat.py.
"""

from dataclasses import dataclass
from typing import Any, Callable, Optional


@dataclass
class ToolPresenter:
    """How a tool's invocation should be surfaced to the UI."""

    # Human-friendly sentence for the activity feed, given the tool input.
    summarize_input: Callable[[dict], str]

    # Short content for the tool-result agent_step card, given the parsed output.
    summarize_output: Callable[[Any], str]

    # Optional: extract a product list that the turn should accumulate for
    # end-of-turn card curation. Return None if this tool doesn't produce products.
    extract_products: Optional[Callable[[Any], list[dict]]] = None

    # Optional: extract a cart-item dict if this tool modifies the cart.
    extract_cart_item: Optional[Callable[[Any], Optional[dict]]] = None


# ── Per-tool presenters ─────────────────────────────────────────────────────


def _search_input(i: dict) -> str:
    q = i.get("query", "")
    parts = []
    if i.get("category"):
        parts.append(f"category={i['category']}")
    if i.get("max_price") is not None:
        parts.append(f"≤${i['max_price']}")
    suffix = f" [{', '.join(parts)}]" if parts else ""
    return f'Searching for "{q}"{suffix}'


def _search_output(o: Any) -> str:
    if isinstance(o, dict):
        return f"Found {o.get('count', 0)} matching products"
    return "Search completed"


def _search_products(o: Any) -> list[dict]:
    if isinstance(o, dict):
        return list(o.get("products", []))
    return []


def _complements_output(o: Any) -> str:
    count = o.get("count", 0) if isinstance(o, dict) else 0
    return f"Found {count} complementary products"


def _deals_output(o: Any) -> str:
    coupons = o.get("available_coupons", []) if isinstance(o, dict) else []
    return f"Found {len(coupons)} applicable deals"


def _addcart_output(o: Any) -> str:
    if isinstance(o, dict) and o.get("success"):
        item = o.get("added_item", {})
        return f"Added {item.get('name', '?')} to cart"
    return "Add to cart failed"


def _addcart_item(o: Any) -> Optional[dict]:
    if isinstance(o, dict) and o.get("success"):
        return o.get("added_item")
    return None


PRESENTERS: dict[str, ToolPresenter] = {
    "search_products": ToolPresenter(
        summarize_input=_search_input,
        summarize_output=_search_output,
        extract_products=_search_products,
    ),
    "get_product_details": ToolPresenter(
        summarize_input=lambda i: "Fetching product details",
        summarize_output=lambda o: "Product details retrieved",
    ),
    "find_complements": ToolPresenter(
        summarize_input=lambda i: "Finding complementary products",
        summarize_output=_complements_output,
    ),
    "find_deals": ToolPresenter(
        summarize_input=lambda i: "Checking for deals",
        summarize_output=_deals_output,
    ),
    "explain_product": ToolPresenter(
        summarize_input=lambda i: (
            f'Looking up: "{i.get("question", "")[:60]}..."'
            if i.get("question") else "Gathering product context"
        ),
        summarize_output=lambda o: "Product context retrieved",
    ),
    "add_to_cart": ToolPresenter(
        summarize_input=lambda i: "Adding to cart",
        summarize_output=_addcart_output,
        extract_cart_item=_addcart_item,
    ),
    "get_cart_contents": ToolPresenter(
        summarize_input=lambda i: "Reading your cart",
        summarize_output=lambda o: (
            f"Cart has {o.get('count', 0)} items"
            if isinstance(o, dict) else "Cart read"
        ),
    ),
}


def presenter_for(tool_name: str) -> Optional[ToolPresenter]:
    return PRESENTERS.get(tool_name)
