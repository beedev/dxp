# DXP — Delivery Accelerator

## What is this?
A lean framework for building enterprise portals fast. Not a platform engineering showcase — a delivery accelerator. Three pieces of real IP:

1. **BFF Adapter Library** — pre-built NestJS adapters (port+adapter pattern) for common enterprise integrations
2. **Component Library** — battle-tested React + Tailwind components for enterprise portal patterns
3. **SDK React** — hooks for consuming BFF from React apps

## Stack
- **BFF**: NestJS with adapter pattern (port → swappable adapters via env var)
- **Auth**: Keycloak (OIDC/SAML, RBAC via realm roles)
- **Gateway**: Kong (DB-less, declarative)
- **Database**: PostgreSQL (client provides or we provision)
- **Cache**: Redis
- **Frontend**: React + Tailwind + @dxp/ui component library
- **Monorepo**: Nx + pnpm

## Philosophy
- Every component carried = component delivery team must learn, debug, defend in security review
- If client has it, integrate with theirs (analytics, notifications, search) — don't run your own
- Adapters are the IP. Runtimes are the client's problem.
- `optional/` has bring-if-needed components (Go services, Kafka, Temporal)

## Directory Layout
- `apps/bff/` — NestJS BFF with adapter modules
- `packages/contracts/` — shared TypeScript types
- `packages/ui/` — enterprise component library (@dxp/ui)
- `packages/sdk-react/` — React hooks (@dxp/sdk-react)
- `starters/insurance-portal/` — sample portal (Insurance Customer Service)
- `optional/` — bring-if-needed (Go template, Kafka, audit service)
- `infra/` — Keycloak realm, Kong config

## BFF Adapter Pattern
- Port = abstract class in `ports/` (the contract)
- Adapter = injectable class in `adapters/` (the implementation)
- Module factory selects adapter from env: `CMS_ADAPTER=strapi`, `STORAGE_PROVIDER=s3`
- Swapping = one env var change, zero code changes

## Portal Coding Standards — MANDATORY

These rules are enforced by `make audit`. Violations block merge.

### UI Components — always use @dxp/ui

Never hand-roll what the component library already provides. Every portal page MUST source UI from `@dxp/ui`.

| Need | Use | Never use |
|------|-----|-----------|
| Data table / list | `<DataTable columns={} data={}>` | `<table>`, `<tr>`, `<td>` |
| Text input | `<Input value onChange />` | `<input type="text">` |
| Dropdown | `<Select options value onChange />` | `<select>` |
| Button | `<Button variant size>` | `<button className="...">` |
| Status label | `<StatusBadge status="pending\|approved\|..." />` | colored `<span>` |
| Generic label | `<Badge variant="success\|warning\|danger\|info">` | colored `<span>` |
| Tab navigation | `<Tabs tabs active onChange variant="pill\|underline">` | `<button>` tab loops |
| Filter bar | `<FilterBar filters activeFilters onToggle onClear>` | button group arrays |
| Chart | `<Chart type="bar\|line" data xKey yKeys>` | raw SVG / canvas |
| Step flow | `<ProgressTracker steps>` | custom step divs |
| Multi-step form | `<MultiStepForm steps>` | hand-rolled step state |

**Allowed exceptions** (raw HTML is intentional):
- Visual toggle chips (Buy/Sell, order type selectors) — tight custom styling required
- `<input type="checkbox|radio|file|range">` — no @dxp/ui equivalent
- `<textarea>` — multi-line, no @dxp/ui equivalent
- Custom domain components (`PriceChart`, `LiveTicker`, `FxWidget`) — domain-specific visualizations built on top of `Card`

### BFF Integration — always use @dxp/sdk-react

Never call the BFF directly. All data fetching goes through SDK hooks.

```ts
// ✅ correct
import { useClaims, useClaimDetail } from '@dxp/sdk-react';
const { data, isLoading } = useClaims(filters);

// ❌ forbidden
const res = await fetch('/api/v1/claims');
const res = await axios.get('http://localhost:4201/api/v1/claims');
```

### Third-party UI libraries — forbidden in portals

Do NOT install or import: `antd`, `@mui/*`, `@chakra-ui/*`, `react-bootstrap`, `@headlessui/*`, `primereact`, `@mantine/*`, `react-icons`.

If a component doesn't exist in `@dxp/ui`, add it to the library — don't import an external one.

### BFF Adapter Pattern — mandatory for new integrations

Every new data source MUST follow the port+adapter pattern:
1. Define a Port (abstract class in `modules/<name>/ports/<name>.port.ts`)
2. Implement at least one Adapter (in `modules/<name>/adapters/`)
3. Module factory selects adapter via env var (`NAME_ADAPTER=impl`)
4. Register in `app.module.ts`

Never connect to an external system directly from a controller.

### Enforcement

```bash
make audit                       # audit all portals
make audit-portal PORTAL=wealth-portal  # audit one portal
node scripts/audit-portals.js --fix-report  # write violations.json
```

Exit codes: `0` = clean, `1` = errors (must fix), `2` = warnings only.

## Dev Tools — standalone dev servers

Each tool runs on its own port. The insurance portal at `:4200` 302-redirects
the legacy bookmark URLs out so existing links keep working:

| Bookmark | Tool | Run |
|----------|------|-----|
| `:4200/playground/` → `:4600` | API Playground | `pnpm --filter @dxp/playground dev` |
| `:4200/storybook/`  → `:4700` | UI Storybook   | `pnpm --filter @dxp/ui storybook` |
| `:4200/docs/`       → `:4800` | Docs           | `npx serve docs -p 4800` |

Edits to `apps/playground/src/data/modules.ts` (or anything under `src/`)
propagate instantly via HMR — no rebuild step. The redirects are wired in
`starters/insurance-portal/vite.config.ts` (`redirectDevToolPaths` plugin).

## Commands
- `make up` — start 4 infra services
- `make dev` — start BFF in dev mode
- `make down` — stop everything
- `make status` — health check
- `make audit` — check all portals for compliance violations
