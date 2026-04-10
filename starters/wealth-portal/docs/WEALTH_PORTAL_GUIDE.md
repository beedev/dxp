# DXP Wealth Management Portal — Complete Guide

> **Singapore-centric APAC wealth management platform** built on the DXP framework.
> Covers real-time market data, multi-currency portfolio tracking, paper trading, advisor tools, and live financial news — no paid API keys required for core functionality.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Running the Portal](#running-the-portal)
4. [Feature Guide](#feature-guide)
   - [Markets Section](#markets-section)
   - [Investor Section](#investor-section)
   - [Advisor Section](#advisor-section)
5. [Integrations](#integrations)
   - [Yahoo Finance (Market Data)](#yahoo-finance-market-data)
   - [ExchangeRate-API (FX Rates)](#exchangerate-api-fx-rates)
   - [Google News RSS (Financial News)](#google-news-rss-financial-news)
   - [World Bank API (Macro Data)](#world-bank-api-macro-data)
   - [Paper Trading Engine (In-Memory)](#paper-trading-engine-in-memory)
6. [BFF Modules](#bff-modules)
7. [SDK Hooks](#sdk-hooks)
8. [Contract Types](#contract-types)
9. [Component Library](#component-library)
10. [Mock Data Reference](#mock-data-reference)
11. [Environment Variables](#environment-variables)
12. [Extending the Portal](#extending-the-portal)

---

## Overview

The Wealth Portal is the third DXP starter — a production-grade APAC wealth management platform for retail investors, self-directed traders, and financial advisors. It is Singapore-centric but covers 12 APAC markets and 14 currencies.

**Target users:**
| Role | What they do |
|------|-------------|
| **Retail Investor** | Track multi-currency portfolio, monitor APAC markets, paper trade |
| **Self-Directed Trader** | Place simulated orders, set price alerts, analyse charts |
| **Financial Advisor** | Manage client book of business, rebalance portfolios, build proposals |

**Key design decisions:**
- **No paid API keys needed** for market data, news, or FX — all public sources
- **Mock data fallback** everywhere — works without BFF running
- **SGD as base currency** for all P&L and portfolio aggregation
- **12 APAC exchanges** tracked in real time: SGX, HKEX, TSE, ASX, KRX, BSE, NSE, BURSA, SET, IDX, TWSE, SSE

---

## Architecture

```
Browser (localhost:4400)
    │
    │  /api/*  proxy
    ▼
Vite Dev Server ──────────────► BFF (NestJS, localhost:4201)
                                    │
                          ┌─────────┼─────────────────┐
                          │         │                 │
                    market-data  financial-news    wealth-portfolio
                    module       module            module
                          │         │                 │
                    Yahoo Finance  Google News RSS   Mock Adapter
                    (no key)       (no key)          (in-memory)
                          │
                    ExchangeRate-API   World Bank API
                    (fx module)        (macro module)
```

**Monorepo packages consumed:**
| Package | Purpose |
|---------|---------|
| `@dxp/ui` | 30+ enterprise React components |
| `@dxp/sdk-react` | Typed hooks that call BFF endpoints |
| `@dxp/contracts` | Shared TypeScript types (Holding, Order, ApacIndex, etc.) |

---

## Running the Portal

### Prerequisites

```bash
# From repo root
make up          # Start Keycloak + Kong + Postgres + Redis
pnpm install     # Install all workspace dependencies
```

### Start BFF

```bash
cd apps/bff
pnpm start:dev   # Listens on http://localhost:4201
# Swagger UI: http://localhost:4201/api/docs
```

### Start Wealth Portal

```bash
cd starters/wealth-portal
pnpm dev         # Listens on http://localhost:4400
```

### Verify Live Data

```bash
# Should return 12 APAC indices with real prices and non-zero change values
curl http://localhost:4201/api/v1/market/indices | jq '[.[] | {symbol, value, changePercent}]'
```

---

## Feature Guide

### Markets Section

#### Live Ticker
**Route:** Persistent top bar across all pages
**File:** `src/components/LiveTicker.tsx`

A horizontally scrolling amber ticker bar showing all 12 APAC indices with live prices and percentage changes. Polls BFF every 5 minutes. Falls back to static mock values if BFF is unreachable.

```
🇸🇬 Straits Times Index  4,958.25  -0.30%  |  🇯🇵 Nikkei 225  53,332.70  -0.12%  |  ...
```

**Data source:** Yahoo Finance v8 chart API (no key)

---

#### APAC Markets Overview
**Route:** `/markets`
**File:** `src/pages/markets/Overview.tsx`

The main markets landing page. Shows:

| Section | Description |
|---------|-------------|
| **Market Session Bar** | Count of open vs closed markets, live at render time |
| **Index Grid** | 12 cards — one per exchange. Gold border = market open, grey = closed |
| **Today's Highlights** | Best Performer, Worst Performer, Biggest Mover (by absolute % change) |

Each `IndexCard` shows:
- Exchange name + country flag
- OPEN / CLOSED badge (computed from each exchange's local timezone and session hours — weekends excluded)
- Current index value
- Point change + percentage change (colour coded)

**Market open logic:** Uses `Intl.DateTimeFormat` with each exchange's IANA timezone. Converts current UTC time to local exchange time and compares against session open/close. No reliance on Yahoo Finance `marketState` field (which returns `null` for index symbols).

---

#### FX Rates
**Route:** `/markets/fx`
**File:** `src/pages/markets/FxRates.tsx`

| Feature | Description |
|---------|-------------|
| **APAC Currency Grid** | 14 currencies vs USD with rate and % change |
| **Bidirectional Converter** | Enter amount in any currency, get SGD equivalent (and vice versa) |
| **SGD Reference Rate Table** | MAS-style buy/sell spreads for USD/SGD, EUR/SGD, JPY/SGD, AUD/SGD, HKD/SGD, CNY/SGD |

**Currencies covered:** SGD, HKD, JPY, AUD, NZD, CNY, KRW, INR, MYR, THB, IDR, PHP, TWD, VND

**Data source:** ExchangeRate-API (free tier, no key needed for basic rates)

---

#### Stock Screener
**Route:** `/markets/screener`
**File:** `src/pages/markets/Screener.tsx`

Multi-exchange stock screener pre-loaded with 20 APAC blue-chips across SGX, HKEX, TSE, ASX, NSE, BSE, KRX, SSE.

**Filter controls:**
- Exchange filter (all or specific market)
- Sector filter (Financials, Technology, Materials, etc.)
- Minimum dividend yield slider

**Sortable columns:**
| Column | Description |
|--------|-------------|
| Symbol | Ticker + exchange flag |
| Change % | Today's price movement |
| P/E Ratio | Trailing price/earnings |
| Dividend Yield | Annual dividend % |
| Market Cap | In SGD billions |

**Singapore stocks included:** DBS (D05.SI), OCBC (O39.SI), Singtel (Z74.SI), Mapletree REIT (M44U.SI), CapitaLand Integrated (C38U.SI)

---

#### Earnings Calendar
**Route:** `/markets/earnings`
**File:** `src/pages/markets/EarningsCalendar.tsx`

Corporate event calendar for APAC companies showing upcoming earnings releases, AGMs, and dividend ex-dates. Includes Singapore-centric events (Keppel Corp, DBS, CapitaLand, STI ETF).

---

#### Stock Search
**Route:** `/markets/search`
**File:** `src/pages/markets/StockSearch.tsx`

Type-ahead symbol search across all Yahoo Finance-listed symbols. Returns name, exchange, type, and currency. Works for SGX, HKEX, TSE, ASX, NSE, BSE and all other Yahoo Finance-supported markets.

**Data source:** Yahoo Finance search API `query2.finance.yahoo.com/v1/finance/search`

---

#### Macro Dashboard
**Route:** `/markets/macro`
**File:** `src/pages/markets/MacroDashboard.tsx`

Key economic indicators for APAC economies. Tracks GDP growth, inflation (CPI), unemployment, and policy interest rates for Singapore, Hong Kong, Japan, Australia, India, China, and South Korea.

**Data source:** World Bank Open Data API (no key)

---

#### Financial News
**Route:** `/markets/news`
**File:** `src/pages/markets/News.tsx`

Live financial news feed with sentiment analysis.

| Feature | Description |
|---------|-------------|
| **Sentiment badges** | Positive / Negative / Neutral — computed from headline keywords |
| **Source attribution** | Publisher name extracted from RSS `<source>` tag |
| **Filters** | By country (SG/HK/JP/AU/IN/CN/KR), sector, sentiment, date range |
| **Per-symbol news** | Drill into any holding for company-specific articles |

**Data source:** Google News RSS (APAC general) + Yahoo Finance RSS (per-symbol)

---

### Investor Section

#### Dashboard
**Route:** `/`
**File:** `src/pages/investor/Dashboard.tsx`

The main landing page for retail investors.

| Widget | Description |
|--------|-------------|
| **Net Worth Hero** | Total portfolio value + CPF in SGD |
| **Quick Stats** | Invested capital, Cash balance, CPF total, Unrealised P&L |
| **APAC Market Pulse** | 6 key indices (STI, HSI, N225, ASX200, KOSPI, Sensex) with live change |
| **Sector Allocation** | Donut-style breakdown (Financials, Tech, Materials, REITs) |
| **Top Movers** | Best and worst performing holdings today |
| **News Digest** | 3 latest headlines with sentiment badges |
| **Quick Actions** | Add Transaction, Place Order, Set Alert, View Portfolio |

---

#### Portfolio
**Route:** `/portfolio`
**File:** `src/pages/investor/Portfolio.tsx`

Full portfolio view with multi-currency breakdown.

**Summary bar:**
- Total Market Value (SGD)
- Day Change (SGD + %)
- Total P&L (SGD + %)
- FX P&L (currency impact on SGD value)

**Tab views:**
| Tab | Content |
|-----|---------|
| **Holdings** | Full position table — symbol, qty, avg cost, current price, local P&L, SGD value, FX P&L, total %, yield |
| **By Sector** | Sector allocation with SGD values |
| **By Country** | Country allocation with SGD values |
| **By Currency** | Currency exposure (SGD, HKD, JPY, AUD, INR) |

**Holdings table (8 positions):**
| Symbol | Name | Exchange | Currency |
|--------|------|----------|----------|
| D05.SI | DBS Group | SGX | SGD |
| 0700.HK | Tencent Holdings | HKEX | HKD |
| 7203.T | Toyota Motor | TSE | JPY |
| BHP.AX | BHP Group | ASX | AUD |
| HDFCBANK.NS | HDFC Bank | NSE | INR |
| 9988.HK | Alibaba Group | HKEX | HKD |
| M44U.SI | Mapletree Pan Asia REIT | SGX | SGD |
| 9984.T | SoftBank Group | TSE | JPY |

---

#### Trading Terminal
**Route:** `/trade`
**File:** `src/pages/investor/TradingTerminal.tsx`

Full-featured simulated trading interface.

| Panel | Description |
|-------|-------------|
| **Symbol Selector** | Search any APAC symbol |
| **Price Chart** | SVG line/area chart with 1M/3M/6M/1Y range selector |
| **Bid/Ask Display** | Live spread with last price |
| **Quick Stats** | Volume, Day High, Day Low, 52-week range |
| **Order Panel** | Buy/sell, order type, quantity, price, validity (DAY/GTC) |
| **Order Blotter** | Recent orders with status (Pending/Partial/Filled/Cancelled) |
| **Paper Mode Badge** | Persistent reminder that orders are simulated |

**Order types supported:** Market, Limit, Stop, Stop-Limit
**Validity options:** DAY, Good Till Cancelled (GTC)
**Commission model:** 0.08% with SGD 2.50 minimum

---

#### Orders
**Route:** `/orders`
**File:** `src/pages/investor/Orders.tsx`

Complete order history with filtering by status. Cancel pending orders directly from this view.

---

#### Transactions
**Route:** `/transactions`
**File:** `src/pages/investor/Transactions.tsx`

Transaction ledger showing buys, sells, and dividend receipts with pagination.

**Sample transactions:**
- Buy 200 DBS @ SGD 35.20 (March 2024)
- Dividend: DBS Q3 2024 — SGD 960
- Buy 100 Tencent @ HKD 380.00
- Dividend: Mapletree REIT Q4 2024 — SGD 134

---

#### Analytics
**Route:** `/analytics`
**File:** `src/pages/investor/Analytics.tsx`

Portfolio performance and risk analysis.

| Metric | Value (mock) | Description |
|--------|-------------|-------------|
| Portfolio Beta | 0.87 | Market sensitivity vs STI |
| Sharpe Ratio | 1.23 | Risk-adjusted return |
| Max Drawdown | -8.1% | Worst peak-to-trough |
| Concentration Risk | Top 3 = 61% | DBS + Tencent + BHP |

**Charts:**
- YTD Performance vs STI Benchmark (dual line chart)
- P&L Attribution by position (price return vs FX impact)
- Dividend income — 12-month bar chart

---

#### Retirement (CPF)
**Route:** `/retirement`
**File:** `src/pages/investor/Retirement.tsx`

CPF account tracker for Singapore residents.

| Account | Balance (mock) |
|---------|--------------|
| Ordinary Account (OA) | SGD 87,450 |
| Special Account (SA) | SGD 34,200 |
| MediSave Account (MA) | SGD 18,750 |
| Retirement Account (RA) | SGD 0 (not yet created) |
| **Total CPF** | **SGD 140,400** |

Shows withdrawal eligibility rules and projected CPF LIFE payouts.

---

#### Goals
**Route:** `/goals`
**File:** `src/pages/investor/Goals.tsx`

Goal-based investing tracker with progress visualisation.

| Goal | Target | Current | Deadline |
|------|--------|---------|----------|
| Retirement at 60 | SGD 2,000,000 | SGD 117,331 | 2045 |
| Property Downpayment | SGD 200,000 | SGD 67,331 | 2027 |
| Children's Education | SGD 150,000 | SGD 25,000 | 2032 |

---

#### Tax Summary
**Route:** `/tax`
**File:** `src/pages/investor/TaxSummary.tsx`

Withholding tax tracker by country of holding.

| Country | WHT Rate |
|---------|---------|
| Japan | 15.315% |
| Australia | 15% |
| India | 20% |
| Singapore | 0% (no dividend tax) |
| Hong Kong | 0% |

---

#### Alerts
**Route:** `/alerts`
**File:** `src/pages/investor/Alerts.tsx`

Price and volume alert management.

**Pre-seeded alerts:**
| Symbol | Condition | Status |
|--------|-----------|--------|
| D05.SI | Price below SGD 36.00 | Active |
| 0700.HK | Price above HKD 450.00 | Active |
| BHP.AX | Price above AUD 52.00 | Triggered 2026-04-07 |

---

### Advisor Section

#### Client List
**Route:** `/advisor`
**File:** `src/pages/advisor/ClientList.tsx`

Advisor book-of-business view.

**Summary bar:**
- Total AUM under management
- Average YTD return across all clients
- Count of clients due for annual review

**Client table:**
| Client | AUM | YTD | Risk Profile |
|--------|-----|-----|-------------|
| Wei Liang Tan | SGD 524,780 | +8.34% | Moderate Growth |
| Priya Sharma | SGD 1,240,000 | +12.45% | Aggressive Growth |
| James Woo | HKD 8,500,000 | +6.78% | Conservative |
| Ananya Krishnan | SGD 320,000 | +15.23% | Moderate Growth |
| Robert Chen | AUD 2,100,000 | +4.12% | Balanced |

**Risk profile badges:** Conservative, Balanced, Moderate Growth, Aggressive Growth

---

#### Client Detail
**Route:** `/advisor/client/:id`
**File:** `src/pages/advisor/ClientDetail.tsx`

Individual client portfolio drill-down with full holdings, performance, and next-action tracking.

---

#### Rebalance Helper
**Route:** `/advisor/rebalance`
**File:** `src/pages/advisor/RebalanceHelper.tsx`

Compares current allocation vs target allocation and generates rebalancing trade recommendations to bring the portfolio back to target weights.

---

#### Proposal Builder
**Route:** `/advisor/proposal`
**File:** `src/pages/advisor/ProposalBuilder.tsx`

Generate investment proposals for clients based on risk profile, time horizon, and target allocation. Outputs a structured document suitable for client presentation.

---

## Integrations

### Yahoo Finance (Market Data)

**Adapter:** `apps/bff/src/modules/market-data/adapters/yahoo-finance.adapter.ts`
**Env var:** `MARKET_DATA_ADAPTER=yahoo-finance`
**API key:** None required

**APIs used:**

| Endpoint | Purpose |
|----------|---------|
| `query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1d` | Single quote (price, change, 52w range) |
| `query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range={range}` | OHLCV price history (1m/3m/6m/1y/5y) |
| `query2.finance.yahoo.com/v1/finance/search?q={query}` | Symbol search |

**Key implementation details:**

1. **Previous close field:** Index symbols use `chartPreviousClose`; equity symbols use `previousClose`. The adapter reads both: `meta.chartPreviousClose ?? meta.previousClose ?? price`.

2. **Market open detection:** Yahoo Finance returns `marketState: null` for index symbols. The adapter ignores this and instead computes open/closed status using `Intl.DateTimeFormat` with each exchange's IANA timezone and session hours. Weekends are excluded.

3. **APAC indices tracked:**

| Symbol | Name | Exchange | Timezone |
|--------|------|----------|----------|
| `^STI` | Straits Times Index | SGX | Asia/Singapore |
| `^HSI` | Hang Seng Index | HKEX | Asia/Hong_Kong |
| `^N225` | Nikkei 225 | TSE | Asia/Tokyo |
| `^AXJO` | S&P/ASX 200 | ASX | Australia/Sydney |
| `^KS11` | KOSPI | KRX | Asia/Seoul |
| `^BSESN` | BSE Sensex | BSE | Asia/Kolkata |
| `^NSEI` | NIFTY 50 | NSE | Asia/Kolkata |
| `^KLSE` | FTSE Bursa Malaysia KLCI | BURSA | Asia/Kuala_Lumpur |
| `^SET.BK` | SET Index | SET | Asia/Bangkok |
| `^JKSE` | Jakarta Composite Index | IDX | Asia/Jakarta |
| `^TWII` | Taiwan Weighted Index | TWSE | Asia/Taipei |
| `000001.SS` | SSE Composite Index | SSE | Asia/Shanghai |

4. **Rate limiting:** No official rate limit published. The adapter uses 12 parallel `Promise.allSettled` calls on startup. Failed fetches are silently dropped (partial results returned).

**BFF endpoints served:**

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/market/indices` | All 12 APAC indices with live prices + open/closed status |
| `GET /api/v1/market/quote/:symbol` | Single symbol quote |
| `GET /api/v1/market/quotes?symbols=A,B` | Batch quotes |
| `GET /api/v1/market/search?q=query` | Symbol search |
| `GET /api/v1/market/history/:symbol?range=1m` | OHLCV history (1m/3m/6m/1y/5y) |

---

### ExchangeRate-API (FX Rates)

**Adapter:** `apps/bff/src/modules/fx/adapters/exchangerate-api.adapter.ts`
**Env var:** `FX_ADAPTER=exchangerate-api`
**API key:** None required for free tier

Provides FX rates for 14 APAC currencies. SGD is the base for portfolio valuation. The portal uses rates to convert holding values (HKD, JPY, AUD, INR) into SGD for consolidated P&L.

**BFF endpoints served:**

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/fx/rates?base=USD` | All rates vs USD |
| `GET /api/v1/fx/apac` | 14 APAC currency rates |
| `GET /api/v1/fx/convert?from=HKD&to=SGD&amount=10000` | Convert amount |
| `GET /api/v1/fx/sgd` | SGD reference rates (MAS-style buy/sell spread) |

---

### Google News RSS (Financial News)

**Adapter:** `apps/bff/src/modules/financial-news/adapters/google-news.adapter.ts`
**Env var:** `NEWS_ADAPTER=google-news`
**API key:** None required

**How it works:**

1. **General APAC news:** Queries `news.google.com/rss/search` with a structured query (e.g. `APAC finance markets Singapore Hong Kong`). The `gl` parameter is set to the country code when a country filter is applied.

2. **Per-symbol news:** First tries Yahoo Finance RSS (`finance.yahoo.com/rss/headline?s={symbol}`). Falls back to Google News RSS with a symbol-specific query (e.g. `"DBS" stock earnings results`).

3. **XML parsing:** No external XML library used. Regex-based parser handles `<![CDATA[...]]>` blocks, `<source>` tags, and HTML entity decoding.

4. **Title parsing:** Google News appends ` - Source Name` to every headline. The adapter strips this suffix for a clean headline and uses it as the source name fallback.

5. **Sentiment detection:** Keyword scoring. Positive: `profit, surge, rally, gain, growth, record, beat, upgrade`. Negative: `loss, fall, drop, crash, decline, cut, miss, downgrade, warning`. Net score decides `positive / negative / neutral`.

**BFF endpoints served:**

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/news` | APAC news feed with filters (country, sector, sentiment, date, pagination) |
| `GET /api/v1/news/:symbol` | Company-specific news (Yahoo Finance RSS → Google News fallback) |

---

### World Bank API (Macro Data)

**Adapter:** `apps/bff/src/modules/macro/adapters/worldbank.adapter.ts`
**Env var:** `MACRO_ADAPTER=worldbank`
**API key:** None required

Fetches GDP growth, CPI inflation, unemployment, and policy rate series for APAC economies (SG, HK, JP, AU, IN, CN, KR).

**BFF endpoints served:**

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/macro/indicators` | Key macro indicators for all tracked economies |
| `GET /api/v1/macro/indicators/:country` | Single country macro data |

---

### Paper Trading Engine (In-Memory)

**Adapter:** `apps/bff/src/modules/paper-trading/adapters/paper-engine.adapter.ts`
**Env var:** `TRADING_ADAPTER=paper`
**API key:** None — fully in-memory

Simulates order execution against static market prices. Not persisted across BFF restarts.

**Account parameters:**
- Starting cash: SGD 100,000
- Commission: 0.08% (minimum SGD 2.50)
- Supported order types: Market, Limit, Stop, Stop-Limit
- Validity: DAY, GTC

**Pre-seeded state:**

*Pending orders:*
| Symbol | Side | Type | Qty | Limit Price |
|--------|------|------|-----|-------------|
| D05.SI | Buy | Limit | 100 | SGD 35.00 |
| 0700.HK | Buy | Limit | 200 | HKD 390.00 |
| BHP.AX | Sell | Stop | 300 | AUD 46.00 |

*Filled orders (with P&L):*
| Symbol | Side | P&L |
|--------|------|-----|
| HDFCBANK.NS | Buy | +SGD 145 |
| 9984.T | Buy | +SGD 712 |
| M44U.SI | Buy | -SGD 240 |
| BHP.AX | Buy | +SGD 250 |
| D05.SI | Buy | +SGD 186 |

**BFF endpoints served:**

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/paper/portfolio` | Paper account summary (cash, value, total P&L) |
| `GET /api/v1/paper/orders` | Orders (filter by status: pending/filled/cancelled) |
| `POST /api/v1/paper/orders` | Place new simulated order |
| `DELETE /api/v1/paper/orders/:id` | Cancel pending order |
| `GET /api/v1/paper/alerts` | Price/volume alerts |
| `POST /api/v1/paper/alerts` | Create new alert |
| `DELETE /api/v1/paper/alerts/:id` | Delete alert |

---

## BFF Modules

All wealth-related BFF modules live in `apps/bff/src/modules/`. Each follows the DXP port+adapter pattern — swap adapters via env var with zero code changes.

| Module | Env Var | Default Adapter | External API |
|--------|---------|-----------------|-------------|
| `market-data` | `MARKET_DATA_ADAPTER` | `yahoo-finance` | Yahoo Finance v8 |
| `financial-news` | `NEWS_ADAPTER` | `google-news` | Google News RSS + Yahoo Finance RSS |
| `fx` | `FX_ADAPTER` | `exchangerate-api` | ExchangeRate-API |
| `macro` | `MACRO_ADAPTER` | `worldbank` | World Bank Open Data |
| `wealth-portfolio` | `PORTFOLIO_ADAPTER` | `mock` | None (mock) |
| `paper-trading` | `TRADING_ADAPTER` | `paper` | None (in-memory) |
| `watchlist` | `WATCHLIST_ADAPTER` | `mock` | None (mock) |

---

## SDK Hooks

All hooks live in `packages/sdk-react/src/hooks/`. Import from `@dxp/sdk-react`.

### Market Data

```ts
import { useApacIndices, useStockQuote, usePriceHistory, useSymbolSearch } from '@dxp/sdk-react';

// All 12 APAC indices — poll every 5 min
const { data: indices } = useApacIndices({ refetchInterval: 5 * 60 * 1000 });

// Single quote
const { data: quote } = useStockQuote('D05.SI');

// OHLCV history — range: '1m' | '3m' | '6m' | '1y' | '5y'
const { data: bars } = usePriceHistory('0700.HK', '3m');

// Symbol search
const { data: results } = useSymbolSearch('DBS');
```

### FX

```ts
import { useFxRates, useApacFxRates, useFxConvert, useSgdRates } from '@dxp/sdk-react';

const { data: rates } = useApacFxRates();
const { data: converted } = useFxConvert({ from: 'HKD', to: 'SGD', amount: 10000 });
```

### Portfolio

```ts
import { usePortfolio, useHoldings, useTransactions, useAddTransaction } from '@dxp/sdk-react';

const { data: summary } = usePortfolio({ baseCurrency: 'SGD' });
const { data: holdings } = useHoldings({ baseCurrency: 'SGD', sector: 'Financials' });
const addTx = useAddTransaction();
addTx.mutate({ symbol: 'D05.SI', side: 'buy', qty: 100, price: 36.20, currency: 'SGD' });
```

### Paper Trading

```ts
import { usePaperOrders, usePlaceOrder, useCancelOrder, useAlerts, useCreateAlert } from '@dxp/sdk-react';

const { data: orders } = usePaperOrders({ status: 'pending' });
const place = usePlaceOrder();
place.mutate({ symbol: 'D05.SI', side: 'buy', type: 'limit', qty: 100, price: 35.50, validity: 'DAY' });
```

### News

```ts
import { useApacNews, useCompanyNews } from '@dxp/sdk-react';

const { data } = useApacNews({ country: 'SG', sentiment: 'positive', page: 1, pageSize: 10 });
const { data: companyNews } = useCompanyNews('D05.SI');
```

---

## Contract Types

All types live in `packages/contracts/src/wealth/`. Import from `@dxp/contracts`.

### Portfolio Types (`portfolio.ts`)

```ts
interface Holding {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  currency: string;
  qty: number;
  avgCost: number;        // in local currency
  currentPrice: number;   // in local currency
  localPnl: number;
  sgdValue: number;
  fxPnl: number;          // FX impact in SGD
  totalPnlPct: number;
  dividendYield?: number;
  taxWithholdingRate?: number;
}

interface PortfolioSummary {
  totalValue: number;       // SGD
  totalCost: number;
  totalPnl: number;
  totalPnlPct: number;
  fxPnl: number;
  cash: number;
  byCountry: Record<string, number>;
  bySector: Record<string, number>;
  byCurrency: Record<string, number>;
}
```

### Trading Types (`trading.ts`)

```ts
type OrderSide = 'buy' | 'sell';
type OrderType = 'market' | 'limit' | 'stop' | 'stop-limit';
type OrderStatus = 'pending' | 'partial' | 'filled' | 'cancelled' | 'rejected';
type OrderValidity = 'DAY' | 'GTC' | 'GTD';

interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  filledQty: number;
  limitPrice?: number;
  stopPrice?: number;
  status: OrderStatus;
  validity: OrderValidity;
  commission: number;
  placedAt: string;
  filledAt?: string;
}
```

### Market Types (`market.ts`)

```ts
interface ApacIndex {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  flag: string;
  timezone: string;
  sessionOpen: string;
  sessionClose: string;
  value: number;
  change: number;
  changePercent: number;
  isMarketOpen: boolean;
}

interface StockQuote {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high52w?: number;
  low52w?: number;
  isMarketOpen: boolean;
  lastUpdated: string;
}

interface PriceBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

### News Types (`news.ts`)

```ts
type NewsSentiment = 'positive' | 'negative' | 'neutral';

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  publishedAt: string;
  sentiment: NewsSentiment;
  tags: string[];
}

interface NewsFilters {
  symbol?: string;
  category?: string;
  country?: string;
  sector?: string;
  sentiment?: NewsSentiment;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
```

### FX Types (`fx.ts`)

```ts
type ApacCurrency = 'SGD' | 'HKD' | 'JPY' | 'AUD' | 'NZD' | 'CNY'
                  | 'KRW' | 'INR' | 'MYR' | 'THB' | 'IDR' | 'PHP' | 'TWD' | 'VND';

interface FxRate {
  from: string;
  to: string;
  rate: number;
  change: number;
  changePct: number;
}
```

---

## Component Library

Reusable components in `src/components/`:

| Component | Props | Description |
|-----------|-------|-------------|
| `LiveTicker` | — | Scrolling index ticker, auto-polls BFF |
| `IndexCard` | `index: ApacIndex \| StaticIndex` | Exchange card with open/closed badge |
| `PriceChart` | `symbol, range, height, color` | SVG line/area chart |
| `FxWidget` | `currency, rate, change` | Currency pair mini-card |
| `OrderPanel` | `symbol, onSubmit, isPaper` | Order entry form |
| `HoldingRow` | `holding: Holding` | Portfolio table row |

All consume `@dxp/ui` components internally (Card, Badge, Button, DataTable, etc.).

---

## Mock Data Reference

Mock data is in `src/data/` and provides the fallback when BFF is unreachable.

| File | Contents |
|------|---------|
| `mock-portfolio.ts` | 8 holdings, portfolio summary, 10 transactions, CPF balances, 3 goals, 8 paper orders, 3 alerts, 5 watchlist items, 5 advisory clients |
| `apac-markets.ts` | 12 APAC index definitions with static prices, change values, session hours |
| `apac-currencies.ts` | 14 APAC currency rates vs USD with change data |

---

## Environment Variables

All in `.env` at the repo root:

```bash
# BFF
BFF_PORT=4201

# Market data — yahoo-finance (no key) | alpha-vantage (requires key)
MARKET_DATA_ADAPTER=yahoo-finance
ALPHA_VANTAGE_KEY=

# FX rates
FX_ADAPTER=exchangerate-api

# Financial news — google-news (no key) | brave (requires key)
NEWS_ADAPTER=google-news
BRAVE_SEARCH_KEY=

# Macro data
MACRO_ADAPTER=worldbank

# Portfolio — mock | db
PORTFOLIO_ADAPTER=mock

# Paper trading — paper | broker
TRADING_ADAPTER=paper
```

**To enable Brave Search** (higher quality news with real financial sources):
1. Register at `brave.com/search/api` (free tier: 2,000 queries/month)
2. Set `BRAVE_SEARCH_KEY=your_key` in `.env`
3. Set `NEWS_ADAPTER=brave`
4. Restart BFF

---

## Extending the Portal

### Swap to a Real Portfolio Adapter

Implement `WealthPortfolioPort` and register it in `wealth-portfolio.module.ts`:

```ts
// apps/bff/src/modules/wealth-portfolio/adapters/db-portfolio.adapter.ts
@Injectable()
export class DbPortfolioAdapter extends WealthPortfolioPort {
  async getPortfolio(userId: string, baseCurrency: string): Promise<PortfolioSummary> {
    // query your database
  }
  // ...
}
```

Set `PORTFOLIO_ADAPTER=db` in `.env`.

### Add a New APAC Exchange

1. Add the symbol + metadata to `APAC_INDEX_SYMBOLS` and `INDEX_META` in `yahoo-finance.adapter.ts`
2. Add static fallback entry in `src/data/apac-markets.ts`
3. The Live Ticker and Overview grid update automatically

### Connect a Real Broker

Implement `PaperTradingPort` with your broker's API (IBKR, Tiger Brokers, Moomoo) and register it in `paper-trading.module.ts`. Set `TRADING_ADAPTER=broker`.

### Add Keycloak Auth

The BFF is Keycloak-ready. Set `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID` and enable the `KeycloakGuard` in `app.module.ts`. The Kong gateway handles token validation before requests reach the BFF.

---

*Built with the DXP framework — adapters are the IP, runtimes are the client's problem.*
