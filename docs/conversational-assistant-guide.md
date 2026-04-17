# Conversational Assistant — Integration Guide

## Overview

The conversational assistant adds an AI-powered chat interface to any DXP portal. It uses a ReAct agent (LangGraph + OpenAI) with configurable persona, tools, and domain actions. Adding a new vertical requires **zero Python code changes** — just JSON configuration files and data.

## Architecture

```
Portal (React + Vite)
  └─ <AgenticAssistant /> component from @dxp/ai-assistant
       ├─ REST → BFF (NestJS) → AgenticPort → LangGraphAdapter → FastAPI
       │         /api/agentic/users, /sessions, /config, /readiness
       │
       └─ WebSocket → FastAPI backend directly (port 8002)
            │         ws://host:8002/ws/chat/{sessionId}
            │
            ├─ LangGraph ReAct Agent
            │   ├─ System prompt = generic framework + persona config
            │   ├─ Tools = filtered per persona's "tools" array
            │   └─ domain_action tool → BFF HTTP → domain modules
            │
            ├─ pgvector semantic search (entities table)
            └─ Persona JSON (voice, playbooks, tools, actions, UI config)
```

**Why WebSocket is direct**: REST calls route through the BFF (auth, single gateway). WebSocket stays direct to FastAPI because NestJS WS proxying adds complexity without value for single-domain deployments. In production, Kong gateway handles WS routing + auth at the infrastructure layer.

**API base is configurable**: The frontend defaults to `http://localhost:8002` but portals can override via `window.__DXP_AGENTIC_API_BASE__` to point at the BFF or any other gateway.

## Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Agent framework | LangGraph + LangChain | ReAct tool-calling loop |
| LLM | OpenAI GPT-4.1 | Reasoning + generation |
| Embeddings | text-embedding-3-small | 1536-dim vectors for semantic search |
| Vector DB | PostgreSQL + pgvector | Entity storage + similarity search |
| Backend | FastAPI + uvicorn | Agent API + WebSocket |
| BFF | NestJS | REST proxy, domain action routing |
| Frontend | React (@dxp/ai-assistant) | Chat UI, entity cards |

## Quick Start — Add AI to a New Portal

### Step 1: Set up the backend (one-time)

```bash
cd apps/conversational-assistant
./setup.sh    # Creates venv, installs deps, sets up database
```

Requires: Python 3.11+, PostgreSQL with pgvector extension, OpenAI API key in `.env`.

### Step 2: Create a persona config

The persona defines **who** the assistant is — its voice, behavior, tools, and actions.

```bash
cd apps/conversational-assistant
cp configs/ace-hardware.json configs/your-vertical.json
```

Edit with your domain:

```json
{
  "id": "your-vertical",
  "name": "Your Assistant Name",
  "domain_tags": ["your", "domain", "tags"],

  "persona": {
    "domain_summary": "a [your domain] platform",
    "voice": "how the assistant speaks — tone, personality, style",
    "tone_rules": [
      "Ask at most 1-2 clarifying questions, then act",
      "Be specific: names, numbers, concrete next steps",
      "If the user seems impatient, give a recommendation immediately"
    ]
  },

  "clarifying_question_examples": {
    "scenario_name": {
      "trigger_examples": ["keywords", "that", "trigger", "this"],
      "questions": [
        "Question the agent asks to understand the request"
      ]
    }
  },

  "project_playbooks": {
    "description": "Step-by-step flows for common scenarios",
    "workflow_name": {
      "trigger_keywords": ["keywords", "that", "activate"],
      "steps": [
        "Step 1: Gather required information",
        "Step 2: Search for matching items",
        "Step 3: Present options",
        "Step 4: Execute the user's choice"
      ]
    }
  },

  "ui": {
    "title": "Your Assistant",
    "subtitle": "One-line description of capabilities",
    "greeting": "How can I help you today?",
    "greeting_subtitle": "Brief list of what I can do",
    "suggestions": [
      "A realistic example prompt your users would type",
      "Another example that shows a different capability",
      "A third example covering another use case"
    ]
  },

  "tools": [
    "search", "details", "explain",
    "preferences", "learn_preference",
    "upload", "domain_action"
  ],

  "actions": {
    "your_action": {
      "bff_endpoint": "/your-endpoint",
      "method": "POST",
      "description": "What this action does — the LLM reads this",
      "required_fields": ["field1", "field2"]
    }
  }
}
```

