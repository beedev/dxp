"""LangChain tool definitions for the ReAct agent.

These are thin wrappers over existing data-access helpers in `src.agents.tools.*`,
exposed with structured input schemas so the LLM can invoke them via function calling.

Design note: Tools are stateless, typed, and return JSON-serializable dicts.
They're designed to be wrapped as MCP servers later without modification.
"""

from contextvars import ContextVar

# Per-session cart snapshots. Populated by the WebSocket handler when the
# client sends its current cart with each user message. Exposed to the LLM
# via the `get_cart_contents` tool.
SESSION_CARTS: dict[str, list[dict]] = {}

# Per-session products shown to the user last turn. Used to inject an
# explicit context block into the next turn's prompt so the agent always
# knows which product IDs "them" / "those" / "all of them" refers to.
SESSION_LAST_PRODUCTS: dict[str, list[dict]] = {}

# Per-session uploaded files (images, PDFs). Each entry:
#   {id, filename, mime_type, size, path, analyzed, analysis}
# Surfaced to the agent via the context block + analyze_upload tool.
SESSION_UPLOADS: dict[str, list[dict]] = {}


def set_session_last_products(session_id: str, products: list[dict]) -> None:
    """Record the curated products shown to the user at end of a turn."""
    SESSION_LAST_PRODUCTS[session_id] = products or []

# Context variable for the current turn — set by the WebSocket handler before
# invoking the agent, so tools can read session/user context without the LLM
# having to pass IDs around.
current_session_id: ContextVar[str] = ContextVar("current_session_id", default="")
current_user_id: ContextVar[str] = ContextVar("current_user_id", default="")


def set_session_cart(session_id: str, cart: list[dict]) -> None:
    """Update the cart snapshot for a session. Called by the chat handler on each turn."""
    SESSION_CARTS[session_id] = cart or []


def set_turn_context(session_id: str, user_id: str) -> None:
    """Bind current turn's session/user context for tools to access."""
    current_session_id.set(session_id)
    current_user_id.set(user_id)

from typing import Any, Optional

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from src.agents.tools.preferences import (
    get_user_preferences,
    upsert_user_preference,
)
from src.agents.tools.pricing import (
    calculate_best_deal,
    find_applicable_coupons,
    get_loyalty_balance,
)
from src.agents.tools.domain_action import domain_action_tool
from src.agents.tools.kb import search_kb
from src.agents.tools.products import get_product_details
from src.agents.tools.search import semantic_product_search
from src.agents.tools.ucp_checkout import ucp_checkout_tool
from src.agents.persona import load_persona
from src.config import settings


def _resolve_persona_entity_types() -> list[str]:
    """Read the active persona's allowed entity types once at module load.

    Supports both schemas:
    - Multi-source (new): cfg["data"]["sources"][i]["entity_type"]
    - Single-entity (legacy): cfg["data"]["entity"]["name"]

    The conv-assistant runs one persona per process (AGENTIC_CONFIG_ID). Tools
    that hit the entities table must filter to this allow-list so a deployment
    for one vertical doesn't surface another vertical's data. Empty list means
    "no filter" (legacy behavior).
    """
    try:
        cfg = load_persona(settings.agentic_config_id)
        data = cfg.get("data", {}) or {}
        sources = data.get("sources") or []
        if sources:
            return [s["entity_type"] for s in sources if s.get("entity_type")]
        legacy = (data.get("entity") or {}).get("name")
        return [legacy] if legacy else []
    except Exception:
        return []


_PERSONA_ENTITY_TYPES: list[str] = _resolve_persona_entity_types()
# Back-compat alias for callers that only need the primary type.
_PERSONA_ENTITY_TYPE: Optional[str] = _PERSONA_ENTITY_TYPES[0] if _PERSONA_ENTITY_TYPES else None


# ── Input schemas ──────────────────────────────────────────────────────────


