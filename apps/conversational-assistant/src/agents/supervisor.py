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
import re
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
    """Return (display_name, display_name_plural) from the config."""
    # Try inline data block first (merged format)
    try:
        cfg = load_persona(config_id)
        entity_cfg = cfg.get("data", {}).get("entity", {})
        if entity_cfg:
            return (
                entity_cfg.get("display_name", "product"),
                entity_cfg.get("display_name_plural", "products"),
            )
    except FileNotFoundError:
        pass

    # Fallback: separate data config (legacy)
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

def _setup_domain_actions(config: dict, config_id: str, tools: list) -> list:
    """Load action routes from persona config and configure the domain_action tool.

    Side effects:
    - Registers action routes via `set_action_routes` so the tool can dispatch.
    - Mutates the `domain_action` tool's description in `tools` to include the
      action catalog (action_type, description, required payload fields). The
      LLM only learns what actions exist via this description — without it,
      it has to guess, and the supervisor's guess hint isn't visible to the
      model.

    Path params from `bff_endpoint` (e.g., `{claim_id}` from `/claims/{claim_id}`)
    are auto-extracted and merged into `required_fields` so the LLM knows what
    payload keys it needs to populate.
    """
    actions = config.get("actions", {})
    set_action_routes(actions)

    if not actions:
        return tools

    action_lines = []
    for action_type, meta in actions.items():
        desc = meta.get("description", action_type)
        path = meta.get("bff_endpoint", "")
        path_params = re.findall(r"\{(\w+)\}", path)
        required = list(dict.fromkeys([*meta.get("required_fields", []), *path_params]))
        fields_str = f" (payload: {', '.join(required)})" if required else ""
        action_lines.append(f"  - '{action_type}': {desc}{fields_str}")

    catalog = (
        "\n\nAvailable action_type values for this deployment:\n"
        + "\n".join(action_lines)
        + "\n\nWhen the user clicks an entity action button, you'll receive a message "
        "of the form `Use the domain_action tool with action_type \"X\" for \"<name>\" "
        "with entity_id=<id>, ...`. Map `entity_id` to the correct payload field for "
        "that action's path (the `payload` hints above tell you which field name to use)."
    )

    # Mutate the domain_action tool's description in-place — copy the tool
    # object first so other personas using the same registry don't pick up
    # this deployment's catalog.
    customized: list = []
    for t in tools:
        if getattr(t, "name", None) == "domain_action":
            t = copy.copy(t)
            t.description = (t.description or "") + catalog
        customized.append(t)

    logger.info(f"Loaded {len(actions)} domain actions for {config_id}: {list(actions.keys())}")
    return customized


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

    # Gap 4: domain action routes — also amends the domain_action tool's
    # description with the available action catalog for this persona.
    tools = _setup_domain_actions(persona_config, config_id, tools)

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

    Also includes:
    - `entity_config`: layout + action for the FIRST declared entity type
      (back-compat with frontends that read a single config).
    - `entity_configs`: full map keyed by entity_type, so the frontend can
      pick the right layout per result when search returns mixed types.
    """
    cfg = load_persona(config_id)
    ui = dict(cfg.get("ui", {}))

    data = cfg.get("data", {}) or {}
    sources = data.get("sources") or []
    legacy_entity = data.get("entity") or {}

    def _shape(entry: dict) -> dict:
        return {
            "card_layout": entry.get("card_layout"),
            "action": entry.get("action"),
            "display_name": entry.get("display_name"),
            "display_name_plural": entry.get("display_name_plural"),
        }

    if sources:
        ui["entity_configs"] = {
            s["entity_type"]: _shape(s) for s in sources if s.get("entity_type")
        }
        # Pick the first as the default single-config (back-compat).
        first = sources[0]
        ui["entity_config"] = _shape(first)
    elif legacy_entity:
        ui["entity_config"] = _shape(legacy_entity)
        et = legacy_entity.get("name")
        if et:
            ui["entity_configs"] = {et: ui["entity_config"]}

    # Fallback: separate data config in configs/data/<id>.json (legacy).
    if "entity_config" not in ui:
        try:
            from src.db.ingest import load_data_config
            data_cfg = load_data_config(config_id)
            ent = data_cfg.get("entity") or {}
            ui["entity_config"] = _shape(ent)
            et = ent.get("name")
            if et:
                ui["entity_configs"] = {et: ui["entity_config"]}
        except FileNotFoundError:
            pass

    # Expose inline-checkout config so the chat UI can render the Stripe
    # Elements card with persona-driven labels. Absence = no inline checkout
    # for this tenant, which is the default for non-retail verticals.
    checkout = data.get("checkout")
    if isinstance(checkout, dict) and checkout.get("enabled"):
        ui["checkout"] = checkout

    return ui


# Backward-compat alias used by chat.py
def build_graph():
    return build_agent()
