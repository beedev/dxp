"""Tests for the domain action tool and persona action configs.

Covers:
- Action route loading from persona configs
- Persona configs have valid action definitions
- Action route structure validation
"""

import json
from pathlib import Path

import pytest

from src.agents.persona import load_persona
from src.agents.tools.domain_action import get_action_routes, set_action_routes

CONFIGS_DIR = Path(__file__).resolve().parent.parent / "configs"


# ---------------------------------------------------------------------------
# Action Route Management
# ---------------------------------------------------------------------------


class TestActionRoutes:
    def test_set_and_get(self):
        routes = {
            "file_claim": {"bff_endpoint": "/claims", "method": "POST"},
        }
        set_action_routes(routes)
        assert get_action_routes() == routes

    def test_empty_routes(self):
        set_action_routes({})
        assert get_action_routes() == {}


# ---------------------------------------------------------------------------
# Persona Config Action Definitions
# ---------------------------------------------------------------------------


class TestPersonaActions:
    def test_ace_hardware_has_actions(self):
        cfg = load_persona("ace-hardware")
        actions = cfg.get("actions", {})
        assert "create_order" in actions
        assert actions["create_order"]["bff_endpoint"] == "/orders"

    def test_wealth_has_actions(self):
        cfg = load_persona("wealth-investment-advisor")
        actions = cfg.get("actions", {})
        assert "place_order" in actions
        assert "start_sip" in actions
        assert actions["place_order"]["method"] == "POST"
        assert "symbol" in actions["place_order"]["required_fields"]

    def test_insurance_has_actions(self):
        cfg = load_persona("insurance-claims-advisor")
        actions = cfg.get("actions", {})
        assert "file_claim" in actions
        assert "check_claim_status" in actions
        assert "get_quote" in actions
        assert actions["file_claim"]["method"] == "POST"
        assert "policy_id" in actions["file_claim"]["required_fields"]

    def test_all_actions_have_required_structure(self):
        """Every action in every config must have bff_endpoint and method."""
        for config_name in ["ace-hardware", "wealth-investment-advisor", "insurance-claims-advisor"]:
            cfg = load_persona(config_name)
            actions = cfg.get("actions", {})
            for action_type, meta in actions.items():
                assert "bff_endpoint" in meta, (
                    f"{config_name}.actions.{action_type} missing bff_endpoint"
                )
                assert "method" in meta, (
                    f"{config_name}.actions.{action_type} missing method"
                )
                assert meta["method"] in ("GET", "POST", "PUT", "DELETE"), (
                    f"{config_name}.actions.{action_type} has invalid method: {meta['method']}"
                )


# ---------------------------------------------------------------------------
# Persona Config Tool Lists
# ---------------------------------------------------------------------------


class TestPersonaToolLists:
    def test_ace_has_tools_key(self):
        cfg = load_persona("ace-hardware")
        assert "tools" in cfg
        assert "domain_action" in cfg["tools"]

    def test_wealth_has_tools_key(self):
        cfg = load_persona("wealth-investment-advisor")
        assert "tools" in cfg
        assert "domain_action" in cfg["tools"]
        assert "cart" not in cfg["tools"]
        assert "deals" not in cfg["tools"]

    def test_insurance_has_tools_key(self):
        cfg = load_persona("insurance-claims-advisor")
        assert "tools" in cfg
        assert "domain_action" in cfg["tools"]
        assert "cart" not in cfg["tools"]

    def test_all_tool_keys_are_valid(self):
        """Every tool key in every config must exist in TOOL_REGISTRY."""
        from src.agents.react_tools import TOOL_REGISTRY
        for config_name in ["ace-hardware", "wealth-investment-advisor", "insurance-claims-advisor"]:
            cfg = load_persona(config_name)
            for tool_key in cfg.get("tools", []):
                assert tool_key in TOOL_REGISTRY, (
                    f"{config_name} references unknown tool key '{tool_key}'"
                )