class SearchProductsInput(BaseModel):
    query: str = Field(description="Natural language description of what the user wants to find")
    category: Optional[str] = Field(
        default=None,
        description="Optional category filter: paint, tools, plumbing, electrical, outdoor, hardware, seasonal",
    )
    max_price: Optional[float] = Field(default=None, description="Optional maximum price in USD")
    min_rating: Optional[float] = Field(default=None, description="Optional minimum rating (1-5)")
    limit: int = Field(default=15, description="Max number of products to return (default 15)")


class GetProductDetailsInput(BaseModel):
    product_id: str = Field(description="UUID of the product to look up")


class FindComplementsInput(BaseModel):
    product_id: str = Field(description="UUID of the product whose complements to find")
    limit: int = Field(default=4, description="Max complements to return")


class FindDealsInput(BaseModel):
    product_ids: list[str] = Field(description="List of product UUIDs to find deals for")
    user_id: str = Field(description="User UUID for loyalty balance lookup")


class ExplainProductInput(BaseModel):
    question: str = Field(description="The user's question about products or categories")
    product_ids: Optional[list[str]] = Field(
        default=None, description="Optional list of product UUIDs that give context"
    )


class AddToCartInput(BaseModel):
    product_id: str = Field(description="UUID of the product to add")
    quantity: int = Field(default=1, description="Quantity (default 1)")


class AnalyzeUploadInput(BaseModel):
    file_id: str = Field(description="UUID of the uploaded file to analyze")


class LearnPreferenceInput(BaseModel):
    preference_type: str = Field(
        description="One of: 'brand', 'style', 'size', 'budget', 'exclusion'"
    )
    key: str = Field(
        description=(
            "The preference value: brand name ('Hoka'), style tag ('minimalist'), "
            "size value ('10.5W'), budget label ('range'), exclusion term ('leather')"
        )
    )
    category: Optional[str] = Field(
        default=None,
        description=(
            "Optional category scope (e.g., 'footwear', 'tools') — null for global."
        ),
    )
    value: Optional[dict[str, Any]] = Field(
        default=None,
        description=(
            "Optional structured value (e.g., {'min': 80, 'max': 180} for budget, "
            "{'size': '10.5', 'width': 'wide'} for size). Defaults to {} for tags."
        ),
    )
    confidence_delta: float = Field(
        default=0.15,
        description=(
            "How much to boost confidence (0-1). Use 0.3 for explicit user statement "
            "('I prefer Nike'), 0.15 for implicit signal (user selected a Nike)."
        ),
    )




# ── Tools ──────────────────────────────────────────────────────────────────


@tool("search_products", args_schema=SearchProductsInput)
async def search_products_tool(
    query: str,
    category: Optional[str] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    limit: int = 15,
) -> dict[str, Any]:
    """Search the catalog for items matching a natural-language query.

    Use this whenever the user asks to find, compare, or explore available items.
    Returns ranked results with name, description, and relevant details.
    """
    results = await semantic_product_search(
        query=query,
        category=category,
        max_price=max_price,
        min_rating=min_rating,
        limit=limit,
        entity_type=_PERSONA_ENTITY_TYPES or None,
    )
    # Return a compact summary for the LLM + full entity list for the UI
    def _summarize(p: dict) -> str:
        d = p.get("data", {})
        parts = [p.get("name", "")]
        for key in ("brand", "asset_class", "category", "sector"):
            if d.get(key):
                parts.append(str(d[key]))
        for key in ("price", "min_investment"):
            if d.get(key) is not None:
                parts.append(f"${d[key]}")
                break
        return " — ".join(parts)

    return {
        "count": len(results),
        "products": results,
        "summary": [_summarize(p) for p in results],
    }


@tool("get_product_details", args_schema=GetProductDetailsInput)
async def get_product_details_tool(product_id: str) -> dict[str, Any]:
    """Get full details of a specific item by its ID."""
    result = await get_product_details(product_id)
    if not result:
        return {"error": "Product not found", "product_id": product_id}
    return result


