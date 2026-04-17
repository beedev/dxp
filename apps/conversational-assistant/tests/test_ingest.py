"""Tests for the generic entity ingestion pipeline.

Covers:
- Field mapping (apply_field_map)
- Embedding template rendering (render_embedding_text)
- Data config loading
- Config structure validation
"""

import pytest

from src.db.ingest import apply_field_map, load_data_config, render_embedding_text


# ---------------------------------------------------------------------------
# Field Mapping
# ---------------------------------------------------------------------------


class TestFieldMapping:
    def test_basic_mapping(self):
        source = {"productName": "Drill", "productPrice": 99.99}
        field_map = {"name": "productName", "price": "productPrice"}
        result = apply_field_map(source, field_map)
        assert result == {"name": "Drill", "price": 99.99}

    def test_missing_source_field_returns_none(self):
        source = {"name": "Drill"}
        field_map = {"name": "name", "brand": "brandName"}
        result = apply_field_map(source, field_map)
        assert result["name"] == "Drill"
        assert result["brand"] is None

    def test_empty_field_map(self):
        result = apply_field_map({"a": 1, "b": 2}, {})
        assert result == {}

    def test_identity_mapping(self):
        source = {"name": "DBS", "sector": "Financials"}
        field_map = {"name": "name", "sector": "sector"}
        result = apply_field_map(source, field_map)
        assert result == source


# ---------------------------------------------------------------------------
# Embedding Template Rendering
# ---------------------------------------------------------------------------


class TestEmbeddingTemplate:
    def test_basic_template(self):
        record = {"name": "DBS Group", "sector": "Financials", "description": "A bank"}
        template = "{name}. Sector: {sector}. {description}"
        result = render_embedding_text(record, template)
        assert result == "DBS Group. Sector: Financials. A bank"

    def test_missing_field_renders_empty(self):
        """Missing template keys should produce empty strings, not KeyError."""
        record = {"name": "DBS Group"}
        template = "{name} by {brand}. {category}. {description}"
        result = render_embedding_text(record, template)
        assert result == "DBS Group by . . "

    def test_none_values_render_empty(self):
        record = {"name": "DBS", "brand": None}
        template = "{name} by {brand}"
        result = render_embedding_text(record, template)
        assert result == "DBS by "

    def test_numeric_values(self):
        record = {"name": "Gold ETF", "return_1y": 25.3, "min_investment": 50}
        template = "{name}: {return_1y}% return, min ${min_investment}"
        result = render_embedding_text(record, template)
        assert "25.3" in result
        assert "50" in result

    def test_retail_template(self):
        record = {
            "name": "Cordless Drill",
            "brand": "DeWalt",
            "category": "Power Tools",
            "description": "20V max cordless drill",
        }
        template = "{name} by {brand}. Category: {category}. {description}"
        result = render_embedding_text(record, template)
        assert "Cordless Drill by DeWalt" in result
        assert "Power Tools" in result

    def test_wealth_template(self):
        record = {
            "name": "DBS Group",
            "symbol": "DBS",
            "asset_class": "stock",
            "sector": "Financials",
            "risk_level": "moderate",
            "description": "Singapore bank",
        }
        template = "{name} ({symbol}). Asset class: {asset_class}. Sector: {sector}. Risk: {risk_level}. {description}"
        result = render_embedding_text(record, template)
        assert "DBS Group (DBS)" in result
        assert "Financials" in result
        assert "moderate" in result


# ---------------------------------------------------------------------------
# Data Config Loading
# ---------------------------------------------------------------------------


class TestDataConfig:
    def test_load_ace_hardware(self):
        cfg = load_data_config("ace-hardware")
        assert cfg["entity"]["name"] == "product"
        assert "field_map" in cfg["entity"]
        assert "card_layout" in cfg["entity"]
        assert cfg["entity"]["card_layout"]["primary_metric"]["field"] == "price"

    def test_load_wealth(self):
        cfg = load_data_config("wealth-investment-advisor")
        assert cfg["entity"]["name"] == "investment_product"
        assert cfg["entity"]["primary_key_field"] == "symbol"
        assert cfg["entity"]["card_layout"]["subtitle"] == "asset_class"

    def test_load_insurance(self):
        cfg = load_data_config("insurance-claims-advisor")
        assert cfg["entity"]["name"] == "insurance_plan"
        assert cfg["entity"]["card_layout"]["primary_metric"]["format"] == "currency"

    def test_missing_config_raises(self):
        with pytest.raises(FileNotFoundError):
            load_data_config("nonexistent-vertical-xyz")

    def test_all_configs_have_required_fields(self):
        for config_id in ["ace-hardware", "wealth-investment-advisor", "insurance-claims-advisor"]:
            cfg = load_data_config(config_id)
            entity = cfg["entity"]
            assert "name" in entity
            assert "field_map" in entity
            assert "card_layout" in entity
            assert "action" in entity
            assert "headline" in entity["card_layout"]
            assert "primary_metric" in entity["card_layout"]