**Key decisions**:
- `tools`: which tools the LLM can use. Non-retail verticals should exclude `cart`, `cart_contents`, `deals`, `complements`.
- `actions`: maps to BFF endpoints. The LLM calls `domain_action(action_type="your_action", payload={...})` which hits the BFF.
- `tone_rules`: control how many questions the agent asks before acting. "Ask at most 1-2 questions" prevents interrogation.

### Step 3: Create a data config

The data config defines **what** the assistant knows about — entity schema, how to display it, and how to generate embeddings.

```bash
cp configs/data/ace-hardware.json configs/data/your-vertical.json
```

```json
{
  "id": "your-vertical",
  "description": "Human-readable description of this data set",
  "source": {
    "type": "json_file",
    "path": "/tmp/your_data.json"
  },
  "entity": {
    "name": "your_entity_type",
    "display_name": "Your Entity",
    "display_name_plural": "Your Entities",
    "primary_key_field": "id_field",
    "group_field": "category_like_field",
    "group_label_field": "brand_like_field",
    "field_map": {
      "id_field": "sourceIdField",
      "name": "sourceName",
      "description": "sourceDescription",
      "your_field": "sourceYourField"
    },
    "card_layout": {
      "headline": "name",
      "subtitle": "brand_like_field",
      "primary_metric": {
        "field": "price_like_field",
        "format": "currency",
        "label": "Display Label"
      },
      "secondary_metrics": [
        { "field": "metric_field", "format": "percent", "label": "Label" },
        { "field": "another_field", "label": "Label" }
      ],
      "badge": "category_like_field"
    },
    "action": { "label": "Button Text", "type": "action_type" }
  },
  "embeddings": {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "dimensions": 1536,
    "template": "{name} ({id_field}). Category: {category_like_field}. {description}"
  },
  "graph": { "enabled": false }
}
```

**How field_map works**: Left side = stored field name (used in card_layout, embedding template). Right side = source JSON field name. Example: `"monthly_premium": "monthlyPremium"` means source data has `monthlyPremium`, stored as `monthly_premium`.

**How card_layout works**: The frontend `EntityCard` reads these fields from the entity's `data` JSONB to render cards. The format controls display: `currency` → `$123.45`, `percent` → `12.5%`, `rating` → `★ 4.5`.

**How embeddings.template works**: Uses Python format strings with ALL mapped field names. Missing fields render as empty strings. The template should capture the most searchable aspects of your entity.

### Step 4: Prepare source data

Create a JSON array at the path in `source.path`. Field names must match the **right side** of `field_map`:

```json
[
  {
    "sourceName": "Item One",
    "sourceDescription": "Description that will be embedded for semantic search",
    "sourceIdField": "ID-001",
    "sourceYourField": "value"
  }
]
```

### Step 5: Ingest data

```bash
cd apps/conversational-assistant
source .venv/bin/activate
python -m src.db.ingest your-vertical
```

Output:
```
Config-driven Ingestion: your-vertical
Loaded 25 records from source
Generating 25 embeddings (model=text-embedding-3-small)...
  Embedded 1-25/25
Inserting 25 Your Entity entities...
  Inserted 25 entities
Ingestion complete: 25 Your Entity entities
```

### Step 6: Add the chatbot to your portal

**a. Add dependency** in your portal's `package.json`:
```json
{
  "dependencies": {
    "@dxp/ai-assistant": "workspace:*"
  }
}
```

Then `pnpm install`.

**b. Import and route** in `App.tsx`:
```tsx
import { AgenticAssistant } from '@dxp/ai-assistant';

// Add to navigation
{ label: 'AI Assistant', href: '/your-section/ai-assistant' },

// Add to route switch
case '/your-section/ai-assistant':
  return <AgenticAssistant />;
```

**c. (Optional) Add manager pages** for ops visibility:
```tsx
import { AgentReadiness, DataPipeline } from '@dxp/ai-assistant';

case '/manager/agent-readiness':
  return <AgentReadiness />;
case '/manager/data-pipeline':
  return <DataPipeline />;
```

