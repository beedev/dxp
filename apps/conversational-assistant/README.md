# Conversational AI Assistant

A configurable, multi-modal AI conversation assistant that can be added to any DXP portal. Uses a ReAct agent (LLM + tools) driven entirely by JSON persona configuration — swap one config file to change verticals (retail → insurance → wealth → healthcare).

## Architecture

```
Portal (React)              BFF (NestJS)                Agent Backend (FastAPI)
┌──────────────┐      ┌──────────────────┐      ┌─────────────────────────┐
│AgenticAssistant│────▶│ AgenticModule    │────▶│ ReAct Agent (LangGraph) │
│ (WebSocket)   │      │ LangGraphAdapter │      │ 10 tools, persona JSON  │
│ Upload/Voice  │      │ or MockAdapter   │      │ pgvector + Apache AGE   │
└──────────────┘      └──────────────────┘      └─────────────────────────┘
```

## Quick Start

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.11+ | For the agent backend |
| Node.js | 18+ | For portals and BFF |
| PostgreSQL | 16+ | With `pgvector` and `age` extensions |
| Redis | 7+ | For session pub/sub (optional for dev) |
| OpenAI API key | — | For GPT-4.1, embeddings, Whisper, TTS |

### 1. Database Setup

The assistant uses PostgreSQL with two extensions:
- **pgvector** — vector embeddings for semantic product/content search
- **Apache AGE** — graph database for relationships (complements, preferences, features)

```bash
# Install extensions (macOS with Homebrew)
brew install pgvector
# AGE: follow https://age.apache.org/age-manual/master/intro/setup.html

# Create the database
psql -U <your-user> -d postgres -c "CREATE DATABASE agentic_commerce;"

# Enable extensions
psql -U <your-user> -d agentic_commerce -c "
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE EXTENSION IF NOT EXISTS age;
  LOAD 'age';
  SET search_path = ag_catalog, \"\$user\", public;
  SELECT create_graph('agentic_commerce');
  CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
"
```

### 2. Environment Variables

All config lives in the DXP root `.env` file (`dxp/.env`). Add these:

```env
# --- Conversational AI Assistant ---
AGENTIC_ADAPTER=langgraph
AGENTIC_BACKEND_URL=http://localhost:8002
AGENTIC_CONFIG_ID=ace-hardware              # or insurance-claims, or your custom config

# LLM (OpenAI)
OPENAI_API_KEY=sk-proj-your-key-here
LLM_MODEL=gpt-4.1
EMBEDDING_MODEL=text-embedding-3-small

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=agentic_commerce
POSTGRES_USER=your-user
POSTGRES_PASSWORD=your-password
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/agentic_commerce

# Redis (optional for dev)
REDIS_URL=redis://localhost:6379/0

# Observability (Langfuse — optional)
LANGFUSE_ENABLED=true
LANGFUSE_SECRET_KEY=sk-lf-your-key
LANGFUSE_PUBLIC_KEY=pk-lf-your-key
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

The agent backend reads from both its local `.env` and the DXP root `../../.env`.

### 3. Install & Setup

```bash
cd apps/conversational-assistant

# Option A: Automated setup (creates venv, installs deps, sets up DB, ingests data)
./setup.sh

# Option B: Manual setup
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

### 4. Run

```bash
# Agent backend
source .venv/bin/activate
uvicorn src.main:app --port 8002 --reload

# Or via nx (from DXP root)
pnpm nx run conversational-assistant:dev
```

Health check: http://localhost:8002/health

---

## Data Loading

The assistant needs domain-specific data to search over. Data flows through a **3-step pipeline**:

```
Source Data (JSON/API/CSV)
    ↓
Step 1: Ingest → PostgreSQL + pgvector embeddings
    ↓
Step 2: Enrich → Apache AGE graph (relationships, features)
    ↓
Step 3: Agent uses tools to search/traverse at runtime
```

### How data gets into the vector DB

#### Step 1: Prepare your source data

Export your catalog/content as a JSON array. Each record should have at minimum:
- `name` — product/item name
- `description` — text description (THIS is what gets embedded for semantic search)
- `category` — grouping category
- `price` — numeric value (optional for non-commerce)

Example (`my-products.json`):
```json
[
  {
    "sku": "DW-DRL-20V",
    "name": "DeWalt 20V MAX Cordless Drill",
    "description": "Compact, lightweight drill with 300 unit watts. Includes 2 batteries.",
    "category": "tools",
    "brand": "DeWalt",
    "price": 99.00,
    "specs": { "Voltage": "20V", "Chuck": "1/2 inch" },
    "rating": 4.8
  }
]
```

#### Step 2: Create a data config

Create `configs/data/<your-config-id>.json`:

