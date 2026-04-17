# Conversational Assistant — Integration Guide

## Overview

The conversational assistant adds an AI-powered chat interface to any DXP portal. It uses a ReAct agent (LangGraph + OpenAI) with configurable persona, tools, and domain actions. Adding a new vertical requires **zero Python code changes** — just JSON configuration files and mock data.

## Architecture

```
Portal (React)
  └─ <AgenticAssistant /> from @dxp/ai-assistant
       └─ WebSocket → FastAPI backend (port 8002)
            ├─ LangGraph ReAct Agent
            │   ├─ System prompt = generic framework + persona config
            │   ├─ Tools = filtered per persona config
            │   └─ domain_action tool → BFF HTTP endpoints
            ├─ pgvector semantic search (entities table)
            └─ Persona JSON (voice, playbooks, UI config)
```

## Stack

| Component | Technology |
|-----------|-----------|
| Agent framework | LangGraph + LangChain |
| LLM | OpenAI GPT-4.1 |
| Embeddings | text-embedding-3-small (1536 dim) |
| Database | PostgreSQL + pgvector |
| Backend | FastAPI + uvicorn |
| Frontend | React (@dxp/ai-assistant package) |

## Quick Start — Add AI to a New Portal

### Step 1: Create a persona config

```bash
cp configs/ace-hardware.json configs/your-vertical.json
```

Edit the JSON with your domain's personality:

```json
{
  "id": "your-vertical",
  "name": "Your Assistant Name",
  "domain_tags": ["your", "domain", "tags"],
  "persona": {
    "domain_summary": "a description of what this assistant serves",
    "voice": "how the assistant speaks — tone, personality",
    "tone_rules": [
      "Ask at most 1-2 questions, then act",
      "Be specific: names, numbers, next steps"
    ]
  },
  "clarifying_question_examples": { ... },
  "project_playbooks": { ... },
  "ui": {
    "title": "Your Assistant",
    "subtitle": "One-line description",
    "greeting": "How can I help?",
    "greeting_subtitle": "What I can do for you",
    "suggestions": [
      "Example prompt 1",
      "Example prompt 2"
    ]
  },
  "tools": ["search", "details", "explain", "preferences", "learn_preference", "upload", "domain_action"],
  "actions": {
    "your_action": {
      "bff_endpoint": "/your-endpoint",
      "method": "POST",
      "description": "What this action does",
      "required_fields": ["field1", "field2"]
    }
  }
}
```

### Step 2: Create a data config

```bash
cp configs/data/ace-hardware.json configs/data/your-vertical.json
```

Define your entity schema:

```json
{
  "id": "your-vertical",
  "description": "Your data catalog description",
  "source": {
    "type": "json_file",
    "path": "/tmp/your_data.json"
  },
  "entity": {
    "name": "your_entity_type",
    "display_name": "Your Entity",
    "display_name_plural": "Your Entities",
    "primary_key_field": "id_field",
    "group_field": "category_field",
    "group_label_field": "brand_field",
    "field_map": {
      "id_field": "sourceIdField",
      "name": "sourceName",
      "description": "sourceDescription",
      "custom_field": "sourceCustomField"
    },
    "card_layout": {
      "headline": "name",
      "subtitle": "brand_field",
      "primary_metric": { "field": "price_field", "format": "currency", "label": "Label" },
      "secondary_metrics": [
        { "field": "metric_field", "format": "percent", "label": "Label" }
      ],
      "badge": "category_field"
    },
    "action": { "label": "Button Text", "type": "action_type" }
  },
  "embeddings": {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "dimensions": 1536,
    "template": "{name} ({id_field}). Category: {category_field}. {description}"
  },
  "graph": { "enabled": false }
}
```

### Step 3: Create mock data

Create a JSON array at the path specified in `source.path`:

```json
[
  {
    "sourceName": "Item One",
    "sourceDescription": "Description of item one",
    "sourceIdField": "ID-001",
    "sourceCustomField": "value"
  }
]
```

The field names must match the **right side** of `field_map` (source field names).

### Step 4: Ingest data

```bash
cd apps/conversational-assistant
source .venv/bin/activate
python -m src.db.ingest your-vertical
```

