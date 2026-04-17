"""Generic domain action tool — delegates business actions to BFF endpoints.

Instead of creating N domain-specific tools in Python (file_claim, place_order,
submit_prior_auth), this ONE tool routes to the BFF's existing domain modules
via HTTP. The persona config's "actions" section maps action types to BFF
endpoints.

Adding a new action = one JSON entry in the persona config + a BFF endpoint.
Zero Python changes.
"""

import logging
from contextvars import ContextVar
from typing import Any

import httpx
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from src.config import settings

logger = logging.getLogger(__name__)

# Loaded at agent build time from persona config's "actions" section.
# Maps action_type -> {"bff_endpoint": str, "method": str, "description": str, "required_fields": [...]}
_action_routes: ContextVar[dict[str, dict]] = ContextVar("_action_routes", default={})


def set_action_routes(routes: dict[str, dict]) -> None:
    """Called by supervisor at agent build time to configure available actions."""
    _action_routes.set(routes)


def get_action_routes() -> dict[str, dict]:
    return _action_routes.get()


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

    # Substitute path params (e.g., /api/claims/{claim_id})
    if payload:
        for key, val in payload.items():
            endpoint = endpoint.replace(f"{{{key}}}", str(val))

    url = f"{bff_url}{endpoint}"
    logger.info(f"domain_action: {action_type} -> {method} {url}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if method == "GET":
                resp = await client.get(url, params=payload)
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
        return {"success": False, "error": f"Cannot reach BFF at {bff_url}. Is the BFF running?"}
    except Exception as e:
        return {"success": False, "error": str(e)[:500]}
