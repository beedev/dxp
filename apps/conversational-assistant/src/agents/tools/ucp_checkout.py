"""UCP Checkout tool — retail-only.

Wraps the BFF's UCP REST endpoints (/.well-known/ucp + /api/v1/ucp/checkout-sessions/*)
in a single LangChain tool with a `step` discriminator so the LLM doesn't have to
chain three `domain_action` calls.

UCP is the Universal Commerce Protocol (https://ucp.dev/) — an open standard for
agentic commerce. The BFF side runs the corresponding `port + adapter` module at
apps/bff/src/modules/ucp-checkout/ and is swappable per-tenant via UCP_ADAPTER env.

State: session id is held in a process-scoped dict keyed by the chat session id
(same pattern as SESSION_CARTS in react_tools.py). The LLM can call step="start"
once, then "update"/"complete" without re-passing the session id.
"""

from __future__ import annotations

import logging
from typing import Any, Literal, Optional

import httpx
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from src.config import settings

logger = logging.getLogger(__name__)

# Per-chat-session UCP state. Cleared when the chat ends.
# { chat_session_id: { "session_id": "chk_…", "status": "open|ready_for_complete|completed|canceled" } }
SESSION_CHECKOUT: dict[str, dict] = {}

UCP_AGENT_HEADER = (
    'profile="https://dxp.local/agent-profiles/shopping-v1"'
)


class LineItemSpec(BaseModel):
    item_id: str = Field(description="Catalog id of the product (entity.external_id)")
    title: str = Field(description="Display name shown to the buyer")
    price_minor_units: int = Field(
        description="Price in the smallest currency unit (e.g. cents). "
        "$18.99 = 1899."
    )
    quantity: int = Field(default=1, ge=1)


class BuyerSpec(BaseModel):
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class FulfillmentSpec(BaseModel):
    type: Literal["shipping", "pickup", "digital"] = "shipping"
    line_item_ids: list[str] = Field(description="ids of LineItem objects this method covers")


class UcpCheckoutInput(BaseModel):
    step: Literal["start", "update", "complete", "cancel", "status"] = Field(
        description=(
            "Lifecycle step. 'start' creates a new session from line_items. "
            "'update' patches buyer/fulfillment on the active session. "
            "'complete' finalizes with payment_token. "
            "'cancel' cancels. 'status' returns the current session."
        ),
    )
    line_items: Optional[list[LineItemSpec]] = Field(
        default=None,
        description="Required for step='start'. Optional patch for step='update'.",
    )
    currency: str = Field(default="USD", description="ISO 4217 currency code")
    buyer: Optional[BuyerSpec] = None
    fulfillment: Optional[FulfillmentSpec] = None
    payment_token: Optional[str] = Field(
        default=None,
        description="Required for step='complete'. Tokenized payment instrument.",
    )


def _as_dict(maybe_model: Any) -> dict:
    """LangChain may pass either a dict or a pydantic BaseModel — normalize."""
    if maybe_model is None:
        return {}
    if isinstance(maybe_model, BaseModel):
        return maybe_model.model_dump(exclude_none=True)
    if isinstance(maybe_model, dict):
        return maybe_model
    return dict(maybe_model)


def _to_ucp_line_item(li: Any, idx: int) -> dict:
    d = _as_dict(li)
    return {
        "id": f"li_{idx}",
        "item": {
            "id": d["item_id"],
            "title": d["title"],
            "price": d["price_minor_units"],
        },
        "quantity": d.get("quantity", 1),
    }


def _bff(path: str) -> str:
    return f"{settings.bff_base_url}{path}"


def _headers() -> dict[str, str]:
    return {
        "Content-Type": "application/json",
        "UCP-Agent": UCP_AGENT_HEADER,
    }


def _augment_with_payment_signal(out: dict, session: dict) -> dict:
    """When the BFF session is ready for payment, expose the Stripe
    client_secret + payment_intent_id so the chat UI can render Stripe
    Elements inline. The frontend looks for `ui_action='collect_payment'`.
    """
    payment = session.get("payment") or {}
    if session.get("status") == "ready_for_complete" and payment.get("client_secret"):
        out["ui_action"] = "collect_payment"
        out["payment_intent_id"] = payment.get("payment_intent_id") or session.get("id")
        out["client_secret"] = payment["client_secret"]
        out["amount"] = next(
            (t.get("amount") for t in (session.get("totals") or []) if t.get("type") == "total"),
            None,
        )
        out["currency"] = session.get("currency", "USD")
    return out


def _active_chat_id() -> str:
    """Best-effort handle on the chat session id so we can scope checkout state."""
    try:
        # Imported lazily to avoid a circular import with react_tools.
        from src.agents.react_tools import current_session_id
        return current_session_id.get() or "default"
    except Exception:
        return "default"