@tool("find_complements", args_schema=FindComplementsInput)
async def find_complements_tool(product_id: str, limit: int = 4) -> dict[str, Any]:
    """Find items that complement or are related to this one.
    Use this proactively after a user shows interest in an item to suggest related options.
    """
    # Semantic search fallback: look up the product, then search for complements
    # by description. This replaces the former AGE Cypher graph traversal.
    try:
        details = await get_product_details(product_id)
        if not details:
            return {"count": 0, "complements": [], "note": "Product not found"}

        # Build a complement-oriented search query from the product's details
        name = details.get("name", "")
        d = details.get("data", {})
        category = d.get("category", d.get("sector", ""))
        query = f"items that complement or go well with {name} in {category}"

        results = await semantic_product_search(
            query=query,
            limit=limit + 2,
            entity_type=_PERSONA_ENTITY_TYPES or None,
        )
        complements = [
            {"id": r["id"], "name": r["name"], "data": r.get("data", {})}
            for r in results
            if str(r["id"]) != str(product_id)
        ][:limit]

        return {"count": len(complements), "complements": complements}
    except Exception as e:
        return {"count": 0, "complements": [], "error": str(e)}


@tool("find_deals", args_schema=FindDealsInput)
async def find_deals_tool(product_ids: list[str], user_id: str) -> dict[str, Any]:
    """Find applicable discounts, promotions, or rewards for a set of items.
    Use this when the user asks about deals or savings.
    """
    # Load product details to get categories and brands
    categories: set[str] = set()
    brands: set[str] = set()
    total_price = 0.0
    for pid in product_ids:
        details = await get_product_details(pid)
        if details:
            d = details.get("data", {})
            categories.add(d.get("category", d.get("sector", "")))
            brands.add(d.get("brand", d.get("asset_class", "")))
            total_price += float(d.get("price", d.get("min_investment", 0)))

    coupons = await find_applicable_coupons(list(categories), list(brands))
    loyalty = await get_loyalty_balance(user_id)
    best = calculate_best_deal(total_price, coupons, loyalty) if total_price > 0 else None

    return {
        "available_coupons": coupons,
        "loyalty_balance": loyalty,
        "best_deal": best,
    }


@tool("explain_product", args_schema=ExplainProductInput)
async def explain_product_tool(
    question: str, product_ids: Optional[list[str]] = None
) -> dict[str, Any]:
    """Answer a question about items in the catalog. Use this when the user asks
    informational questions rather than search or action requests. Returns relevant
    context to inform your response.
    """
    # Gather product context if IDs are provided
    products_context = []
    if product_ids:
        for pid in product_ids:
            d = await get_product_details(pid)
            if d:
                products_context.append({
                    "name": d.get("name"),
                    "description": d.get("description"),
                    "data": d.get("data", {}),
                })

    # The LLM will use this context + its own knowledge to answer
    return {
        "question": question,
        "products_context": products_context,
        "note": "Use this context plus your domain knowledge to answer the user directly.",
    }


@tool("add_to_cart", args_schema=AddToCartInput)
async def add_to_cart_tool(product_id: str, quantity: int = 1) -> dict[str, Any]:
    """Add an item to the user's selection. Use when the user explicitly wants to
    proceed with an item ("add this", "I'll take that", "select this one").
    This is a reversible action — no confirmation needed."""
    details = await get_product_details(product_id)
    if not details:
        return {"success": False, "error": "Product not found"}

    d = details.get("data", {})
    item = {
        "product_id": product_id,
        "name": details["name"],
        "brand": d.get("brand", d.get("asset_class", "")),
        "price": float(d.get("price", d.get("min_investment", 0))),
        "quantity": quantity,
        "data": d,
    }

    # Persist to the session cart
    sid = current_session_id.get()
    if sid:
        cart = SESSION_CARTS.setdefault(sid, [])
        existing = next((c for c in cart if c["product_id"] == product_id), None)
        if existing:
            existing["quantity"] = int(existing.get("quantity", 1)) + int(quantity)
        else:
            cart.append(item)

    return {"success": True, "added_item": item}