### Step 7: Start and test

```bash
# Start the backend with your persona
AGENTIC_CONFIG_ID=your-vertical uvicorn src.main:app --port 8002

# Start your portal (in another terminal)
nx dev your-portal
```

Navigate to the AI Assistant page. You should see your persona's title, greeting, and suggestion prompts.

## Walkthrough: Insurance Claims Advisor

A concrete example of the full integration for an insurance vertical.

### Persona config (`configs/insurance-claims-advisor.json`)

- **Voice**: "empathetic, clear, and efficient — like a trusted insurance advisor"
- **Tone rule**: "Ask at most 1-2 clarifying questions, then act"
- **Tools**: search, details, explain, preferences, learn_preference, upload, domain_action (7 tools — no cart/deals)
- **Actions**: file_claim → `POST /claims`, check_claim_status → `GET /claims/{claim_id}`, get_quote → `POST /quotes`
- **UI suggestions**: "I had a car accident and need to file a claim", "What's the status of my claim?"

### Data config (`configs/data/insurance-claims-advisor.json`)

- **Entity**: `insurance_plan` with fields: plan_id, name, provider, coverage_type, monthly_premium, deductible, coverage_limit, network, key_benefits
- **Card layout**: headline=name, subtitle=provider, primary_metric=monthly_premium (currency), badge=coverage_type
- **Action button**: "Get Quote"
- **Embedding template**: `"{name} by {provider}. {coverage_type} insurance. {description}. Benefits: {key_benefits}"`

### What the LLM sees

When a user asks "I had a car accident and need to file a claim":
1. Agent has 7 tools (no cart/deals/complements — those are invisible)
2. Tool descriptions say "insurance plans" not "items"
3. Agent follows the `file_claim` playbook: gather claim type + date → verify policy → call `domain_action("file_claim", {policy_id, claim_type, incident_date, description})` → BFF `/api/claims` endpoint processes it
4. Frontend renders the result in the chat with an EntityCard showing the plan's monthly premium, deductible, and coverage type

### What the user sees

```
┌─────────────────────────────────────────┐
│ 🏥 Claims Advisor                       │
│ AI-powered assistant for claims,        │
│ coverage, and policy questions           │
│                                          │
│ How can I help with your insurance?     │
│                                          │
│ ┌─────────────────┐ ┌────────────────┐ │
│ │ I had a car     │ │ What's the     │ │
│ │ accident...     │ │ status of...   │ │
│ └─────────────────┘ └────────────────┘ │
│ ┌─────────────────┐ ┌────────────────┐ │
│ │ Does my home    │ │ I need a quote │ │
│ │ policy cover... │ │ for health...  │ │
│ └─────────────────┘ └────────────────┘ │
└─────────────────────────────────────────┘
```

## Configuration Reference

### Persona Config (`configs/<id>.json`)

| Section | Purpose | Required |
|---------|---------|----------|
| `id` | Unique config identifier | Yes |
| `name` | Display name of the assistant | Yes |
| `persona.voice` | How the agent speaks (tone, personality) | Yes |
| `persona.tone_rules` | Behavioral rules for the LLM | Yes |
| `clarifying_question_examples` | Domain-specific probing questions | Recommended |
| `project_playbooks` | Step-by-step flows for common scenarios | Recommended |
| `ui.title` | Chat header title | Yes |
| `ui.greeting` | First message shown to user | Yes |
| `ui.suggestions` | Clickable prompt suggestions (3-5) | Yes |
| `tools` | Which tools the LLM can use (registry keys) | Yes |
| `actions` | Domain actions routed to BFF endpoints | Optional |

### Data Config (`configs/data/<id>.json`)

| Section | Purpose | Required |
|---------|---------|----------|
| `entity.name` | Entity type in DB | Yes |
| `entity.display_name` | Human-readable name (injected into tool descriptions) | Yes |
| `entity.field_map` | Source → stored field mapping | Yes |
| `entity.card_layout` | Frontend rendering instructions | Yes |
| `entity.action` | Card button label and type | Yes |
| `embeddings.template` | Text template for vector generation | Yes |

### Card Layout Formats