This generates embeddings and inserts entities into the `entities` table.

### Step 5: Add @dxp/ai-assistant to your portal

In your portal's `package.json`:
```json
{ "dependencies": { "@dxp/ai-assistant": "workspace:*" } }
```

Then `pnpm install`.

### Step 6: Wire up the component

In your portal's `App.tsx`:
```tsx
import { AgenticAssistant } from '@dxp/ai-assistant';

// Add nav item
{ label: 'AI Assistant', href: '/your-section/ai-assistant' },

// Add route
case '/your-section/ai-assistant':
  return <AgenticAssistant />;
```

### Step 7: Start the backend

```bash
AGENTIC_CONFIG_ID=your-vertical uvicorn src.main:app --port 8002
```

## Configuration Reference

### Persona Config (`configs/<id>.json`)

| Section | Purpose |
|---------|---------|
| `persona.voice` | How the agent speaks (tone, personality) |
| `persona.tone_rules` | Behavioral rules (e.g., "ask at most 1-2 questions") |
| `clarifying_question_examples` | Domain-specific probing questions by category |
| `project_playbooks` | Step-by-step flows for common scenarios |
| `ui` | Frontend display: title, greeting, suggestions |
| `tools` | Which tools the LLM can use (see Tool System below) |
| `actions` | Domain actions routed to BFF endpoints (see Domain Actions below) |

### Data Config (`configs/data/<id>.json`)

| Section | Purpose |
|---------|---------|
| `entity.name` | Entity type stored in DB (e.g., "product", "insurance_plan") |
| `entity.field_map` | Maps source JSON fields to stored field names |
| `entity.card_layout` | Tells frontend how to render entity cards |
| `entity.action` | Button label and type on entity cards |
| `embeddings.template` | Text template for generating vector embeddings |

### Card Layout Formats

| Format | Renders as | Example |
|--------|-----------|---------|
| `currency` | `$123.45` | Prices, premiums |
| `percent` | `12.5%` | Returns, rates |
| `rating` | `★ 4.5` | Star ratings |
| `number` | `123` | Counts |
| (none) | Raw string | Labels, categories |

## Tool System

### Available Tools

| Registry Key | Tool Name | Description | Typical Use |
|-------------|-----------|-------------|-------------|
| `search` | search_products | Semantic search over entities | All verticals |
| `details` | get_product_details | Get entity by ID | All verticals |
| `explain` | explain_product | Answer questions about entities | All verticals |
| `preferences` | get_user_preferences | Read user preferences | All verticals |
| `learn_preference` | learn_preference | Record user preference signals | All verticals |
| `upload` | analyze_upload | Analyze uploaded files (image/PDF) | All verticals |
| `domain_action` | domain_action | Execute BFF business actions | All verticals |
| `complements` | find_complements | Find related items | Retail |
| `deals` | find_deals | Find coupons/promotions | Retail |
| `cart` | add_to_cart | Add to shopping cart | Retail |
| `cart_contents` | get_cart_contents | View cart contents | Retail |

### Configuring Tools Per Vertical

In your persona config's `tools` array, list the registry keys:

```json
// Retail — all tools
"tools": ["search", "details", "complements", "deals", "explain", "cart", "cart_contents", "preferences", "learn_preference", "upload", "domain_action"]

// Non-retail — no cart/deals/complements
"tools": ["search", "details", "explain", "preferences", "learn_preference", "upload", "domain_action"]
```

Tools NOT in the list are invisible to the LLM — it cannot call them.

### Adding a New Tool

1. **Define the tool** in `src/agents/react_tools.py` (or a new file under `src/agents/tools/`):

```python
from langchain_core.tools import tool
from pydantic import BaseModel, Field

class MyToolInput(BaseModel):
    param1: str = Field(description="What this param is")

@tool("my_tool", args_schema=MyToolInput)
async def my_tool(param1: str) -> dict:
    """Description the LLM reads to decide when to use this tool."""
    # Implementation
    return {"result": "value"}
```

2. **Register** in `TOOL_REGISTRY` at the bottom of `react_tools.py`:
```python
TOOL_REGISTRY["my_tool"] = my_tool
```