@tool("get_user_preferences")
async def get_user_preferences_tool() -> dict[str, Any]:
    """Read the current user's stored preferences (preferred brands, styles, sizes,
    budgets, exclusions). Call this BEFORE making recommendations so you can
    personalize — e.g., boost a brand the user prefers, skip exclusions.

    Returns a dict with keys: preferred_brands, styles, sizes, budget_ranges,
    exclusions, spend_limit. Each brand/style entry has a confidence score (0-1).
    """
    user_id = current_user_id.get()
    if not user_id:
        return {"error": "No user context set"}
    return await get_user_preferences(user_id)


@tool("learn_preference", args_schema=LearnPreferenceInput)
async def learn_preference_tool(
    preference_type: str,
    key: str,
    category: Optional[str] = None,
    value: Optional[dict[str, Any]] = None,
    confidence_delta: float = 0.15,
) -> dict[str, Any]:
    """Record a new preference signal, or strengthen an existing one.

    Call this when:
    - User EXPLICITLY states a preference ('I prefer Hoka', 'No leather products')
      → confidence_delta=0.3
    - User IMPLICITLY signals by selecting a product (adds Hoka to cart)
      → confidence_delta=0.15
    - User mentions a budget ceiling or style preference while shopping

    Examples of valid calls:
      learn_preference(preference_type='brand', key='Hoka', category='footwear',
                       confidence_delta=0.3)
      learn_preference(preference_type='style', key='minimalist', confidence_delta=0.15)
      learn_preference(preference_type='exclusion', key='leather', confidence_delta=0.3)
      learn_preference(preference_type='budget', key='range', category='footwear',
                       value={'min': 80, 'max': 180}, confidence_delta=0.2)
    """
    user_id = current_user_id.get()
    if not user_id:
        return {"error": "No user context set"}
    return await upsert_user_preference(
        user_id=user_id,
        preference_type=preference_type,
        key=key,
        value=value,
        category=category,
        confidence_delta=confidence_delta,
    )


@tool("analyze_upload", args_schema=AnalyzeUploadInput)
async def analyze_upload_tool(file_id: str) -> dict[str, Any]:
    """Analyze an uploaded file (image or PDF) and return a text description of
    its content.

    Use this when the user has uploaded a file relevant to their request —
    e.g., a photo of damage, a police report PDF, an insurance card, a receipt.
    For images: returns a vision-model description.
    For PDFs: returns extracted text (first ~3000 chars).

    The list of available uploads is in your session context. If you've already
    analyzed a file this session, its `analysis` is in the context too — don't
    re-analyze unless the user uploads a new version.
    """
    import base64
    import os
    from pathlib import Path

    from openai import AsyncOpenAI

    from src.config import settings

    sid = current_session_id.get()
    uploads = SESSION_UPLOADS.get(sid, [])
    record = next((u for u in uploads if u.get("id") == file_id), None)
    if not record:
        return {"error": f"No upload with id {file_id} in this session"}

    path = Path(record["path"])
    if not path.exists():
        return {"error": f"File no longer exists on disk: {path}"}

    mime = record.get("mime_type", "")

    # Cached analysis (avoid re-running expensive vision / extraction)
    if record.get("analyzed") and record.get("analysis"):
        return {
            "file_id": file_id,
            "filename": record.get("filename"),
            "analysis": record["analysis"],
            "cached": True,
        }

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    analysis: str = ""

    if mime.startswith("image/"):
        try:
            with open(path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("ascii")
            resp = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    "Describe this image in 2-4 sentences. If it's relevant to "
                                    "an insurance claim, retail purchase, or home repair, call "
                                    "out the specifics: visible damage, model numbers, "
                                    "license plates, document text, etc."
                                ),
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{mime};base64,{b64}"},
                            },
                        ],
                    }
                ],
                max_tokens=300,
            )
            analysis = resp.choices[0].message.content or "(no description returned)"
        except Exception as e:
            analysis = f"Error analyzing image: {str(e)[:200]}"

    elif mime == "application/pdf":
        # pymupdf4llm produces LLM-friendly Markdown preserving headings,
        # tables, and list structure — much better than raw text extraction
        # for PDFs with forms, columns, or complex formatting. Falls back to
        # pypdf on unusual PDFs.
        try:
            import pymupdf4llm
            md_text = pymupdf4llm.to_markdown(str(path), pages=list(range(0, 5)))
            md_text = (md_text or "").strip()
            if not md_text:
                analysis = (
                    "(PDF contained no extractable text — likely scanned images; "
                    "consider converting pages to images for vision analysis)"
                )
            else:
                analysis = md_text[:4000]
        except Exception as e:
            try:
                from pypdf import PdfReader
                reader = PdfReader(str(path))
                text = "\n".join(
                    (page.extract_text() or "") for page in reader.pages[:5]
                ).strip()
                analysis = (
                    text[:3000] if text else f"Error extracting PDF: {str(e)[:200]}"
                )
            except Exception as e2:
                analysis = f"Error extracting PDF: {str(e2)[:200]}"

    else:
        analysis = f"Unsupported file type: {mime}. Supported: images, PDFs."

    # Cache back into the session record
    record["analyzed"] = True
    record["analysis"] = analysis

    return {
        "file_id": file_id,
        "filename": record.get("filename"),
        "mime_type": mime,
        "analysis": analysis,
        "cached": False,
    }


