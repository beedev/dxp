"""API security -- key-based auth for service-to-service calls.

The FastAPI backend sits behind the BFF which handles JWT/Keycloak auth.
This module adds a simple API key check so only the BFF (or authorized
callers) can reach these endpoints. In dev mode, auth is bypassed.

Environment variables:
    AGENTIC_API_KEY     -- shared secret the BFF sends in X-API-Key header
    AGENTIC_ADMIN_KEY   -- separate key for config_builder / data_pipeline
    DEV_AUTH_BYPASS      -- skip all auth checks (local development only)
    ENV                  -- "production" blocks DEV_AUTH_BYPASS as a safety net
"""

import logging
import os

from fastapi import HTTPException, Request, WebSocket

logger = logging.getLogger(__name__)

# ── Configuration (read once at import time) ──────────────────────────────

API_KEY: str = os.environ.get("AGENTIC_API_KEY", "")
ADMIN_API_KEY: str = os.environ.get("AGENTIC_ADMIN_KEY", "")
DEV_AUTH_BYPASS: bool = os.environ.get("DEV_AUTH_BYPASS", "false").lower() == "true"
ENV: str = os.environ.get("ENV", "development")


# ── Startup safety check ─────────────────────────────────────────────────


def check_auth_config() -> None:
    """Called during app startup. Refuses to boot if bypass is on in prod."""
    if DEV_AUTH_BYPASS and ENV == "production":
        raise RuntimeError(
            "FATAL: DEV_AUTH_BYPASS=true is set in a production environment. "
            "This is a critical security misconfiguration. "
            "Remove DEV_AUTH_BYPASS or set ENV to something other than 'production'."
        )
    if DEV_AUTH_BYPASS:
        logger.warning("DEV_AUTH_BYPASS is enabled -- all auth checks are skipped")
    elif not API_KEY:
        logger.warning(
            "AGENTIC_API_KEY is not set -- API key auth will reject all requests"
        )


# ── FastAPI dependencies ─────────────────────────────────────────────────


async def require_api_key(request: Request) -> None:
    """Dependency: reject requests without a valid X-API-Key header.

    Skipped when DEV_AUTH_BYPASS=true (local development only).
    """
    if DEV_AUTH_BYPASS:
        return
    key = request.headers.get("x-api-key", "")
    if not key or key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


async def require_admin_key(request: Request) -> None:
    """Dependency: reject requests without the admin-level API key.

    Used for config_builder and data_pipeline endpoints that should only
    be accessible to operators, not regular portal users.
    """
    if DEV_AUTH_BYPASS:
        return
    key = request.headers.get("x-api-key", "")
    if not key or key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Admin access required")


# ── WebSocket auth helpers ───────────────────────────────────────────────

# Sentinel returned when the token is invalid (WebSocket handlers cannot
# raise HTTPException before accept(), so they check the return value).
_WS_REJECT = "__REJECT__"


def validate_ws_token(websocket: WebSocket) -> str | None:
    """Extract and validate API key from WebSocket query params.

    Returns:
        The validated token string on success.
        None if DEV_AUTH_BYPASS is active (no token needed).
        The sentinel ``"__REJECT__"`` if the token is missing or invalid --
        the caller should close the socket with code 4001.
    """
    if DEV_AUTH_BYPASS:
        return None
    token = websocket.query_params.get("token", "")
    if not token or token != API_KEY:
        return _WS_REJECT
    return token


# Per-session user ownership: the first user_id seen on a WebSocket
# becomes the session owner. Subsequent messages must match.
SESSION_OWNERS: dict[str, str] = {}


def track_session_owner(session_id: str, user_id: str) -> bool:
    """Register or validate session ownership.

    On the first call for a session_id, records user_id as the owner.
    On subsequent calls, returns True only if user_id matches the owner.
    """
    if not user_id:
        # Allow empty user_id (anonymous / demo mode) -- no ownership enforced
        return True
    existing = SESSION_OWNERS.get(session_id)
    if existing is None:
        SESSION_OWNERS[session_id] = user_id
        return True
    return existing == user_id