3. **Add a presenter** in `src/agents/tool_presenters.py`:
```python
PRESENTERS["my_tool"] = ToolPresenter(
    summarize_input=lambda i: f"Running my_tool with {i.get('param1')}",
    summarize_output=lambda o: f"Result: {o.get('result')}",
)
```

4. **Add to persona configs** that should use it:
```json
"tools": ["search", "details", "my_tool", ...]
```

## Domain Actions

Domain actions let the assistant execute real business operations (file a claim, place an order) by calling BFF endpoints. The `domain_action` tool routes to the right BFF endpoint based on the persona config.

### How It Works

```
LLM decides to file a claim
  → calls domain_action(action_type="file_claim", payload={...})
    → tool reads action routes from persona config
    → HTTP POST to BFF at /api/claims
      → BFF ClaimsPort → FHIRAdapter → external system
    → result returned to LLM
  → LLM tells user "Your claim CLM-2024-042 has been filed"
```

### Configuring Actions

In your persona config:

```json
"actions": {
  "action_type": {
    "bff_endpoint": "/endpoint-path",
    "method": "POST",
    "description": "What this action does (LLM reads this)",
    "required_fields": ["field1", "field2"]
  }
}
```

- `bff_endpoint`: Path relative to BFF_BASE_URL. Supports path params: `/claims/{claim_id}`
- `method`: HTTP method (GET, POST, PUT, DELETE)
- `description`: The LLM uses this to understand when to call the action
- `required_fields`: What the LLM should gather from the user before calling

### Environment Variables

```bash
BFF_BASE_URL=http://localhost:4201/api  # Where the BFF is running
```

## Database Schema

### entities table

```sql
CREATE TABLE entities (
    id              UUID PRIMARY KEY,
    entity_type     VARCHAR(50) NOT NULL,  -- "product", "investment_product", etc.
    external_id     VARCHAR(100) NOT NULL, -- business key (sku, symbol, claim_id)
    name            VARCHAR(255) NOT NULL, -- always present, used for display
    description     TEXT NOT NULL,         -- used for embedding generation
    data            JSONB NOT NULL,        -- ALL domain fields
    image_url       VARCHAR(500),
    embedding       VECTOR(1536),          -- pgvector
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ix_entities_entity_type ON entities (entity_type);
```

All domain-specific fields live in the `data` JSONB column. The `entity.field_map` in the data config controls what goes in.

## Deployment

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-proj-...
AGENTIC_CONFIG_ID=your-vertical        # Which persona config to load
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname

# Optional
LLM_MODEL=gpt-4.1                      # Default: gpt-4.1
EMBEDDING_MODEL=text-embedding-3-small  # Default: text-embedding-3-small
BFF_BASE_URL=http://localhost:4201/api  # For domain_action tool
REDIS_URL=redis://localhost:6379/0      # For session pub/sub (optional)
LANGFUSE_ENABLED=false                  # Observability (optional)
```

### Database Setup

```bash
# Create database
createdb your_database

# Enable pgvector
psql -d your_database -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql -d your_database -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Tables are created automatically on first run via SQLAlchemy
```

### Running

```bash
cd apps/conversational-assistant
source .venv/bin/activate

# Ingest data
python -m src.db.ingest your-vertical

# Start server
AGENTIC_CONFIG_ID=your-vertical uvicorn src.main:app --port 8002
```

## Testing

```bash
cd apps/conversational-assistant
source .venv/bin/activate
python -m pytest tests/ -v
```

Tests cover:
- Tool registry completeness and filtering
- Field mapping and embedding template rendering
- Data config structure validation
- Persona config action definitions
- Tool key validation across all configs

## Examples

### Existing Verticals

| Vertical | Config ID | Entity Type | Tools | Actions |
|----------|----------|-------------|-------|---------|
| Ace Hardware | `ace-hardware` | `product` | 11 (all) | create_order |
| Wealth | `wealth-investment-advisor` | `investment_product` | 7 | place_order, start_sip |
| Insurance | `insurance-claims-advisor` | `insurance_plan` | 7 | file_claim, check_claim_status, get_quote |
