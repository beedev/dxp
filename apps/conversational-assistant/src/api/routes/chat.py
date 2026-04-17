"""WebSocket chat endpoint — streams ReAct agent events to the portal.

Protocol:
  Client → Server:
    { type: "user_message", content, user_id }
    { type: "add_to_cart_action", product_id, quantity }
    { type: "reset" }
    { type: "clear_cart" }

  Server → Client:
    { type: "agent_step", agent, step, tool, content, duration_ms? }
    { type: "products", products[] }       # curated end-of-turn
    { type: "cart_updated", cart, subtotal, item_count, just_added? }
    { type: "assistant_message", content }

This module delegates tool-specific UI projection to `tool_presenters`. Adding a
new tool means adding a presenter there, not modifying this file.
"""

import json
import traceback
import uuid
from typing import Any

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from langchain_core.messages import HumanMessage

from src.agents.react_tools import (
    SESSION_CARTS,
    SESSION_LAST_PRODUCTS,
    SESSION_UPLOADS,
    set_session_last_products,
    set_turn_context,
)
from src.agents.supervisor import build_agent, get_ui_config
from src.agents.tool_presenters import presenter_for
from src.agents.tools.products import get_product_details as _get_product_details
from src.api.security import require_api_key, validate_ws_token, track_session_owner
from src.observability import get_langfuse_handler

router = APIRouter()

# Build the ReAct agent once per process
agent = build_agent()

# Per-session conversation history (survives reconnects; reset on `reset`)
SESSION_CONVERSATIONS: dict[str, list] = {}


# ── Connection management ──────────────────────────────────────────────────


class ConnectionManager:
    def __init__(self) -> None:
        self.active: dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active[session_id] = websocket

    def disconnect(self, session_id: str) -> None:
        self.active.pop(session_id, None)

    async def send_json(self, session_id: str, data: dict) -> None:
        ws = self.active.get(session_id)
        if ws is not None:
            await ws.send_json(data)


manager = ConnectionManager()


# ── REST helper: restore conversation history ──────────────────────────────


@router.get("/api/sessions/{session_id}/agent-history")
async def get_agent_history(session_id: str, _auth=Depends(require_api_key)) -> dict:
    convo = SESSION_CONVERSATIONS.get(session_id, [])
    messages = []
    for m in convo:
        role = (
            "user" if getattr(m, "type", None) == "human"
            else "assistant" if getattr(m, "type", None) == "ai"
            else "system"
        )
        content = getattr(m, "content", "") or ""
        if isinstance(content, str) and content.strip():
            messages.append({"role": role, "content": content})
    return {"session_id": session_id, "messages": messages}


@router.get("/api/agent-config")
async def get_agent_config(_auth=Depends(require_api_key)) -> dict:
    """Expose the deployment's UI config (title, suggestions, greeting)."""
    return get_ui_config()


@router.get("/api/agent-configs")
async def list_agent_configs(domain: str | None = None, _auth=Depends(require_api_key)) -> dict:
    """List available deployment configs, optionally filtered by domain tag.

    GET /api/agent-configs → all configs
    GET /api/agent-configs?domain=retail → only configs tagged with "retail"
    """
    from pathlib import Path
    import json as _json
    configs_dir = Path(__file__).resolve().parent.parent.parent.parent / "configs"
    entries = []
    if configs_dir.exists():
        for f in sorted(configs_dir.glob("*.json")):
            try:
                with open(f) as fp:
                    data = _json.load(fp)
                tags = data.get("domain_tags", [])
                # Filter by domain if requested
                if domain and domain not in tags:
                    continue
                entries.append({
                    "id": f.stem,
                    "name": data.get("name", f.stem),
                    "domain": data.get("persona", {}).get("domain_summary", ""),
                    "domain_tags": tags,
                })
            except Exception:
                pass
    return {"configs": entries}


@router.get("/api/users/{user_id}/preferences")
async def list_user_preferences(user_id: str, _auth=Depends(require_api_key)) -> dict:
    """Return a user's current preferences for the UI panel."""
    from src.agents.tools.preferences import get_user_preferences
    return await get_user_preferences(user_id)


# ── Cart broadcasting ──────────────────────────────────────────────────────


