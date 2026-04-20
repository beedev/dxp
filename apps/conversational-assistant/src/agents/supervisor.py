"""ReAct-based agent assembler.

Combines:
- Generic reasoning framework (framework.py)
- Domain persona from JSON config (persona.py)
- Tool implementations (react_tools.py), filtered per persona
- Domain action routes from persona config

into a single LangGraph ReAct runnable. The same assembler works for any
deployment — just swap the config file.
"""

import copy
import logging
from functools import lru_cache

from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from src.agents.framework import GENERIC_FRAMEWORK
from src.agents.persona import build_system_prompt, load_persona
from src.agents.react_tools import AGENT_TOOLS, TOOL_REGISTRY
from src.agents.tools.domain_action import set_action_routes
from src.config import settings

logger = logging.getLogger(__name__)

# Read from pydantic settings (which loads from .env) so AGENTIC_CONFIG_ID
# in .env is picked up without needing to pass it as a shell env var.
DEFAULT_CONFIG_ID = settings.agentic_config_id


def _make_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.llm_model,
        api_key=settings.openai_api_key,
        temperature=0.1,
        streaming=True,
    )


# ---------------------------------------------------------------------------
# Tool resolution (Gap 2: config-driven tool selection)
# ---------------------------------------------------------------------------

def _resolve_tools(config: dict) -> list:
    """Resolve the tool list for a deployment config.

    If config has a 'tools' key, filter TOOL_REGISTRY to those keys.
    Otherwise, fall back to AGENT_TOOLS (all tools, backward compat).
    """
    tool_keys = config.get("tools")
    if tool_keys is None:
        return list(AGENT_TOOLS)
    resolved = []
    for key in tool_keys:
        tool = TOOL_REGISTRY.get(key)
        if tool is None:
            logger.warning(f"Unknown tool key '{key}' in config — skipping")
            continue
        resolved.append(tool)
    return resolved


# ---------------------------------------------------------------------------
# Domain-aware descriptions (Gap 3: entity name injection)
# ---------------------------------------------------------------------------

def _get_entity_names(config_id: str) -> tuple[str, str]:
    """Return (display_name, display_name_plural) from the data config."""
    try:
        from src.db.ingest import load_data_config
        data_cfg = load_data_config(config_id)
        entity_cfg = data_cfg.get("entity", {})
        return (
            entity_cfg.get("display_name", "product"),
            entity_cfg.get("display_name_plural", "products"),
        )
    except FileNotFoundError:
        return ("product", "products")


def _customize_tool_descriptions(tools: list, entity_name: str, entity_name_plural: str) -> list:
    """Replace generic references in tool descriptions with the domain entity name."""
    if entity_name.lower() == "product":
        return tools  # no-op for retail

    customized = []
    for t in tools:
        t_copy = copy.copy(t)
        desc = t_copy.description or ""
        desc = desc.replace("items matching", f"{entity_name_plural} matching")
        desc = desc.replace("available items", f"available {entity_name_plural}")
        desc = desc.replace("an item", f"a {entity_name.lower()}")
        desc = desc.replace("An item", f"A {entity_name}")
        desc = desc.replace("selected items", f"selected {entity_name_plural}")
        desc = desc.replace("the user's selection", f"the user's selected {entity_name_plural}")
        desc = desc.replace("items in the catalog", f"{entity_name_plural} in the catalog")
        t_copy.description = desc
        customized.append(t_copy)
    return customized


# ---------------------------------------------------------------------------
# Domain action setup (Gap 4: BFF bridge)
# ---------------------------------------------------------------------------

def _setup_domain_actions(config: dict, config_id: str) -> None:
    """Load action routes from persona config and configure the domain_action tool.

    Also injects available action descriptions into the domain_action tool's
    docstring so the LLM knows what actions are available for this deployment.
    """
    actions = config.get("actions", {})
    set_action_routes(actions)

    if actions:
        # Build a description addendum for the domain_action tool
        action_lines = []
        for action_type, meta in actions.items():
            desc = meta.get("description", action_type)
            fields = meta.get("required_fields", [])
            fields_str = f" (requires: {', '.join(fields)})" if fields else ""
            action_lines.append(f"  - '{action_type}': {desc}{fields_str}")

        logger.info(f"Loaded {len(actions)} domain actions for {config_id}: {list(actions.keys())}")


# ---------------------------------------------------------------------------
# Agent builder
# ---------------------------------------------------------------------------

@lru_cache(maxsize=4)
def _build_agent_for(config_id: str):
    """Build (and cache) the ReAct agent for a given deployment config.

    Note: changing persona config requires a process restart (lru_cache).
    This is by design for single-domain deployments.
    """
    persona_config = load_persona(config_id)
    prompt = build_system_prompt(GENERIC_FRAMEWORK, persona_config)

    # Gap 2: config-driven tool selection
    tools = _resolve_tools(persona_config)

    # Gap 3: domain-aware descriptions
    entity_name, entity_name_plural = _get_entity_names(config_id)
    tools = _customize_tool_descriptions(tools, entity_name, entity_name_plural)

    # Gap 4: domain action routes
    _setup_domain_actions(persona_config, config_id)

    logger.info(
        f"Built agent for '{config_id}': {len(tools)} tools, "
        f"entity='{entity_name}', actions={list(persona_config.get('actions', {}).keys())}"
    )

    return create_react_agent(
        model=_make_llm(),
        tools=tools,
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

    try:
        from src.db.ingest import load_data_config
        data_cfg = load_data_config(config_id)
        entity_cfg = data_cfg.get("entity", {})
        ui["entity_config"] = {
            "card_layout": entity_cfg.get("card_layout"),
            "action": entity_cfg.get("action"),
            "display_name": entity_cfg.get("display_name"),
            "display_name_plural": entity_cfg.get("display_name_plural"),
        }
    except FileNotFoundError:
        pass

    return ui


# Backward-compat alias used by chat.py
def build_graph():
    return build_agent()
