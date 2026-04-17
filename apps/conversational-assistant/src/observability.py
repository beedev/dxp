"""Langfuse observability integration for Agentic Commerce.

Langfuse v4 reads LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY, and
LANGFUSE_BASE_URL from environment variables automatically.
"""

import os

from src.config import settings


def get_langfuse_handler(
    session_id: str | None = None,
    user_id: str | None = None,
    trace_name: str = "agentic-commerce",
):
    """Create a Langfuse callback handler for LangGraph tracing.

    Returns CallbackHandler if Langfuse is enabled, None otherwise.
    """
    if not settings.langfuse_enabled:
        return None

    try:
        # Ensure env vars are set for Langfuse SDK auto-config
        os.environ.setdefault("LANGFUSE_SECRET_KEY", settings.langfuse_secret_key)
        os.environ.setdefault("LANGFUSE_PUBLIC_KEY", settings.langfuse_public_key)
        os.environ.setdefault("LANGFUSE_HOST", settings.langfuse_base_url)

        from langfuse.langchain import CallbackHandler

        return CallbackHandler(
            public_key=settings.langfuse_public_key,
        )
    except Exception as e:
        print(f"Langfuse init warning (non-fatal): {e}")
        return None