async def _emit_cart_state(session_id: str, just_added: dict | None = None) -> None:
    cart = SESSION_CARTS.get(session_id, [])
    subtotal = sum(float(i.get("price", 0)) * int(i.get("quantity", 1)) for i in cart)
    await manager.send_json(session_id, {
        "type": "cart_updated",
        "cart": cart,
        "subtotal": round(subtotal, 2),
        "item_count": sum(int(i.get("quantity", 1)) for i in cart),
        "just_added": just_added,
    })


# ── Product curation: show only products the agent cites in its response ──


async def _build_session_context_block(session_id: str, user_id: str) -> str:
    """Build a structured context block to prepend to the user's message every turn.

    Injects:
    - Current cart (what's already been added)
    - Products shown in the PREVIOUS turn (so "add them" resolves to known IDs)
    - User preferences (so rankings are personalized without the LLM having to fetch)

    This makes multi-turn references ("them", "what else", "rank by my preferences")
    resolve directly without the LLM having to reconstruct state from tool history.
    """
    from src.agents.tools.preferences import get_user_preferences

    cart = SESSION_CARTS.get(session_id, [])
    last_products = SESSION_LAST_PRODUCTS.get(session_id, [])
    preferences: dict | None = None
    if user_id:
        try:
            preferences = await get_user_preferences(user_id)
        except Exception:
            preferences = None

    lines: list[str] = ["[SESSION CONTEXT — current state, use this directly]"]

    # Current cart
    if cart:
        lines.append("Cart:")
        for item in cart:
            lines.append(
                f"  - {item.get('name', '?')} "
                f"(id={item.get('product_id', '?')}) "
                f"${float(item.get('price', 0)):.2f} × {int(item.get('quantity', 1))}"
            )
    else:
        lines.append("Cart: empty")

    # User preferences (drive personalization)
    if preferences:
        brands = preferences.get("preferred_brands") or []
        styles = preferences.get("styles") or []
        sizes = preferences.get("sizes") or {}
        exclusions = preferences.get("exclusions") or []
        budgets = preferences.get("budget_ranges") or {}

        pref_lines = []
        if brands:
            brand_strs = []
            for b in brands:
                if isinstance(b, dict):
                    cat = f" ({b['category']})" if b.get("category") else ""
                    brand_strs.append(f"{b['name']}{cat} {int(b.get('confidence', 0) * 100)}%")
                else:
                    brand_strs.append(str(b))
            pref_lines.append(f"  Preferred brands: {', '.join(brand_strs)}")
        if styles:
            style_strs = []
            for s in styles:
                if isinstance(s, dict):
                    style_strs.append(f"{s['name']} {int(s.get('confidence', 0) * 100)}%")
                else:
                    style_strs.append(str(s))
            pref_lines.append(f"  Preferred styles: {', '.join(style_strs)}")
        if sizes:
            pref_lines.append(f"  Sizes: {sizes}")
        if budgets:
            pref_lines.append(f"  Budget ranges: {budgets}")
        if exclusions:
            pref_lines.append(f"  Exclusions (avoid): {', '.join(exclusions)}")

        if pref_lines:
            lines.append("")
            lines.append(
                "User preferences (use to rank/boost, NOT to filter out. Cite when "
                "they influence your picks):"
            )
            lines.extend(pref_lines)

    # Uploaded files (images, PDFs) attached by the user for this session
    uploads = SESSION_UPLOADS.get(session_id, [])
    if uploads:
        lines.append("")
        lines.append(
            "User-uploaded files (use `analyze_upload(file_id)` to read contents):"
        )
        for u in uploads:
            size_kb = (u.get("size", 0) or 0) // 1024
            analyzed_note = " [analyzed]" if u.get("analyzed") else ""
            lines.append(
                f"  - {u.get('filename', '?')} "
                f"({u.get('mime_type', '?')}, {size_kb}KB) "
                f"file_id={u.get('id', '?')}{analyzed_note}"
            )
            if u.get("analyzed") and u.get("analysis"):
                # Surface cached analysis so agent doesn't re-call for already-seen files
                analysis_preview = u["analysis"][:300]
                lines.append(f"    Analysis: {analysis_preview}")

    # Products shown in the previous turn (the agent's "last recommendation")
    if last_products:
        lines.append("")
        lines.append(
            "Products I recommended in my PREVIOUS turn "
            "(when user says \"them\", \"those\", \"all of them\", \"add them\", use THESE ids):"
        )
        for i, p in enumerate(last_products, 1):
            lines.append(
                f"  {i}. {p.get('name', '?')} "
                f"(id={p.get('id', '?')}) "
                f"${float(p.get('price', 0)):.2f}"
            )
    else:
        lines.append("")
        lines.append("Products I recommended in my previous turn: (none yet)")

    lines.append("[END CONTEXT]")
    return "\n".join(lines)