```json
{
  "id": "my-store",
  "description": "My Store product catalog",
  "source": {
    "type": "json_file",
    "path": "/path/to/my-products.json"
  },
  "entity": {
    "name": "product",
    "field_map": {
      "sku": "sku",
      "name": "name",
      "description": "description",
      "category": "category",
      "brand": "brand",
      "price": "price",
      "msrp": "msrp",
      "attributes": "specs",
      "rating": "rating",
      "review_count": "reviewCount",
      "image_url": "imageUrl"
    }
  },
  "embeddings": {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "dimensions": 1536,
    "template": "{name} by {brand}. Category: {category}. {description} Specs: {attributes}"
  },
  "graph": {
    "enabled": true,
    "graph_name": "agentic_commerce",
    "relationships": {
      "made_by": true,
      "belongs_to": true,
      "similar_to": true
    }
  }
}
```

The **`field_map`** maps YOUR source fields to the internal schema. If your JSON uses `product_name` instead of `name`, set `"name": "product_name"`.

The **`embeddings.template`** controls what text gets vectorized. The more descriptive, the better the semantic search. Include name, brand, category, description, and key specs.

#### Step 3: Run ingestion

```bash
source .venv/bin/activate

# Ingest (generates embeddings + writes to pgvector + builds base graph)
python -m src.db.ingest my-store

# Enrich graph (LLM-inferred HAS_FEATURE edges + cross-category FREQUENTLY_BOUGHT_WITH)
python -m src.db.enrich_graph

# Or via nx
pnpm nx run conversational-assistant:ingest -- --config=my-store
pnpm nx run conversational-assistant:enrich
```

#### What happens during ingestion

1. **Reads** your JSON source file
2. **Maps** each record to the internal Product schema via `field_map`
3. **Generates OpenAI embeddings** for each product using the `template` (batched, ~$0.01 per 1000 products)
4. **Writes to PostgreSQL** — `products` table with a `vector(1536)` column for embeddings
5. **Builds the AGE graph** — creates `:Product`, `:Brand`, `:Category` nodes and `:MADE_BY`, `:BELONGS_TO`, `:SIMILAR_TO` edges

#### What happens during enrichment

1. **HAS_FEATURE edges** — LLM analyzes each product's description/specs and assigns feature tags (e.g., "cordless", "waterproof", "low-voc") as graph edges
2. **FREQUENTLY_BOUGHT_WITH edges** — Cross-category relationships (e.g., tools ↔ hardware, paint ↔ tools) based on heuristic pairing of top-rated products. In production, this would use real order co-occurrence data.
3. **Cost**: ~$0.05 per 50 products for LLM feature inference

#### Readiness check

After ingestion + enrichment, check your data quality:

```bash
curl http://localhost:8002/api/readiness | python3 -m json.tool
```

Target: overall score ≥ 90. The 5 dimensions:
- **data_completeness** — % of products with descriptions + ratings
- **embedding_coverage** — % of products with vector embeddings
- **graph_connectivity** — avg edges per product (target: 5-8+)
- **preference_data** — % of users with preference signals
- **data_freshness** — hours since last sync

### Data for different verticals

| Vertical | Source data | What to embed | Key graph relationships |
|----------|-----------|--------------|------------------------|
| **Retail** (Ace Hardware) | Product catalog JSON | `name + brand + category + description + specs` | MADE_BY, BELONGS_TO, SIMILAR_TO, HAS_FEATURE, COMPLEMENTS_TO |
| **Insurance** | Claim types, policy benefits, coverage docs | `claim_type + requirements + coverage_description` | COVERS, REQUIRES_DOCUMENT, PRIOR_AUTH_NEEDED |
| **Wealth** | Funds, stocks, instruments | `fund_name + sector + description + risk_profile` | BELONGS_TO_SECTOR, CORRELATED_WITH, SUITABLE_FOR_RISK |
| **Healthcare** | Procedures, medications, providers | `procedure_name + description + cpt_code` | TREATS, REQUIRES_PRIOR_AUTH, COVERED_BY |

For non-retail verticals, the same pipeline works — just change the `field_map` and `template` in your data config.

---

## Persona Configuration

Each deployment has a JSON persona config at `configs/<id>.json`. This controls:
- Agent personality and voice
- Clarifying questions per scenario type
- Project playbooks (deterministic search checklists)
- UI copy (title, greeting, suggestions)
- Domain tags (for portal scoping)

### Create a new persona

**Option A: Config Builder UI** (recommended)
1. Open the portal → Manager → Config Builder
2. Describe your domain in plain English
3. Click Generate → Preview → Save

**Option B: Write JSON manually** (see `configs/ace-hardware.json` as template)

**Option C: API call**
```bash
curl -X POST http://localhost:8002/api/agent-configs/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "I need an assistant for a garden center...",
    "portal_domain": "retail"
  }'
```

### Switch personas