| Format | Renders as | Example |
|--------|-----------|---------|
| `currency` | `$123.45` | Prices, premiums, investments |
| `percent` | `12.5%` | Returns, rates, scores |
| `rating` | `★ 4.5` | Star ratings |
| `number` | `123` | Counts, quantities |
| (none) | Raw string | Labels, categories, status |

## Tool System

### Available Tools

| Registry Key | What It Does | Typical Use |
|-------------|-------------|-------------|
| `search` | Semantic search over entities via pgvector | All verticals |
| `details` | Get a single entity by ID | All verticals |
| `explain` | Answer questions about entities using LLM + context | All verticals |
| `preferences` | Read stored user preferences | All verticals |
| `learn_preference` | Record user preference signals (explicit or implicit) | All verticals |
| `upload` | Analyze uploaded files (images via vision, PDFs via extraction) | All verticals |
| `domain_action` | Execute business actions via BFF HTTP endpoints | All verticals |
| `complements` | Find related/complementary items | Retail only |
| `deals` | Find applicable coupons/promotions | Retail only |
| `cart` | Add item to shopping cart | Retail only |
| `cart_contents` | View current cart contents | Retail only |

### Choosing Tools Per Vertical

```json
// Retail (e-commerce) — all tools
"tools": ["search", "details", "complements", "deals", "explain",
          "cart", "cart_contents", "preferences", "learn_preference",
          "upload", "domain_action"]

// Advisory (wealth, insurance, healthcare) — no cart/deals
"tools": ["search", "details", "explain", "preferences",
          "learn_preference", "upload", "domain_action"]
```

**Rule of thumb**: If your vertical has a "shopping cart" concept, include cart/deals/complements. If it's advisory (recommend → execute action), exclude them.

### Adding a New Custom Tool

4 files to touch:

**1. Define** in `src/agents/tools/your_tool.py` or directly in `react_tools.py`:
```python
from langchain_core.tools import tool
from pydantic import BaseModel, Field

class YourToolInput(BaseModel):
    param1: str = Field(description="What this parameter is for")

@tool("your_tool", args_schema=YourToolInput)
async def your_tool(param1: str) -> dict:
    """Description the LLM reads to decide when to use this tool.
    Be specific about WHEN to use it and WHAT it returns."""
    result = await your_implementation(param1)
    return {"result": result}
```

**2. Register** in `TOOL_REGISTRY` (bottom of `react_tools.py`):
```python
TOOL_REGISTRY["your_tool"] = your_tool
```

**3. Present** in `tool_presenters.py`:
```python
PRESENTERS["your_tool"] = ToolPresenter(
    summarize_input=lambda i: f"Looking up {i.get('param1')}",
    summarize_output=lambda o: f"Found: {o.get('result')}",
)
```

**4. Enable** in persona configs that need it:
```json
"tools": ["search", "details", "your_tool", "domain_action"]
```

## Domain Actions

Domain actions bridge the assistant to real business operations via BFF endpoints. Instead of creating N Python tools (file_claim, place_order, start_sip), one `domain_action` tool routes to the right BFF endpoint based on the persona config.

### Flow

```
User: "I want to file a claim for my car accident"
  ↓
LLM reasons: needs to call domain_action with action_type="file_claim"
  ↓
LLM gathers required_fields from user (policy_id, claim_type, incident_date)
  ↓
Tool call: domain_action("file_claim", {policy_id: "POL-001", ...})
  ↓
HTTP POST to BFF at BFF_BASE_URL + /claims
  ↓
BFF ClaimsPort → Adapter → External system
  ↓
Result returned to LLM → "Your claim CLM-2024-042 has been filed"
```

### Configuring Actions

Each action in the persona config maps to a BFF endpoint:

```json
"actions": {
  "file_claim": {
    "bff_endpoint": "/claims",
    "method": "POST",
    "description": "File a new insurance claim",
    "required_fields": ["policy_id", "claim_type", "incident_date", "description"]
  }
}
```

- **bff_endpoint**: Path appended to `BFF_BASE_URL`. Supports path params: `/claims/{claim_id}`
- **method**: GET, POST, PUT, or DELETE
- **description**: The LLM reads this to decide when to call the action
- **required_fields**: The LLM gathers these from the user before calling

### Adding a New Action

