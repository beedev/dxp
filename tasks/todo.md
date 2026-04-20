# DXP Conversational Assistant — Remaining Tasks

## In Progress: Merge persona + data configs into single JSON

### What
Merge `configs/<id>.json` (persona) and `configs/data/<id>.json` (data) into one file per vertical. The merged file has a `data` block containing entity schema, card layout, action form, and embeddings.

### Files to change
1. **Merge configs** (3 verticals):
   - `configs/ace-hardware.json` — add `data` block from `configs/data/ace-hardware.json`
   - `configs/wealth-investment-advisor.json` — add `data` block from `configs/data/wealth-investment-advisor.json`
   - `configs/insurance-claims-advisor.json` — add `data` block from `configs/data/insurance-claims-advisor.json`
   - Delete `configs/data/` directory after merge

2. **Update `ingest.py`** — `load_data_config()` should look for `data` block inside the persona config (same file), not in a separate `configs/data/` directory. Fall back to `configs/data/` for backward compat.

3. **Update `supervisor.py`** — `get_ui_config()` currently calls `load_data_config(config_id)` separately. After merge, read `data.entity` from the same persona config dict.

4. **Update integration guide** — `docs/conversational-assistant-guide.md` Steps 2+3 become one step.

5. **Update tests** — `tests/test_ingest.py` and `tests/test_domain_action.py` reference `load_data_config`.

### Merged config structure (documented)
```json
{
  // ═══════════════════════════════════════════════════════════════
  // IDENTITY — who is this assistant?
  // Generated: manually when creating a new vertical
  // ═══════════════════════════════════════════════════════════════
  "id": "wealth-investment-advisor",
  // Unique identifier. Used in AGENTIC_CONFIG_ID env var.
  // System scans all JSON files and matches by this field, not filename.

  "name": "Trading Advisor",
  // Human-readable name. Shown in logs, not to end users.

  "domain_tags": ["trading", "stocks", "futures"],
  // Keywords for filtering/searching configs. Used by /api/agent-configs endpoint.

  // ═══════════════════════════════════════════════════════════════
  // PERSONA — how does the agent think and speak?
  // Generated: manually by someone who understands the domain
  // Could be: LLM-generated via Config Builder UI (/api/agent-configs/generate)
  // ═══════════════════════════════════════════════════════════════
  "persona": {
    "domain_summary": "a Singapore-based retail trading platform",
    // One-line description of the domain. Injected into the LLM system prompt.
    // The LLM uses this to understand its role.

    "voice": "sharp, concise, action-oriented — like a seasoned broker",
    // Personality description. Injected into the LLM system prompt.
    // Controls tone, style, verbosity.

    "tone_rules": [
      "Be action-oriented",
      "Keep responses under 3 paragraphs"
    ]
    // Behavioral rules. Each rule is a sentence the LLM follows.
    // These are the most impactful tuning lever — adding/removing rules
    // changes agent behavior more than any code change.
  },

  // ═══════════════════════════════════════════════════════════════
  // CLARIFYING QUESTIONS — when should the agent ask before acting?
  // Generated: manually, based on domain knowledge
  // ═══════════════════════════════════════════════════════════════
  "clarifying_question_examples": {
    "scenario_name": {
      "trigger_examples": ["keywords", "that", "match"],
      // When the user says something matching these keywords,
      // the agent considers asking these questions.

      "questions": ["What quantity?"]
      // Questions the agent may ask. Empty array = no questions, act immediately.
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // PLAYBOOKS — step-by-step workflows for common scenarios
  // Generated: manually, based on business process knowledge
  // ═══════════════════════════════════════════════════════════════
  "project_playbooks": {
    "description": "Trading workflow playbooks",
    "buy_stock": {
      "trigger_keywords": ["buy", "purchase"],
      // When the user's intent matches these, the agent follows these steps.

      "steps": [
        "Identify: resolve ticker",
        "Confirm: quantity",
        "Execute: place order via domain_action",
        "Report: confirm fill"
      ]
      // Ordered steps the agent follows. Each step is a natural language
      // instruction. The agent uses tools to accomplish each step.
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // UI — what does the frontend show?
  // Generated: manually when creating the vertical
  // ═══════════════════════════════════════════════════════════════
  "ui": {
    "title": "Trading Advisor",
    // Chat window header title.

    "subtitle": "AI-powered trading assistant",
    // Subheading below the title.

    "greeting": "What would you like to trade today?",
    // First message shown to user (before they type anything).

    "greeting_subtitle": "I can look up prices, place orders...",
    // Smaller text below the greeting.

    "suggestions": [
      "What's the price of DBS?",
      "Buy 100 shares of Singtel"
    ]
    // Clickable prompt chips shown on the empty chat screen.
    // Should be realistic examples that demonstrate capabilities.
  },

  // ═══════════════════════════════════════════════════════════════
  // TOOLS — which capabilities does the agent have?
  // Generated: manually, choosing from TOOL_REGISTRY keys
  // ═══════════════════════════════════════════════════════════════
  "tools": ["search", "details", "explain", "preferences", "learn_preference", "upload", "domain_action"],
  // Array of registry keys. Only these tools are available to the LLM.
  // Retail includes: cart, cart_contents, deals, complements
  // Non-retail excludes those.
  // "domain_action" enables BFF business actions.

  // ═══════════════════════════════════════════════════════════════
  // ACTIONS — what business operations can the agent execute?
  // Generated: manually, matching BFF endpoint contracts
  // Each action maps to an existing BFF REST endpoint.
  // ═══════════════════════════════════════════════════════════════
  "actions": {
    "place_order": {
      "bff_endpoint": "/v1/paper/orders",
      // Path appended to BFF_BASE_URL. Supports {param} substitution.

      "method": "POST",
      // HTTP method.

      "description": "Place a paper trading order...",
      // The LLM reads this to decide when to call this action.
      // Be specific about required fields and formats.

      "required_fields": ["symbol", "exchange", "side", "type", "qty", "validity"]
      // Field names the LLM should gather before calling.
      // Must match the BFF's request DTO exactly.
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // DATA — what entities does the agent know about?
  // Generated: manually for schema, can be ingested via Data Pipeline UI
  // This entire block is optional — a pure conversational agent omits it.
  // ═══════════════════════════════════════════════════════════════
  "data": {
    "source": {
      "type": "json_file",
      "path": "/tmp/wealth_investment_products.json"
      // Where to read source data for ingestion.
      // Can be uploaded via Data Pipeline UI.
    },

    "entity": {
      "name": "investment_product",
      // Entity type stored in DB. Used in entity_type column.

      "display_name": "Investment Product",
      "display_name_plural": "Investment Products",
      // Human-readable names. Injected into tool descriptions
      // so the LLM says "Investment Products" not "items".

      "primary_key_field": "symbol",
      // Which mapped field is the business key (sku, symbol, claim_id).

      "group_field": "sector",
      "group_label_field": "asset_class",
      // Fields used for grouping/categorization in search results.

      "field_map": {
        "symbol": "symbol",
        "name": "name",
        "price": "price"
        // Left: stored field name (used in card_layout, embedding template)
        // Right: source JSON field name (from the uploaded data file)
        // All mapped fields go into entity.data JSONB column.
      },

      "card_layout": {
        "headline": "name",
        // Which data field to show as the card title.

        "subtitle": "asset_class",
        // Smaller text above the headline (brand, category, asset class).

        "primary_metric": { "field": "price", "format": "currency", "label": "Price" },
        // Main number displayed prominently.
        // format: currency ($X.XX), percent (X.X%), rating (★ X.X), number

        "secondary_metrics": [
          { "field": "return_1y", "format": "percent", "label": "1Y Return" }
        ],
        // Additional metrics shown smaller, separated by dots.

        "badge": "sector"
        // Field shown as a colored badge/tag.
      },

      "action": {
        "label": "Trade",
        // Button text on the entity card.

        "type": "place_order",
        // Action type — determines behavior:
        // "add_to_cart" = simple add (retail), shows cart in header
        // anything else = hides cart, uses form or sends to LLM

        "form": [
          { "field": "side", "type": "toggle", "options": ["buy", "sell"], "default": "buy" },
          { "field": "qty", "type": "number", "label": "Qty", "default": 100 },
          { "field": "price", "type": "number", "label": "Limit Price", "show_when": "type != market" }
        ]
        // Optional form fields shown when the action button is clicked.
        // If omitted, button acts as simple click (add to cart or send to LLM).
        // Field types: toggle, select, number, text
        // show_when: conditional visibility based on other field values
      }
    },

    "embeddings": {
      "provider": "openai",
      "model": "text-embedding-3-small",
      "dimensions": 1536,
      // Embedding model config. 1536 is standard for text-embedding-3-small.

      "template": "{name} ({symbol}). Sector: {sector}. {description}"
      // Text template for generating vector embeddings.
      // Uses Python format strings with ALL mapped field names.
      // Missing fields render as empty strings.
      // This determines what the semantic search finds.
    }
  }
}
```

