# ACE Hardware Portal — Build Plan

## Context

ACE Hardware is a hardware retail cooperative with 5,000+ independently owned stores. This is a **real pitch** portal demonstrating DXP's ability to accelerate retail portal delivery. Three personas (Customer, Store Manager, Cooperative Ops), ~24 pages, 4 new BFF modules, following all existing DXP patterns exactly.

**~65 file touches. 6 phases. Each phase produces something runnable.**

---

## Portal Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  ACE Hardware Portal                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  CUSTOMER    │  │ STORE MANAGER│  │ COOP OPS     │      │
│  │  9 pages     │  │  8 pages     │  │  6 pages     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────┬───────┴──────────┬──────┘               │
│                    │                  │                       │
│              PersonaSwitcher    StoreContext                  │
│                    │                  │                       │
│         ┌──────────┴──────────────────┘                      │
│         ▼                                                    │
│    @dxp/sdk-react hooks                                      │
│    useInventory · usePOS · useLoyalty · useProjectPlanner     │
│    + reused: useCms · usePayments · useScheduling · useSearch │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    NestJS BFF                                │
│                                                              │
│  NEW:  inventory · pos-connector · loyalty · project-planner │
│  REUSE: cms · payments · scheduling · notifications ·        │
│         search · documents · storage · identity · workflow    │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1 — Shell + 3 Dashboards ("The Wow")

**Goal**: Clickable portal with ACE branding and all 3 persona dashboards. Maximum visual impact.

### 1.1 Scaffold `starters/ace-hardware-portal/`
Copy from `wealth-portal`: package.json (rename, port 4500), vite.config, tailwind, tsconfig, index.html.