def _filter_products_cited_in_text(products: list[dict], text: str) -> list[dict]:
    """Return products whose names appear in the agent's final response, in citation order."""
    if not products or not text:
        return []
    text_lower = text.lower()
    cited: list[tuple[int, dict]] = []
    for p in products:
        name = (p.get("name") or "").lower()
        if not name:
            continue
        pos = text_lower.find(name)
        if pos < 0:
            words = [w for w in name.split() if len(w) > 2][:4]
            if words:
                pos = text_lower.find(" ".join(words))
        if pos >= 0:
            cited.append((pos, p))
    cited.sort(key=lambda t: t[0])
    return [p for _, p in cited]


# ── Tool output parsing ────────────────────────────────────────────────────


def _parse_tool_output(output: Any) -> Any:
    """Unwrap LangChain ToolMessage into the original dict/value."""
    if output is None:
        return None
    if isinstance(output, dict):
        return output
    if hasattr(output, "content"):
        content = output.content
        if isinstance(content, str):
            try:
                return json.loads(content)
            except (json.JSONDecodeError, TypeError):
                return content
        return content
    return output


# ── Main turn streaming ────────────────────────────────────────────────────


async def _stream_agent_turn(
    session_id: str, user_id: str, user_content: str, conversation: list
) -> list:
    """Run one agent turn, streaming events to the WebSocket. Returns the
    updated conversation history."""
    set_turn_context(session_id, user_id)

    config: dict[str, Any] = {
        "configurable": {"thread_id": session_id, "user_id": user_id},
        "recursion_limit": 40,
    }
    langfuse = get_langfuse_handler(session_id=session_id, user_id=user_id)
    if langfuse is not None:
        config["callbacks"] = [langfuse]

    # Build the context block (cart + previous-turn products) and prepend it to
    # the user's message. The LLM sees structured state every turn — no need to
    # reconstruct state from tool-message history.
    context_block = await _build_session_context_block(session_id, user_id)
    augmented_content = f"{context_block}\n\nUser: {user_content}"
    # Persist the RAW user message to history (not the augmented one), so
    # conversation history stays clean for future context injection.
    conversation = conversation + [HumanMessage(content=user_content)]
    # Build the input for this turn using augmented content without polluting history
    turn_messages = conversation[:-1] + [HumanMessage(content=augmented_content)]
    input_state = {"messages": turn_messages}

    await manager.send_json(session_id, {
        "type": "agent_step",
        "agent": "supervisor",
        "step": "thinking",
        "content": "Reading your request...",
    })

    final_content = ""
    # Products the agent looked at this turn — curated to cited-only before emitting.
    all_turn_products: list[dict] = []

    try:
        async for event in agent.astream_events(input_state, config=config, version="v2"):
            etype = event.get("event", "")
            ename = event.get("name", "")
            data = event.get("data", {})

            # ── Tool invocation started ──
            if etype == "on_tool_start":
                presenter = presenter_for(ename)
                summary = (
                    presenter.summarize_input(data.get("input", {}))
                    if presenter else f"Calling {ename}"
                )
                await manager.send_json(session_id, {
                    "type": "agent_step",
                    "agent": "supervisor",
                    "step": "tool_call",
                    "tool": ename,
                    "content": summary,
                })

            # ── Tool invocation finished ──
            elif etype == "on_tool_end":
                presenter = presenter_for(ename)
                parsed = _parse_tool_output(data.get("output"))

                # Emit the tool_result agent_step
                summary = (
                    presenter.summarize_output(parsed)
                    if presenter else f"Tool {ename} completed"
                )
                await manager.send_json(session_id, {
                    "type": "agent_step",
                    "agent": "supervisor",
                    "step": "tool_result",
                    "tool": ename,
                    "content": summary,
                })

                # Accumulate any products this tool produced (for end-of-turn curation)
                if presenter and presenter.extract_products:
                    for p in presenter.extract_products(parsed):
                        if not any(x.get("id") == p.get("id") for x in all_turn_products):
                            all_turn_products.append(p)

                # Handle cart mutations
                if presenter and presenter.extract_cart_item:
                    item = presenter.extract_cart_item(parsed)
                    if item:
                        await _emit_cart_state(session_id, just_added=item)

            # ── Final assistant message ──
            elif etype == "on_chain_end" and ename == "LangGraph":
                output = data.get("output", {})
                msgs = output.get("messages", []) if isinstance(output, dict) else []
                for m in reversed(msgs):
                    if hasattr(m, "type") and m.type == "ai" and m.content:
                        final_content = m.content
                        break

        # Curate and emit the products the agent actually cited (or empty to clear)
        cited: list[dict] = []
        if all_turn_products and final_content:
            cited = _filter_products_cited_in_text(all_turn_products, final_content)
            await manager.send_json(session_id, {"type": "products", "products": cited})

        # Save the curated products for next turn's context block, so references
        # like "add them to cart" resolve to the EXACT IDs the user saw.
        # Note: if no products were cited this turn, we keep the previous turn's
        # last_products intact — the user might still be referencing them.
        if cited:
            set_session_last_products(session_id, cited)

        # Emit the final assistant response
        await manager.send_json(session_id, {
            "type": "assistant_message",
            "content": final_content or (
                "I processed your request but didn't have much to add. "
                "Could you give me a bit more detail about what you're looking for?"
            ),
        })

    except Exception as e:
        traceback.print_exc()
        await manager.send_json(session_id, {
            "type": "agent_step",
            "agent": "supervisor",
            "step": "error",
            "content": f"Error: {str(e)[:200]}",
        })
        await manager.send_json(session_id, {
            "type": "assistant_message",
            "content": f"I hit a snag. Try rephrasing? (technical: {str(e)[:100]})",
        })

    return conversation