1. Add the action definition to your persona config's `actions` section
2. Ensure the BFF has a matching endpoint (via the domain module's port+adapter)
3. Restart the backend

No Python changes. The `domain_action` tool reads the routes from config at startup.

## Database

### Entity Table

```sql
CREATE TABLE entities (
    id              UUID PRIMARY KEY,
    entity_type     VARCHAR(50) NOT NULL,   -- "product", "investment_product", etc.
    external_id     VARCHAR(100) NOT NULL,  -- business key (sku, symbol, plan_id)
    name            VARCHAR(255) NOT NULL,  -- always present, used for display
    description     TEXT NOT NULL,          -- used for embedding generation
    data            JSONB NOT NULL,         -- ALL domain-specific fields
    image_url       VARCHAR(500),
    embedding       VECTOR(1536),           -- pgvector cosine similarity
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

All domain fields live in `data` JSONB. Only `name` and `description` are real columns (needed for every query). The `entity.field_map` in data config controls what goes into `data`.

### Querying

Semantic search uses pgvector's cosine distance operator:
```sql
SELECT *, 1 - (embedding <=> query_vector) AS relevance
FROM entities
WHERE entity_type = 'insurance_plan'
ORDER BY relevance DESC
LIMIT 10;
```

JSONB fields are queryable:
```sql
SELECT * FROM entities
WHERE data->>'coverage_type' = 'health'
  AND (data->>'monthly_premium')::numeric <= 300;
```

## Deployment

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-proj-...                              # OpenAI API key
AGENTIC_CONFIG_ID=your-vertical                          # Persona config to load
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db # PostgreSQL with pgvector

# Optional
LLM_MODEL=gpt-4.1                                       # Default: gpt-4.1
EMBEDDING_MODEL=text-embedding-3-small                   # Default: text-embedding-3-small
BFF_BASE_URL=http://localhost:4201/api                   # For domain_action tool
REDIS_URL=redis://localhost:6379/0                       # Session pub/sub (optional)
LANGFUSE_ENABLED=false                                   # Observability (optional)
```

### Database Setup

```bash
createdb your_database
psql -d your_database -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql -d your_database -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
# Tables created automatically by SQLAlchemy on first run
```

### Running

```bash
cd apps/conversational-assistant
source .venv/bin/activate
python -m src.db.ingest your-vertical                    # Ingest data
AGENTIC_CONFIG_ID=your-vertical uvicorn src.main:app --port 8002  # Start
```

### Frontend Override (optional)

To route REST through BFF instead of direct FastAPI, set in your portal before the app loads:
```typescript
(window as any).__DXP_AGENTIC_API_BASE__ = '/api/agentic';
```

## Testing

```bash
cd apps/conversational-assistant
source .venv/bin/activate
python -m pytest tests/ -v
```

44 tests covering:
- Tool registry completeness and config-driven filtering
- Embedding template rendering with missing/null fields
- Data config structure validation for all verticals
- Persona config action definitions and tool key validation
- Entity name resolution and description customization

## Known Limitations

1. **WebSocket is direct to FastAPI** — REST routes through BFF, but WebSocket connects directly. In production, use Kong or an API gateway for WS routing + auth.

2. **Config Builder and Data Pipeline are separate flows** — creating a new vertical requires both a persona config (Step 2) and a data config (Step 3) as separate files. There is no unified "vertical setup wizard" yet.

3. **Tool function names are retail-originated** — internal Python names like `search_products` and `get_product_details` remain from the original retail implementation. The LLM reads the **description** (which IS domain-aware), not the function name. Renaming would break downstream references with no behavioral benefit.

4. **One persona per backend process** — `AGENTIC_CONFIG_ID` is set at startup. Changing the persona requires a process restart. This is by design for single-domain deployments.

## Existing Verticals

| Vertical | Config ID | Entity | Tools | Actions |
|----------|----------|--------|-------|---------|
| Ace Hardware | `ace-hardware` | product (50) | 11 (all) | create_order |
| Wealth | `wealth-investment-advisor` | investment_product (25) | 7 | place_order, start_sip |
| Insurance | `insurance-claims-advisor` | insurance_plan (15) | 7 | file_claim, check_claim_status, get_quote |
