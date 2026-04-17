# Agentic Conversation Assistant — DXP Framework Feature

## Overview

The DXP framework includes a **configurable AI conversation assistant** that can be added to any portal (retail, insurance, wealth, healthcare, etc.) with zero code changes. The assistant uses a ReAct agent pattern (LLM + tools) driven entirely by JSON configuration.

## What You Get

| Component | Location | Purpose |
|-----------|----------|---------|
| `AgenticAssistant` | `src/components/agent/AgenticAssistant.tsx` | Customer-facing chat UI (reusable across portals) |
| `AgentConfigBuilder` | `src/pages/manager/ConfigBuilder.tsx` | Admin UI to generate agent configs via natural language |
| `AgentReadiness` | `src/pages/manager/AgentReadiness.tsx` | Dashboard scoring data quality for agentic AI |
| `PreferencesPanel` | `src/components/agent/PreferencesPanel.tsx` | Shows learned user preferences |
| `useAgentChat` | `src/hooks/useAgentChat.ts` | WebSocket state management hook |
| BFF Module | `apps/bff/src/modules/agentic/` | NestJS adapter for agentic backend |
| Agent Backend | `apps/conversational-assistant/` | FastAPI + LangGraph ReAct agent |

## Add Agentic to Any Portal — 5-Step Recipe

### Step 1: Copy the agent components

Copy these directories from the Ace Hardware portal into your portal:

```
src/components/agent/     → Your portal's src/components/agent/
src/hooks/useAgentChat.ts → Your portal's src/hooks/
src/lib/agent-types.ts    → Your portal's src/lib/
```

### Step 2: Create your persona config

**Option A: Use the Config Builder UI**

1. Add the Config Builder page to your portal's manager view
2. Describe your domain in natural language:

   > "I need an assistant for [your business type] that helps customers
   > [what it does]. The personality should be [tone/voice]. Common
   > scenarios include [list 3-5 use cases]. For each scenario, the
   > agent should ask [clarifying questions] and search for [product/
   > service categories]."

3. Click Generate → Preview → Save

**Option B: Write JSON directly**

Create `configs/your-portal.json` following this structure:

```json
{
  "id": "your-portal-id",
  "name": "Your Portal Assistant",
  "domain_tags": ["your-vertical", "your-sub-vertical"],
  "persona": {
    "domain_summary": "a [description of your business]",
    "voice": "[personality in 5-15 words]",
    "tone_rules": [
      "Rule 1",
      "Rule 2"
    ]
  },
  "clarifying_question_examples": {
    "scenario_name": {
      "trigger_examples": ["keyword1", "keyword2"],
      "questions": ["Question 1?", "Question 2?"]
    }
  },
  "project_playbooks": {
    "description": "For matching project types, search EVERY listed category.",
    "workflow_name": {
      "trigger_keywords": ["keyword1", "keyword2"],
      "categories_to_search": [
        "category 1",
        "category 2"
      ]
    }
  },
  "ui": {
    "title": "Your Assistant Name",
    "subtitle": "What it does in one line",
    "greeting": "Opening message",
    "greeting_subtitle": "Supporting text",
    "suggestions": [
      "Starter prompt 1",
      "Starter prompt 2"
    ]
  }
}
```

### Step 3: Add routes to your portal

In your portal's `App.tsx` (or router):

```tsx
// Import
import { ShoppingAssistant } from './pages/customer/ShoppingAssistant';
import { AgentReadiness } from './pages/manager/AgentReadiness';
import { ConfigBuilder } from './pages/manager/ConfigBuilder';

// Customer nav
{ label: 'AI Assistant', href: '/customer/ai-assistant' }

// Manager nav
{ label: 'Agent Readiness', href: '/manager/agent-readiness' }
{ label: 'Config Builder', href: '/manager/config-builder' }

// Routes
case '/customer/ai-assistant': return <ShoppingAssistant />;
case '/manager/agent-readiness': return <AgentReadiness />;
case '/manager/config-builder': return <ConfigBuilder />;
```