# ── WebSocket endpoint ─────────────────────────────────────────────────────


@router.websocket("/ws/chat/{session_id}")
async def chat_websocket(websocket: WebSocket, session_id: str) -> None:
    # Validate API key from query params before accepting the connection
    token_result = validate_ws_token(websocket)
    if token_result == "__REJECT__":
        await websocket.close(code=4001, reason="Invalid or missing API key")
        return

    await manager.connect(session_id, websocket)
    conversation: list = SESSION_CONVERSATIONS.setdefault(session_id, [])
    await _emit_cart_state(session_id)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "user_message":
                content = data.get("content", "")
                user_id = data.get("user_id", "")
                if not content.strip():
                    continue

                # Validate session ownership: the first user_id to send a
                # message on this session becomes the owner. Subsequent
                # messages from a different user_id are rejected.
                if not track_session_owner(session_id, user_id):
                    await manager.send_json(session_id, {
                        "type": "error",
                        "content": "Session owned by a different user",
                    })
                    continue

                conversation = await _stream_agent_turn(
                    session_id, user_id, content, conversation
                )
                if len(conversation) > 30:
                    conversation = conversation[-30:]
                SESSION_CONVERSATIONS[session_id] = conversation

            elif msg_type == "add_to_cart_action":
                # UI button click — bypass the agent, add directly
                product_id = data.get("product_id", "")
                quantity = int(data.get("quantity", 1))
                details = await _get_product_details(product_id)
                if details:
                    item = {
                        "product_id": product_id,
                        "name": details["name"],
                        "brand": details["brand"],
                        "price": float(details["price"]),
                        "quantity": quantity,
                    }
                    cart = SESSION_CARTS.setdefault(session_id, [])
                    existing = next(
                        (c for c in cart if c["product_id"] == product_id), None
                    )
                    if existing:
                        existing["quantity"] = int(existing.get("quantity", 1)) + quantity
                    else:
                        cart.append(item)
                    await _emit_cart_state(session_id, just_added=item)

            elif msg_type == "reset":
                conversation = []
                SESSION_CONVERSATIONS[session_id] = []
                await manager.send_json(session_id, {
                    "type": "assistant_message",
                    "content": "Conversation reset. What can I help you find?",
                })

            elif msg_type == "clear_cart":
                SESSION_CARTS[session_id] = []
                await _emit_cart_state(session_id)

    except WebSocketDisconnect:
        manager.disconnect(session_id)