@tool("ucp_checkout", args_schema=UcpCheckoutInput)
async def ucp_checkout_tool(
    step: str,
    line_items: Optional[list[dict]] = None,
    currency: str = "USD",
    buyer: Optional[dict] = None,
    fulfillment: Optional[dict] = None,
    payment_token: Optional[str] = None,
) -> dict[str, Any]:
    """Run a UCP shopping checkout step against the configured commerce backend.

    Use this tool ONLY when the user is ready to actually buy items. Do not call
    it for browsing or product discovery — use `search`/`details` for those.

    Lifecycle:
      step='start'     → create a session from line_items. Returns session id.
      step='update'    → patch buyer + fulfillment selection. Required before complete.
      step='complete'  → submit payment_token. Returns order_id.
      step='cancel'    → cancel an open session.
      step='status'    → fetch current session state.

    The session id is remembered across turns automatically.
    """
    chat_id = _active_chat_id()
    state = SESSION_CHECKOUT.get(chat_id) or {}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if step == "start":
                if not line_items:
                    return {"success": False, "error": "line_items required for step='start'"}
                payload = {
                    "currency": currency,
                    "line_items": [
                        _to_ucp_line_item(li, idx)
                        for idx, li in enumerate(line_items, start=1)
                    ],
                }
                if buyer:
                    payload["buyer"] = _as_dict(buyer)
                resp = await client.post(_bff("/ucp/checkout-sessions"), json=payload, headers=_headers())
                if resp.status_code >= 400:
                    return {"success": False, "error": f"BFF {resp.status_code}", "detail": resp.text[:500]}
                data = resp.json()
                SESSION_CHECKOUT[chat_id] = {"session_id": data["id"], "status": data["status"]}
                logger.info(f"ucp_checkout start -> {data['id']} ({data['status']})")
                return _augment_with_payment_signal({
                    "success": True,
                    "step": "start",
                    "session_id": data["id"],
                    "status": data["status"],
                    "totals": data.get("totals"),
                    "next": "Call step='update' with buyer + fulfillment, then step='complete' with payment_token.",
                }, data)

            session_id = state.get("session_id")
            if not session_id:
                return {
                    "success": False,
                    "error": "No active checkout session. Call step='start' first.",
                }

            if step == "status":
                resp = await client.get(_bff(f"/ucp/checkout-sessions/{session_id}"), headers=_headers())
                if resp.status_code >= 400:
                    return {"success": False, "error": f"BFF {resp.status_code}", "detail": resp.text[:500]}
                data = resp.json()
                SESSION_CHECKOUT[chat_id]["status"] = data["status"]
                return {"success": True, "step": "status", "session": data}

            if step == "update":
                patch: dict[str, Any] = {}
                if line_items:
                    patch["line_items"] = [
                        _to_ucp_line_item(li, idx)
                        for idx, li in enumerate(line_items, start=1)
                    ]
                if buyer:
                    patch["buyer"] = _as_dict(buyer)
                if fulfillment:
                    f = _as_dict(fulfillment)
                    patch["fulfillment"] = {
                        "methods": [
                            {
                                "id": "fm_1",
                                "type": f.get("type", "shipping"),
                                "line_item_ids": f.get("line_item_ids", []),
                            }
                        ]
                    }
                if not patch:
                    return {"success": False, "error": "Provide at least one of buyer, fulfillment, or line_items."}
                resp = await client.put(
                    _bff(f"/ucp/checkout-sessions/{session_id}"), json=patch, headers=_headers()
                )
                if resp.status_code >= 400:
                    return {"success": False, "error": f"BFF {resp.status_code}", "detail": resp.text[:500]}
                data = resp.json()
                SESSION_CHECKOUT[chat_id]["status"] = data["status"]
                return _augment_with_payment_signal({
                    "success": True,
                    "step": "update",
                    "status": data["status"],
                    "totals": data.get("totals"),
                    "next": (
                        "Ready to complete." if data["status"] == "ready_for_complete"
                        else "Provide remaining buyer/fulfillment fields, then call complete."
                    ),
                }, data)

            if step == "complete":
                if not payment_token:
                    return {"success": False, "error": "payment_token required for step='complete'"}
                payload = {
                    "payment_data": {
                        "id": "pi_demo",
                        "handler_id": "com.demo.pay",
                        "type": "card",
                        "credential": {"type": "PAYMENT_GATEWAY", "token": payment_token},
                    }
                }
                resp = await client.post(
                    _bff(f"/ucp/checkout-sessions/{session_id}/complete"),
                    json=payload,
                    headers=_headers(),
                )
                if resp.status_code >= 400:
                    return {"success": False, "error": f"BFF {resp.status_code}", "detail": resp.text[:500]}
                data = resp.json()
                SESSION_CHECKOUT[chat_id] = {"session_id": session_id, "status": "completed"}
                return {
                    "success": True,
                    "step": "complete",
                    "order_id": data.get("order_id"),
                    "payment_id": data.get("payment_id"),
                    "status": data.get("status"),
                }

            if step == "cancel":
                resp = await client.post(
                    _bff(f"/ucp/checkout-sessions/{session_id}/cancel"), headers=_headers()
                )
                if resp.status_code >= 400:
                    return {"success": False, "error": f"BFF {resp.status_code}", "detail": resp.text[:500]}
                data = resp.json()
                SESSION_CHECKOUT[chat_id]["status"] = data["status"]
                return {"success": True, "step": "cancel", "status": data["status"]}

            return {"success": False, "error": f"Unknown step '{step}'"}

    except httpx.ConnectError:
        logger.error(f"ucp_checkout: BFF unreachable at {settings.bff_base_url}")
        return {"success": False, "error": "Commerce service unavailable. Try again shortly."}
    except Exception as exc:  # pragma: no cover - defensive
        logger.error(f"ucp_checkout {step} failed: {exc}")
        return {"success": False, "error": "Checkout step failed. Please try again."}
