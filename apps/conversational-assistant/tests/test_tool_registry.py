"""Tests for the config-driven tool system.

Covers:
- TOOL_REGISTRY completeness
- Tool filtering per persona config
- Tool description customization
- Domain action route loading
"""

import copy

import pytest

from src.agents.react_tools import AGENT_TOOLS, TOOL_REGISTRY
from src.agents.supervisor import (
    _customize_tool_descriptions,
    _get_entity_names,
    _resolve_tools,
)


# ---------------------------------------------------------------------------
# TOOL_REGISTRY
# ---------------------------------------------------------------------------


class TestToolRegistry:
    def test_registry_has_all_agent_tools(self):
        """Every tool in AGENT_TOOLS should have a registry entry."""
        registry_tools = list(TOOL_REGISTRY.values())
        for tool in AGENT_TOOLS:
            assert tool in registry_tools, f"Tool '{tool.name}' missing from TOOL_REGISTRY"

    def test_registry_keys_are_short_strings(self):
        for key in TOOL_REGISTRY:
            assert isinstance(key, str)
            assert " " not in key, f"Registry key '{key}' should not contain spaces"
            assert len(key) < 30, f"Registry key '{key}' is too long"

    def test_registry_includes_domain_action(self):
        assert "domain_action" in TOOL_REGISTRY

    def test_all_tools_have_name_and_description(self):
        for key, tool in TOOL_REGISTRY.items():
            assert hasattr(tool, "name"), f"Tool '{key}' has no name attribute"
            assert hasattr(tool, "description"), f"Tool '{key}' has no description"
            assert tool.description, f"Tool '{key}' has empty description"


# ---------------------------------------------------------------------------
# Tool Filtering (_resolve_tools)
# ---------------------------------------------------------------------------


class TestToolFiltering:
    def test_no_tools_key_returns_all(self):
        """Missing 'tools' key = backward compat, all tools."""
        config = {"id": "test", "persona": {}}
        tools = _resolve_tools(config)
        assert len(tools) == len(AGENT_TOOLS)

    def test_empty_tools_returns_empty(self):
        config = {"tools": []}
        tools = _resolve_tools(config)
        assert tools == []

    def test_subset_filtering(self):
        config = {"tools": ["search", "details", "explain"]}
        tools = _resolve_tools(config)
        assert len(tools) == 3
        names = {t.name for t in tools}
        assert "search_products" in names
        assert "get_product_details" in names
        assert "explain_product" in names

    def test_unknown_key_skipped(self):
        config = {"tools": ["search", "nonexistent_tool", "details"]}
        tools = _resolve_tools(config)
        assert len(tools) == 2  # nonexistent skipped

    def test_wealth_config_no_cart(self):
        """Wealth config should not include cart/deals/complements tools."""
        config = {
            "tools": ["search", "details", "explain", "preferences",
                      "learn_preference", "upload", "domain_action"]
        }
        tools = _resolve_tools(config)
        names = {t.name for t in tools}
        assert "add_to_cart" not in names
        assert "get_cart_contents" not in names
        assert "find_deals" not in names
        assert "find_complements" not in names
        assert "domain_action" in names

    def test_ace_config_has_all(self):
        config = {
            "tools": ["search", "details", "complements", "deals", "explain",
                      "cart", "cart_contents", "preferences", "learn_preference",
                      "upload", "domain_action"]
        }
        tools = _resolve_tools(config)
        assert len(tools) == 11

    def test_order_preserved(self):
        config = {"tools": ["upload", "search", "details"]}
        tools = _resolve_tools(config)
        assert tools[0].name == "analyze_upload"
        assert tools[1].name == "search_products"
        assert tools[2].name == "get_product_details"


# ---------------------------------------------------------------------------
# Description Customization
# ---------------------------------------------------------------------------


class TestDescriptionCustomization:
    def test_product_noop(self):
        """Retail (product) should return tools unchanged."""
        tools = list(AGENT_TOOLS[:2])
        result = _customize_tool_descriptions(tools, "product", "products")
        # Should be the same objects (no copy needed)
        assert result is tools

    def test_investment_product_replacement(self):
        # Create a mock tool with a generic description
        mock_tool = copy.copy(AGENT_TOOLS[0])  # search_products_tool
        mock_tool.description = "Search the catalog for items matching a query."
        tools = [mock_tool]

        result = _customize_tool_descriptions(tools, "Investment Product", "Investment Products")
        assert len(result) == 1
        assert "Investment Products matching" in result[0].description
        # Original should be untouched
        assert "items matching" in mock_tool.description

    def test_insurance_plan_replacement(self):
        mock_tool = copy.copy(AGENT_TOOLS[0])
        mock_tool.description = "Find available items in the catalog."
        tools = [mock_tool]

        result = _customize_tool_descriptions(tools, "Insurance Plan", "Insurance Plans")
        assert "Insurance Plans" in result[0].description

    def test_does_not_mutate_originals(self):
        original_desc = AGENT_TOOLS[0].description
        tools = list(AGENT_TOOLS[:1])
        _customize_tool_descriptions(tools, "Widget", "Widgets")
        assert AGENT_TOOLS[0].description == original_desc


# ---------------------------------------------------------------------------
# Entity Names
# ---------------------------------------------------------------------------


class TestEntityNames:
    def test_ace_hardware(self):
        name, plural = _get_entity_names("ace-hardware")
        assert name == "Product"
        assert plural == "Products"

    def test_wealth(self):
        name, plural = _get_entity_names("wealth-investment-advisor")
        assert name == "Investment Product"
        assert plural == "Investment Products"

    def test_insurance(self):
        name, plural = _get_entity_names("insurance-claims-advisor")
        assert name == "Insurance Plan"
        assert plural == "Insurance Plans"

    def test_missing_config_defaults(self):
        name, plural = _get_entity_names("nonexistent-config-xyz")
        assert name == "product"
        assert plural == "products"
