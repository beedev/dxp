"""ReAct-based agent assembler.

Combines:
- Generic reasoning framework (framework.py)
- Domain persona from JSON config (persona.py)
- Tool implementations (react_tools.py)

into a single LangGraph ReAct runnable. The same assembler works for any
deployment — just swap the config file.
"""

from functools import lru_cache

from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from src.agents.framework import GENERIC_FRAMEWORK
from src.agents.persona import build_system_prompt, load_persona
from src.agents.react_tools import AGENT_TOOLS
from src.config import settings

# Default deployment config. In a real multi-tenant setup this would come
# from the request context (user's tenant id). For this POC it's either the
# AGENTIC_CONFIG_ID env var or "ace-hardware".
import os
DEFAULT_CONFIG_ID = os.environ.get("AGENTIC_CONFIG_ID", "ace-hardware")


def _make_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.llm_model,
        api_key=settings.openai_api_key,
        temperature=0.1,  # low for consistent demo behavior
        streaming=True,
    )


@lru_cache(maxsize=4)
def _build_agent_for(config_id: str):
    """Build (and cache) the ReAct agent for a given deployment config."""
    persona_config = load_persona(config_id)
    prompt = build_system_prompt(GENERIC_FRAMEWORK, persona_config)
    return create_react_agent(
        model=_make_llm(),
        tools=AGENT_TOOLS,
        prompt=prompt,
    )


def build_agent(config_id: str = DEFAULT_CONFIG_ID):
    """Return the ReAct agent for this deployment."""
    return _build_agent_for(config_id)


def get_ui_config(config_id: str = DEFAULT_CONFIG_ID) -> dict:
    """Return the UI hints (title, suggestions, greeting) for the frontend.

    Also includes entity_config (card_layout + action) from the data config
    so the frontend knows how to render entity cards for this vertical.
    """
    cfg = load_persona(config_id)
    ui = dict(cfg.get("ui", {}))

    # Load entity config from the matching data config
    try:
        from src.db.ingest import load_data_config
        # Try data config with same id as persona config
        data_cfg = load_data_config(config_id)
        entity_cfg = data_cfg.get("entity", {})
        ui["entity_config"] = {
            "card_layout": entity_cfg.get("card_layout"),
            "action": entity_cfg.get("action"),
            "display_name": entity_cfg.get("display_name"),
            "display_name_plural": entity_cfg.get("display_name_plural"),
        }
    except FileNotFoundError:
        pass  # No data config for this persona — entity_config stays absent

    return ui


# Backward-compat alias used by chat.py
def build_graph():
    return build_agent()