```bash
# Via env var
AGENTIC_CONFIG_ID=insurance-claims uvicorn src.main:app --port 8002

# Or in DXP root .env
AGENTIC_CONFIG_ID=insurance-claims
```

---

## Capabilities

| Feature | How it works |
|---------|-------------|
| Text chat | WebSocket streaming via ReAct agent |
| Voice input | Whisper-1 transcription (`POST /api/voice/transcribe`) |
| Voice output | TTS-1 synthesis (`POST /api/voice/synthesize`) |
| File upload | Images → GPT-4o-mini vision; PDFs → pymupdf4llm Markdown extraction |
| Product search | pgvector semantic search (cosine similarity on embeddings) |
| Knowledge graph | Apache AGE: complements, features, brand preferences, frequently-bought-with |
| Cart management | Backend-owned session state, context-injected per turn |
| Preferences | Learned from conversation (explicit + implicit signals), confidence-scored |
| Project planning | Deterministic playbook checklists per project type |
| Readiness scoring | 5-dimension data quality assessment with remediation recommendations |
| Multi-vertical | JSON config swap — same codebase, different domain |
| Domain scoping | Portal domain tags prevent cross-vertical config deployment |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/agent-config` | GET | Active deployment UI config |
| `/api/agent-configs` | GET | List all configs (filterable by `?domain=`) |
| `/api/agent-configs/generate` | POST | LLM-generate a new config |
| `/api/agent-configs/save` | POST | Save config to disk |
| `/api/readiness` | GET | Agent readiness score |
| `/api/products` | GET | List products |
| `/api/users` | GET | List demo users |
| `/api/users/:id/preferences` | GET | User preferences |
| `/api/uploads` | POST | Upload file (image/PDF) |
| `/api/voice/transcribe` | POST | Whisper STT |
| `/api/voice/synthesize` | POST | OpenAI TTS |
| `/ws/chat/:sessionId` | WS | Real-time agent chat |

## Tools (10)

| Tool | Purpose |
|------|---------|
| `search_products` | Semantic search via pgvector |
| `get_product_details` | Full product details + reviews |
| `find_complements` | Graph traversal for complementary products |
| `find_deals` | Coupons + loyalty balance |
| `explain_product` | Product Q&A context |
| `add_to_cart` | Add item to session cart |
| `get_cart_contents` | Read current cart |
| `get_user_preferences` | Read learned preferences |
| `learn_preference` | Store new preference signal |
| `analyze_upload` | Vision (images) / text extraction (PDFs) |

## Project Structure

```
apps/conversational-assistant/
├── setup.sh                    # One-command setup
├── project.json                # nx config
├── pyproject.toml              # Python deps
├── .env / .env.example
├── configs/
│   ├── ace-hardware.json       # Retail persona + playbooks
│   ├── insurance-claims.json   # Insurance persona + playbooks
│   └── data/
│       └── ace-hardware.json   # Data source + field mapping + embedding config
└── src/
    ├── main.py                 # FastAPI entry point
    ├── config.py               # Settings (reads from .env + DXP root .env)
    ├── observability.py        # Langfuse integration
    ├── agents/
    │   ├── framework.py        # Generic ReAct reasoning prompt (domain-agnostic)
    │   ├── persona.py          # Loads persona JSON → prompt addendum
    │   ├── supervisor.py       # Assembles framework + persona → agent
    │   ├── react_tools.py      # 10 tool definitions + session state
    │   ├── tool_presenters.py  # Tool → UI event mapping
    │   └── tools/
    │       ├── search.py       # pgvector semantic search
    │       ├── products.py     # Product detail lookups
    │       ├── pricing.py      # Coupons + loyalty
    │       ├── preferences.py  # Read/write user preferences
    │       ├── cart.py         # Order creation
    │       └── graph.py        # AGE graph queries
    ├── api/routes/
    │   ├── chat.py             # WebSocket + session context injection
    │   ├── config_builder.py   # LLM config generation
    │   ├── uploads.py          # File upload handling
    │   ├── voice.py            # Whisper + TTS
    │   ├── readiness.py        # Data quality scoring
    │   ├── products.py         # Product CRUD
    │   ├── users.py            # User + preferences
    │   ├── sessions.py         # Session management
    │   ├── orders.py           # Order history
    │   └── analytics.py        # Agent performance metrics
    ├── db/
    │   ├── models.py           # SQLAlchemy models
    │   ├── session.py          # Async session factory
    │   ├── graph.py            # AGE Cypher query helpers
    │   ├── ingest.py           # Config-driven catalog ingestion
    │   ├── ingest_ace.py       # Ace Hardware specific ingestion
    │   ├── enrich_graph.py     # LLM-inferred graph edges
    │   └── seed.py             # Legacy seed script
    └── services/
        └── readiness.py        # 5-dimension quality scoring
```