### How each block is generated

| Block | Generated By | When |
|-------|-------------|------|
| `id`, `name`, `domain_tags` | Manual | Creating a new vertical |
| `persona` | Manual or Config Builder UI | Creating/tuning the agent personality |
| `clarifying_question_examples` | Manual | Domain expert adds relevant scenarios |
| `project_playbooks` | Manual | Domain expert defines business workflows |
| `ui` | Manual | Creating the frontend chat experience |
| `tools` | Manual (pick from registry) | Deciding which capabilities the agent has |
| `actions` | Manual (match BFF endpoints) | Connecting agent to existing BFF services |
| `data.source` | Data Pipeline UI or manual | Uploading/pointing to source data |
| `data.entity.field_map` | Manual | Mapping source fields to stored fields |
| `data.entity.card_layout` | Manual | Designing how entity cards look |
| `data.entity.action.form` | Manual | Designing the action form per domain |
| `data.embeddings` | Manual | Choosing what to embed for search |

### Implementation steps
1. Create merged config files for all 3 verticals
2. Update `persona.py:load_persona()` — already scans by id, no change needed
3. Update `ingest.py:load_data_config()` — look for `config["data"]` in persona config first, fall back to `configs/data/` directory
4. Update `supervisor.py:get_ui_config()` — read `data.entity` from persona config instead of separate load
5. Delete `configs/data/` directory
6. Update tests
7. Update docs

## Other pending items
- [ ] Broken order field names when LLM calls domain_action (need to verify LLM payload matches BFF DTO)
- [ ] Trading Terminal still shows `@` for orders with missing fields — need to filter/guard in the component
- [ ] Stock Search page doesn't show prices (pre-existing — Yahoo search API doesn't return quotes)
- [ ] Update conversational-assistant-guide.md after config merge