@tool("get_cart_contents")
async def get_cart_contents_tool() -> dict[str, Any]:
    """Get the user's current selected items.

    Use this whenever the user asks about their selections, wants a summary,
    or when you need context about what they've already chosen.
    """
    session_id = current_session_id.get()
    cart = SESSION_CARTS.get(session_id, [])
    if not cart:
        return {
            "count": 0,
            "items": [],
            "subtotal": 0.0,
            "note": "Cart is empty. User hasn't added anything yet.",
        }
    subtotal = sum(float(i.get("price", 0)) * int(i.get("quantity", 1)) for i in cart)
    return {
        "count": len(cart),
        "items": cart,
        "subtotal": round(subtotal, 2),
    }


class SearchKBInput(BaseModel):
    query: str = Field(
        description=(
            "Natural-language question about the knowledge base — e.g. "
            "'how do I reset the VPN after a password change?'"
        ),
    )
    category: Optional[str] = Field(
        default=None,
        description="Optional KB category filter (e.g. 'FHIR', 'VPN', 'Pharmacy').",
    )
    limit: int = Field(default=10, description="Max KB articles to return (default 10)")


@tool("search_kb", args_schema=SearchKBInput)
async def search_kb_tool(
    query: str, category: Optional[str] = None, limit: int = 10
) -> dict[str, Any]:
    """Search the indexed knowledge base for articles that answer the user's question.

    Returns ranked KB articles with title, category, preview snippet, relevance
    score, and the upstream ITSM KB id. Always cite the returned title(s) in
    your response so the user can verify the source.
    """
    hits = await search_kb(query=query, category=category, limit=limit)
    return {"count": len(hits), "articles": hits}


# Export the canonical tool list (backward compat — all tools, unfiltered)
AGENT_TOOLS = [
    search_products_tool,
    get_product_details_tool,
    find_complements_tool,
    find_deals_tool,
    explain_product_tool,
    add_to_cart_tool,
    get_cart_contents_tool,
    get_user_preferences_tool,
    learn_preference_tool,
    analyze_upload_tool,
]

# Registry for config-driven tool selection.
# Persona config's "tools" array references these short keys.
# To add a new tool: define it above, then add an entry here.
TOOL_REGISTRY: dict[str, Any] = {
    "search": search_products_tool,
    "details": get_product_details_tool,
    "complements": find_complements_tool,
    "deals": find_deals_tool,
    "explain": explain_product_tool,
    "cart": add_to_cart_tool,
    "cart_contents": get_cart_contents_tool,
    "preferences": get_user_preferences_tool,
    "learn_preference": learn_preference_tool,
    "upload": analyze_upload_tool,
    "domain_action": domain_action_tool,
    "search_kb": search_kb_tool,
    "ucp_checkout": ucp_checkout_tool,
}