The `ShoppingAssistant` page is a thin wrapper:

```tsx
import { AgenticAssistant } from '../components/agent/AgenticAssistant';
export function ShoppingAssistant() {
  return <AgenticAssistant />;
}
```

### Step 4: Ingest your catalog data

Create a data config at `configs/data/your-portal.json`:

```json
{
  "id": "your-portal",
  "source": {
    "type": "json_file",
    "path": "/path/to/your/products.json"
  },
  "entity": {
    "name": "product",
    "field_map": {
      "sku": "your_sku_field",
      "name": "your_name_field",
      "description": "your_description_field",
      "category": "your_category_field",
      "brand": "your_brand_field",
      "price": "your_price_field"
    }
  },
  "embeddings": {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "dimensions": 1536,
    "template": "{name} by {brand}. Category: {category}. {description}"
  },
  "graph": {
    "enabled": true,
    "graph_name": "agentic_commerce",
    "relationships": { "made_by": true, "belongs_to": true, "similar_to": true }
  }
}
```

Then run:

```bash
cd agenticcommerce/apps/api
python -m src.db.ingest your-portal
python -m src.db.enrich_graph  # optional: adds HAS_FEATURE + FREQUENTLY_BOUGHT_WITH edges
```

### Step 5: Start the backend

```bash
cd agenticcommerce/apps/api
. .venv/bin/activate
AGENTIC_CONFIG_ID=your-portal-id uvicorn src.main:app --port 8002
```

Done. Your portal now has an AI conversation assistant.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Any DXP Portal                                                  │
│                                                                   │
│  Customer View              Manager View                         │
│  ┌───────────────┐          ┌──────────────────────┐            │
│  │ AgenticAssistant│         │ AgentReadiness       │            │
│  │ (chat + cart   │          │ (data quality score) │            │
│  │  + voice +     │          ├──────────────────────┤            │
│  │  uploads)      │          │ ConfigBuilder         │            │
│  └───────┬───────┘          │ (generate configs     │            │
│          │                   │  via natural language) │            │
│          │ WebSocket         └──────────┬───────────┘            │
└──────────┼──────────────────────────────┼────────────────────────┘
           │                              │ REST
┌──────────┴──────────────────────────────┴────────────────────────┐
│  Agent Backend (FastAPI + LangGraph)                              │
│                                                                   │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────────┐    │
│  │ ReAct Agent   │  │ configs/    │  │ Tools (10 total)     │    │
│  │ (generic      │  │ *.json      │  │ search, cart, prefs, │    │
│  │  framework +  │  │ (per-domain │  │ upload, voice,       │    │
│  │  persona)     │  │  persona)   │  │ deals, explain       │    │
│  └──────────────┘  └─────────────┘  └──────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL: pgvector (embeddings) + Apache AGE (graph)   │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

## Domain Scoping

Each config has `domain_tags` (e.g., `["retail", "hardware"]`). Each portal has a `PORTAL_DOMAIN` setting. The framework enforces:

- **Config list API** filters by domain — portal only sees relevant configs
- **Config Builder** constrains LLM generation to the portal's domain
- **Config save** injects portal domain into tags automatically

This prevents deploying an insurance agent inside a hardware store portal.

## Multi-modal Capabilities

| Capability | How |
|-----------|-----|
| Text chat | WebSocket + ReAct agent |
| Voice input | Whisper-1 (OpenAI) via /api/voice/transcribe |
| Voice output | TTS-1 (OpenAI) via /api/voice/synthesize |
| File upload | Images → GPT-4o vision, PDFs → pymupdf4llm |
| Cart | Backend-owned, session-scoped, context-injected |
| Preferences | Learned from conversation, confidence-scored, decaying |
| Knowledge graph | Apache AGE: product relationships, complements, features |

## Sample Config Builder Input

Here's a sample natural-language description to paste into the Config Builder for a hardware store:

> I need a shopping assistant for a retail hardware and DIY store. The assistant
> should feel like a friendly, knowledgeable store employee who's done every
> project and knows the aisles well. Use plain language, no jargon. Be
> encouraging about DIY projects without being patronizing. Always be concrete —
> mention product names, prices, and specs rather than vague promises.
>
> Common scenarios:
> 1. Construction projects (porches, decks, fences, sheds) — ask about dimensions,
>    ground-level or raised, covered or open, what tools they have. Full checklist:
>    lumber, decking, concrete blocks, joist hangers, screws/nails, stain, saw,
>    drill, level, tape measure, safety gear.
> 2. Painting projects — ask what surface, square footage, indoor vs outdoor,
>    current condition. Interior: paint, primer, brushes, rollers, trays, tape,
>    drop cloths, sanding. Exterior: exterior paint, primer, sprayer, extension
>    pole, caulk, pressure washer.
> 3. Plumbing repairs — ask about the issue, what's installed, shut-off access.
>    Checklist: fixture, plumber's tape, supply lines, valves, wrenches, putty.
> 4. Basic electrical — outlets, switches, fixtures. Checklist: replacement parts,
>    wire nuts, electrical tape, voltage tester, wire stripper, screwdrivers.
>
> Starter prompts: "Find me a cordless drill under $200", "I need paint for my
> bathroom", "Best tools for a beginner", "Help me build a porch".

## Files Reference

### Backend (`apps/conversational-assistant/`)
| File | Purpose |
|------|---------|
| `src/agents/framework.py` | Generic ReAct reasoning prompt |
| `src/agents/persona.py` | Loads persona from JSON, renders prompt addendum |
| `src/agents/supervisor.py` | Assembles framework + persona → agent |
| `src/agents/react_tools.py` | 10 tool definitions |
| `src/agents/tool_presenters.py` | Tool → UI event mapping |
| `src/api/routes/chat.py` | WebSocket + session context injection |
| `src/api/routes/config_builder.py` | LLM config generation + save |
| `src/api/routes/uploads.py` | File upload handling |
| `src/api/routes/voice.py` | Whisper + TTS |
| `src/api/routes/readiness.py` | Data quality scoring |
| `src/services/readiness.py` | 5-dimension scoring logic |
| `src/db/ingest.py` | Config-driven catalog ingestion |
| `src/db/enrich_graph.py` | Graph enrichment (HAS_FEATURE, FREQUENTLY_BOUGHT_WITH) |
| `configs/*.json` | Per-deployment persona configs |
| `configs/data/*.json` | Per-deployment data source configs |

### Frontend (portal)
| File | Purpose |
|------|---------|
| `src/components/agent/AgenticAssistant.tsx` | Main reusable chat component |
| `src/components/agent/MessageBubble.tsx` | Chat message rendering |
| `src/components/agent/ProductCard.tsx` | Product cards + grid |
| `src/components/agent/AgentStepCard.tsx` | Agent activity step |
| `src/components/agent/UserSelector.tsx` | Demo user picker |
| `src/components/agent/PreferencesPanel.tsx` | Learned preferences display |
| `src/components/agent/UploadButton.tsx` | File upload + chips |
| `src/components/agent/MicButton.tsx` | Voice recording |
| `src/components/agent/SpeakButton.tsx` | TTS playback |
| `src/hooks/useAgentChat.ts` | WebSocket state hook |
| `src/lib/agent-types.ts` | Shared TypeScript types |
| `src/pages/manager/AgentReadiness.tsx` | Readiness dashboard |
| `src/pages/manager/ConfigBuilder.tsx` | Config generator UI |

### DXP BFF (`apps/bff/`)
| File | Purpose |
|------|---------|
| `src/modules/agentic/ports/agentic.port.ts` | Abstract port |
| `src/modules/agentic/adapters/langgraph.adapter.ts` | FastAPI proxy |
| `src/modules/agentic/adapters/mock.adapter.ts` | Offline dev |
| `src/modules/agentic/agentic.controller.ts` | REST endpoints |
| `src/modules/agentic/agentic.module.ts` | DI wiring |