### 1.2 Theme + Providers
- `src/main.tsx` — ACE red (#D50032) theme, ThemeProvider, DxpProvider
- `src/App.tsx` — 3-persona routing via PersonaSwitcher (customer/manager/coop)
- `src/contexts/PersonaContext.tsx` — persona state + nav trees
- `src/config/theme.ts` — ACE brand colors (red, charcoal, green accents)

### 1.3 Mock data (Phase 1 subset)
- `mock-products.ts` — 50 products: Paint (10), Tools (10), Plumbing (8), Electrical (8), Outdoor (8), Hardware/Seasonal (6). Real brands: DeWalt, Rust-Oleum, Moen, Leviton, Weber.
- `mock-stores.ts` — 20 stores with realistic US addresses, hours, lat/lng
- `mock-sales.ts` — 30 days POS data per store, hourly granularity
- `mock-network.ts` — 5 US regions (Northeast, Southeast, Midwest, Southwest, West), aggregate KPIs
- `mock-charts.ts` — pre-computed chart datasets for all dashboards

### 1.4 Three dashboards

| Page | @dxp/ui Components |
|------|-------------------|
| **Customer Dashboard** | StatsDisplay (loyalty, orders), ItemCarousel (recommendations), Card (seasonal promo), DashboardCard, Badge |
| **Store Manager Dashboard** | StatsDisplay (today's sales, traffic, alerts), Chart (hourly sales line), DataTable (top sellers), Badge (staff on duty) |
| **Coop Network Dashboard** | StatsDisplay (total revenue, 5000+ stores, avg revenue), Chart (revenue trend), DashboardCard (regional KPIs), Card (map placeholder) |

**Verify**: `cd starters/ace-hardware-portal && pnpm dev` → 3 dashboards render at http://localhost:4500, persona switching works.

---

## Phase 2 — Customer Journey (Product + Cart + Loyalty)

### 2.1 New contracts: `packages/contracts/src/retail/`
- `product.ts` — Product, ProductQuery, ProductCategory, ProductReview
- `order.ts` — Order, OrderItem, OrderStatus, CartItem, CheckoutRequest
- `loyalty.ts` — LoyaltyMember, PointsBalance, PointsTransaction, TierStatus, Reward
- `store.ts` — Store, StoreHours, Department, StaffMember
- `index.ts` — re-exports all

### 2.2 Additional mock data
- Expand mock-products.ts (specs, reviews, per-store availability)
- `mock-loyalty.ts` — 3 customers, 500-15000 points each, tier history
- `mock-orders.ts` — 15 orders with statuses (ready for pickup, delivered, returned)

### 2.3 Customer pages (5)

| Page | @dxp/ui Components | Data Source |
|------|-------------------|-------------|
| **Product Catalog** | FilterBar (category, price, brand, in-stock), DataTable or card grid, Input (search), Select (sort), Badge (sale/new), StatusBadge (in-stock/out) | mock-products |
| **Product Detail** | DetailPanel, ImageGallery, Tabs (specs/reviews/availability), Badge, ItemCarousel (related), StatsDisplay (rating summary) | mock-products |
| **Cart / Checkout** | OrderSummary, MultiStepForm (3 steps: review, pickup/delivery, payment), StepIndicator, Input, Select | mock-orders |
| **Order History** | DataTable, FilterBar (status, date), StatusBadge, DetailPanel (order detail), Badge | mock-orders |
| **Loyalty / Rewards** | StatsDisplay (points, tier), ProgressTracker (tier progress), DataTable (earn/burn history), Card (reward catalog), Chart (points trend) | mock-loyalty |

**Verify**: Browse → add to cart → checkout flow with mock data.

---

## Phase 3 — Manager Operations (Inventory + Sales + Staff)

### 3.1 New BFF modules (2)

**inventory** (`apps/bff/src/modules/inventory/`)
- Port: `getProduct`, `listProducts`, `getStockLevel`, `listStockLevels`, `barcodeLookup`, `adjustStock`
- Adapters: `mock.adapter.ts` (ships with starter), `sap.adapter.ts` (placeholder)
- Env: `INVENTORY_ADAPTER=mock`

**pos-connector** (`apps/bff/src/modules/pos-connector/`)
- Port: `getDailySales`, `getSalesRange`, `getTransactions`, `getCategoryBreakdown`, `getTopSellers`
- Adapters: `mock.adapter.ts`
- Env: `POS_ADAPTER=mock`

### 3.2 New SDK hooks
- `use-inventory.ts` — useProducts, useProduct, useStockLevels, useBarcodeLookup
- `use-pos.ts` — useDailySales, useSalesRange, useCategoryBreakdown, useTopSellers

### 3.3 Additional contracts
- `retail/inventory.ts` — StockLevel, StockFilter, StockAlert, AisleLocation
- `retail/sales.ts` — DailySales, SalesAggregate, Transaction, CategoryBreakdown, TopSeller

### 3.4 Additional mock data
- `mock-inventory.ts` — stock levels per store/dept/aisle with alerts
- `mock-staff.ts` — employees, shifts, weekly schedules

### 3.5 Manager pages (4)

| Page | @dxp/ui Components |
|------|-------------------|
| **Inventory Management** | DataTable (full inventory), FilterBar (dept/aisle/status), Input (barcode search), StatusBadge (in-stock/low/out) |
| **Sales Analytics** | Chart (bar: daily, line: weekly), StatsDisplay (revenue, avg ticket, YoY), Tabs (daily/weekly/monthly), DataTable (category breakdown) |
| **Staff Schedule** | PlanView (weekly grid), DataTable (roster), Card (shift cards), Badge (role), StatusBadge (approved/pending) |
| **Customer Insights** | StatsDisplay (member count, avg spend), Chart (purchase patterns), DataTable (top customers), FilterBar, DetailPanel |

**Verify**: `pnpm nx build bff` clean. Swagger shows inventory + POS tags. Manager pages render.

---

## Phase 4 — Differentiators (Project Planner + Service Booking)

### 4.1 New BFF module

**project-planner** (`apps/bff/src/modules/project-planner/`)
- Port: `listTemplates`, `getTemplate`, `getMaterialsList`, `estimateCost`, `saveProject`, `listSavedProjects`
- Adapter: `mock.adapter.ts`
- Env: `PROJECT_PLANNER_ADAPTER=mock`

### 4.2 New SDK hook
- `use-project-planner.ts` — useProjectTemplates, useMaterialsList, useCostEstimate, useSavedProjects

### 4.3 Additional contracts
- `retail/project.ts` — ProjectTemplate, MaterialItem, CostEstimate, SavedProject
- `retail/service.ts` — ServiceOffering, ServiceBooking

### 4.4 Additional mock data
- `mock-projects.ts` — 5 DIY templates: Deck Building, Bathroom Remodel, Kitchen Backsplash, Fence Installation, Garage Organization
- `mock-services.ts` — key cutting, paint mixing, screen repair, pipe threading, propane exchange, tool rental

### 4.5 Pages (2)

| Page | @dxp/ui Components |
|------|-------------------|
| **Project Planner** | Card (template selector), DataTable (materials list with qty + cost), StatsDisplay (cost totals), ProgressTracker (project steps), Select |
| **Service Booking** | OptionList (service catalog), Card (service cards), MultiStepForm (service → date/time → confirmation), StepIndicator |

These are ACE-specific differentiators showing deep domain understanding.

---

## Phase 5 — Remaining Pages

### 5.1 New BFF module

**loyalty** (`apps/bff/src/modules/loyalty/`)
- Port: `getMember`, `getPointsBalance`, `getTransactionHistory`, `earnPoints`, `redeemPoints`, `getRewardsCatalog`, `getTierStatus`
- Adapter: `mock.adapter.ts`
- Env: `LOYALTY_ADAPTER=mock`

### 5.2 New SDK hook
- `use-loyalty.ts` — useLoyaltyMember, usePointsBalance, usePointsHistory, useRewardsCatalog

### 5.3 Additional contracts
- `retail/supplier.ts` — Supplier, PurchaseOrder, VendorScorecard, SupplierContract
- `retail/network.ts` — StoreKPI, RegionMetrics, DistributionCenter, NetworkSummary
- `retail/promotion.ts` — Promotion, Coupon, CouponPerformance

### 5.4 Additional mock data
- `mock-suppliers.ts` — 10 vendors with scorecards and active POs
- `mock-promotions.ts` — active promos, coupon performance data
- `mock-customers.ts` — loyalty member analytics, purchase patterns

### 5.5 Remaining customer pages (2)
- **My Store** — Card, DetailPanel, Tabs (info/departments/staff/contact), DataTable
- **(Dashboard already done in Phase 1)**

### 5.6 Remaining manager pages (3)
- **Supplier Orders** — DataTable (POs), FilterBar, StatusBadge, MultiStepForm (create PO), ApprovalCard
- **Promotions** — DataTable, DynamicForm (create/edit), Chart (coupon perf), StatusBadge
- **Store Settings** — PreferencesPanel, DynamicForm, Tabs (general/departments/services)

### 5.7 Coop Ops pages (5)
- **Store Performance** — DataTable (rankings), FilterBar (region, tier), Chart (comparative), StatusBadge
- **Supply Chain** — DataTable (DC status), StatusBadge, Chart (stock-out rates), StatsDisplay
- **Procurement** — DataTable (bulk orders), FilterBar, StatsDisplay (savings), ApprovalCard
- **Vendor Management** — DataTable (scorecards), FilterBar, Chart (quality scores), DetailPanel
- **Quality / Compliance** — DataTable (audit results), StatusBadge, Chart (compliance rates), ProgressTracker

---

## Phase 6 — Polish + Wire

1. Wire all pages to SDK hooks (replace direct mock imports where BFF modules exist)
2. Register all 4 new BFF modules in `app.module.ts`
3. Export new hooks from `packages/sdk-react/src/index.ts`
4. Export retail contracts from `packages/contracts/src/index.ts`
5. Run `make audit` — verify zero violations
6. Add `dev-ace` target to Makefile
7. Update root CLAUDE.md with ACE starter reference

**Verify**: `make audit-portal PORTAL=ace-hardware-portal` → 0 errors. All 24 pages render. Persona switching works. Mock data loads everywhere.

---

## Parallelization

```
Phase 1 ──┬──► Phase 2 ──► Phase 4
           │                    │
           └──► Phase 3 ──► Phase 5 ──► Phase 6
```

Phases 2 (customer frontend) and 3 (manager + BFF modules) can run in parallel after Phase 1.

---

## Summary

| | Pages | New BFF Modules | New Hooks | New Contracts |
|---|---|---|---|---|
| Phase 1 | 3 dashboards | — | — | — |
| Phase 2 | 5 customer | — | — | 4 files |
| Phase 3 | 4 manager | inventory, pos-connector | use-inventory, use-pos | 2 files |
| Phase 4 | 2 differentiator | project-planner | use-project-planner | 2 files |
| Phase 5 | 10 remaining | loyalty | use-loyalty | 3 files |
| Phase 6 | polish | — | — | — |
| **Total** | **24 pages** | **4 modules** | **4 hooks** | **11 files** |

## Critical Reference Files
- `starters/wealth-portal/src/App.tsx` — canonical multi-persona routing
- `apps/bff/src/modules/cms/cms.module.ts` — canonical BFF module pattern
- `packages/sdk-react/src/hooks/use-cms.ts` — canonical SDK hook pattern
- `starters/insurance-portal/src/data/mock.ts` — canonical mock data pattern
- `packages/ui/src/index.ts` — all available @dxp/ui components
