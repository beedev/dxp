"""Generic domain action tool — delegates business actions to BFF endpoints.

Instead of creating N domain-specific tools in Python (file_claim, place_order,
submit_prior_auth), this ONE tool routes to the BFF's existing domain modules
via HTTP. The persona config's "actions" section maps action types to BFF
endpoints.

Adding a new action = one JSON entry in the persona config + a BFF endpoint.
Zero Python changes.
"""

import logging
import re
from typing import Any

import httpx
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from src.config import settings

logger = logging.getLogger(__name__)

# Loaded at agent build time from persona config's "actions" section.
# Maps action_type -> {"bff_endpoint": str, "method": str, "description": str, "required_fields": [...]}
#
# Process-singleton: the conv-assistant runs ONE persona per process (selected
# via AGENTIC_CONFIG_ID), so a plain module-level dict is correct. Previously
# this was a ContextVar — that was a bug because each async task gets its own
# context, so values set during agent build were invisible to request handlers
# running in different tasks.
_action_routes: dict[str, dict] = {}


def set_action_routes(routes: dict[str, dict]) -> None:
    """Called by supervisor at agent build time to configure available actions."""
    _action_routes.clear()
    _action_routes.update(routes or {})


def get_action_routes() -> dict[str, dict]:
    return dict(_action_routes)


class DomainActionInput(BaseModel):
    action_type: str = Field(description="The action to execute (e.g., 'file_claim', 'place_order', 'start_sip')")
    payload: dict = Field(default_factory=dict, description="Action-specific data fields")


@tool("domain_action", args_schema=DomainActionInput)
async def domain_action_tool(action_type: str, payload: dict | None = None) -> dict[str, Any]:
    """Execute a domain-specific business action through the BFF.

    Use this when the user wants to perform a real action — file a claim,
    place an investment order, submit a prior authorization, get a quote, etc.

    Available actions and their required fields depend on the deployment.
    """
    routes = get_action_routes()
    route = routes.get(action_type)

    if not route:
        available = list(routes.keys())
        return {
            "success": False,
            "error": f"Unknown action '{action_type}'",
            "available_actions": available,
        }

    bff_url = settings.bff_base_url
    endpoint = route["bff_endpoint"]
    method = route.get("method", "POST").upper()

    # Substitute path params (e.g., /api/claims/{claim_id}) and remove the
    # consumed keys from the payload so they aren't *also* sent as query
    # string / body. Sanitize values to prevent path traversal.
    payload = dict(payload or {})
    path_keys = re.findall(r"\{(\w+)\}", endpoint)
    for key in path_keys:
        if key in payload:
            safe_val = re.sub(r"[^a-zA-Z0-9_\-.]", "", str(payload[key]))
            endpoint = endpoint.replace(f"{{{key}}}", safe_val)
            payload.pop(key, None)

    url = f"{bff_url}{endpoint}"
    if not url.startswith(bff_url):
        return {"success": False, "error": "Invalid action endpoint"}
    logger.info(f"domain_action: {action_type} -> {method} {url}")
    logger.info(f"domain_action payload: {payload}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if method == "GET":
                resp = await client.get(url, params=payload or None)
            elif method == "DELETE":
                resp = await client.delete(url)
            else:
                resp = await client.post(url, json=payload or {})

            if resp.status_code >= 400:
                return {
                    "success": False,
                    "error": f"BFF returned {resp.status_code}",
                    "detail": resp.text[:500],
                }

            return {
                "success": True,
                "action_type": action_type,
                "result": resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {"message": resp.text[:500]},
            }
    except httpx.ConnectError:
        logger.error(f"domain_action: BFF unreachable at {bff_url}")
        return {"success": False, "error": "Service temporarily unavailable. Please try again later."}
    except Exception as e:
        logger.error(f"domain_action: {action_type} failed: {e}")
        return {"success": False, "error": "Action failed. Please try again later."}
