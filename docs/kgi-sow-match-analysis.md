# KGI SOW vs DXP Platform — Match Analysis

**Document**: KGI Securities (Singapore) Pte. Ltd. — Scope of Work v1.0 (2 April 2026)
**Compared Against**: DXP Delivery Accelerator — Wealth Portal + AI Assistant

---

## Executive Summary

The DXP platform covers **~65% of the KGI web portal requirements** out of the box. The remaining ~35% is KGI-specific (KYC onboarding, 3rd Party Trading Platform integration, admin panel, mobile app). The DXP accelerator reduces the web portal delivery from an estimated 6-month build to ~3 months by providing the component library, BFF architecture, auth infrastructure, market data integration, and AI assistant.

| Area | DXP Coverage | Effort to Complete |
|------|-------------|-------------------|
| Web Portal (Modules 1-4) | 65% | 8-10 weeks |
| Mobile App (Module 5) | 10% | 12-14 weeks |
| Admin Panel (Module 4) | 0% | 6-8 weeks |
| Non-Functional (Section 4) | 50% | 4-6 weeks |

---

## Module 1: Client Registration & Demo Account Creation

| SOW Requirement | DXP Component | Status | Gap |
|----------------|--------------|--------|-----|
| **1.1 Email Registration** | | | |
| Email + OTP verification | Keycloak OIDC realm | Available | Configure OTP flow in Keycloak realm |
| Client record creation (Lead status) | BFF — no CRM module | Gap | New: CRM/lead management adapter |
| T&C acceptance | `@dxp/ui` — `MultiStepForm` | Available | Build acceptance screen with scrollable viewer |
| **1.2 Password & Profile Setup** | | | |
| Password policy (8 chars, mixed case, special) | Keycloak password policy | Available | Configure in realm settings |
| 2FA (TOTP authenticator) | Keycloak TOTP | Available | Enable in realm auth flow |
| Profile capture (name, country) | `@dxp/ui` — `Input`, `Select` | Available | Build profile form |
| **1.3 Demo Account via 3rd Party API** | | | |
| Call Create Account endpoint | BFF port+adapter | Pattern exists | New adapter: `TradingPlatformAdapter` |
| Display credentials with Copy function | `@dxp/ui` components | Available | Build credential display card |
| Redirect to white-label trading interface | Frontend routing | Available | Configure redirect URL |
| Virtual capital (admin-configurable) | Admin panel | Gap | Part of admin panel build |
| **1.4 Automated Notifications** | | | |
| Welcome email | BFF `notifications` module (SMTP adapter) | Available | Configure email templates |
| Demo credentials email | BFF `notifications` module | Available | New template |
| Upgrade reminder email | BFF `notifications` module | Available | Add scheduled job |

**Module 1 Coverage: 60%** — Auth infrastructure exists. CRM lead management and 3rd Party Trading Platform integration are new.

---

## Module 2: Client Onboarding & Live Account Creation

| SOW Requirement | DXP Component | Status | Gap |
|----------------|--------------|--------|-----|
| **2.1 KYC Data Collection** | | | |
| Multi-step wizard form | `@dxp/ui` — `MultiStepForm`, `ProgressTracker` | Available | Build KYC-specific steps |
| Personal info fields | `@dxp/ui` — `Input`, `Select` | Available | Build form layout |
| Employment & financial info | `@dxp/ui` components | Available | Build form layout |
| Trading experience assessment | `@dxp/ui` components | Available | Build assessment form |
| Tax residency / FATCA/CRS | `@dxp/ui` components | Available | Build declarations form |
| 3rd party KYC (Sumsup, Worldcheck) | BFF adapter pattern | Pattern exists | New adapter: `KYCProviderAdapter` |
| **2.2 Document Upload** | | | |
| ID upload (front + back) | BFF `documents` module (S3 adapter) | Available | Configure upload flow |
| Proof of address upload | BFF `documents` module | Available | Same flow |
| JPEG/PNG/PDF, max 10MB | `@dxp/ui` — `FileUploadZone` | Available | Configure size limits |
| OCR/AI-assisted reading | AI assistant `upload` tool | Available | Configure for document analysis |
| **2.3 Exchange & Regulatory Agreements** | | | |
| Scrollable agreement viewer + checkbox | `@dxp/ui` components | Available | Build agreement viewer |
| Timestamped acceptance audit trail | No audit trail module | Gap | New: audit logging middleware |
| **2.4 Internal Review & Approval** | | | |
| Pending Review status workflow | No admin panel | Gap | New: admin panel with approval queue |
| Approve/Reject with reason | No admin panel | Gap | Part of admin panel build |
| Auto-create live account on approval | BFF → 3rd Party API | Pattern exists | Wire approval to Create Account adapter |
| **2.5 Automated Notifications** | | | |
| KYC submission/approval/rejection emails | BFF `notifications` module | Available | Add templates |
| **2.6 SLA Targets** | | | |
| KYC review within 1 business day | Operational, not technical | N/A | Process, not code |
| Real-time notification within 5 min | WebSocket/push | Available (WebSocket in AI assistant) | Extend to KYC status updates |

**Module 2 Coverage: 55%** — UI components and document upload exist. KYC wizard, admin approval workflow, and KYC provider integration are new builds.

---

## Module 3: Funding — Deposits & Withdrawals

| SOW Requirement | DXP Component | Status | Gap |
|----------------|--------------|--------|-----|
| **3.1 Deposits via SWIFT** | | | |
| Display KGI bank details | Static content page | Available | Build info display card |
| Deposit request initiation | BFF `payments` module (port+adapter) | Available | New adapter: `SWIFTTransferAdapter` |
| Adjust Balance API call | BFF → 3rd Party API | Pattern exists | Wire to TradingPlatformAdapter |
| USD auto-conversion notice | UI component | Available | Build notice banner |
| Deposit confirmation notification | BFF `notifications` module | Available | Add template |
| **3.2 Withdrawals** | | | |
| Withdrawal request form | `@dxp/ui` — `Input`, `Button` | Available | Build withdrawal form |
| Internal approval queue | Admin panel | Gap | Part of admin panel build |
| SWIFT transfer execution | BFF adapter | Pattern exists | New adapter or manual process |
| Rejection with reason | Admin panel + notifications | Gap | Part of admin panel |
| **3.3 Transaction History** | | | |
| Deposit/withdrawal history | `@dxp/ui` — `DataTable`, `StatusBadge` | Available | Build history page |
| Filterable by date/type/status | `@dxp/ui` — `FilterBar` | Available | Wire filters |

**Module 3 Coverage: 50%** — Payment adapter pattern and UI components exist. SWIFT-specific integration and admin approval are new.

---

## Module 4: Customer-Facing Dashboard (Web & Mobile)

| SOW Requirement | DXP Component | Status | Gap |
|----------------|--------------|--------|-----|
| **4.1 Account Summary** | | | |
| Total equity, available margin, used margin | Wealth Portal — `InvestorDashboard` | Available | Re-wire to 3rd Party API (Read Only Account) |
| Fund position (deposits, withdrawals, P&L) | Wealth Portal — `Portfolio` page | Available | Re-wire data source |
| **4.2 Holdings / Portfolio View** | | | |
| Open positions with entry price, current, P&L | Wealth Portal — `Portfolio` page | Available | Re-wire to 3rd Party API (Open Positions) |
| Margin used per position | Wealth Portal — `Portfolio` page | Partial | Add margin column |
| **4.3 Watchlist** | | | |
| Configurable CME instrument watchlist | Wealth Portal — watchlist feature | Available | Re-wire to 3rd Party Market Data API |
| Real-time/near-real-time prices | BFF `market-data` module (Yahoo Finance adapter) | Available | New adapter: `TradingPlatformMarketAdapter` |
| **4.4 Trade History** | | | |
| Historical trades with fill details | Wealth Portal — `Transactions` page | Available | Re-wire to 3rd Party API (Trade History) |
| Date/time, instrument, side, qty, price, P&L | `@dxp/ui` — `DataTable` | Available | Configure columns |

**Module 4 Coverage: 80%** — Wealth portal has all these pages built. The work is re-wiring data sources from mock/Yahoo to the 3rd Party Trading Platform API via new BFF adapters.

---

## Module 5: Mobile App + 3rd Party Trading Platform API

| SOW Requirement | DXP Component | Status | Gap |
|----------------|--------------|--------|-----|
| **5.1 API Integration (10 endpoints)** | | | |
| Create Account | BFF adapter pattern | Pattern exists | New: `TradingPlatformAdapter` |
| Adjust Balance | BFF adapter pattern | Pattern exists | Method in same adapter |
| Read Only Account | BFF adapter pattern | Pattern exists | Method in same adapter |
| Open Positions | BFF adapter pattern | Pattern exists | Method in same adapter |
| Trade History | BFF adapter pattern | Pattern exists | Method in same adapter |
| Market Data API | BFF `market-data` module | Available | New adapter or extend Yahoo |
| Order API | BFF `paper-trading` module | Available | New adapter: live order routing |
| Account Events API | No event/webhook module | Gap | New: event listener + push |
| **5.2 Mobile App** | | | |
| Bottom tab navigation (5 tabs) | No mobile app | Gap | New build: React Native or Capacitor |
| Watchlist tab | Wealth portal pages (re-use logic) | Partial | Mobile UI adaptation |
| Trade tab (order placement) | Wealth portal `TradingTerminal` | Partial | Mobile UI adaptation |
| Portfolio tab | Wealth portal `Portfolio` | Partial | Mobile UI adaptation |
| Account Management tab | New | Gap | Build for mobile |
| Me/Settings tab | New | Gap | Build for mobile |
| **5.3 Push Notifications** | | | |
| Margin call warning | No push infrastructure | Gap | New: FCM/APNs integration |
| Liquidation notice | No push infrastructure | Gap | Same |
| Deposit/withdrawal events | BFF `notifications` module | Partial | Extend to push |
| KYC status updates | BFF `notifications` module | Partial | Extend to push |
| Inactive account reminder | No scheduled jobs | Gap | New: job scheduler |

**Module 5 Coverage: 15%** — BFF adapter pattern covers API integration design. Mobile app and push notifications are entirely new builds.

---

## Non-Functional Requirements (Section 4)

### 4.1 Security

| Requirement | DXP Status | Action Required |
|------------|-----------|----------------|
| TLS 1.2+ in transit | Kong/infra handles | Configure at deployment |
| AES-256 at rest | Not configured | Enable PG encryption + S3 SSE |
| OWASP Top 10 | Security audit done, critical fixes applied | Pen test before go-live |
| 2FA (TOTP) | Keycloak supports natively | Enable in realm config |
| Session timeout + forced re-auth | Keycloak session management | Configure token lifetimes |
| RBAC for admin panel | BFF `RolesGuard` + `JwtAuthGuard` | Define KGI roles |
| DLP (no bulk export) | Not implemented | New: export controls middleware |
| PDPA compliance | Not implemented | New: consent management |
| Audit trail logging | Not implemented | New: audit logging middleware |

### 4.2 Performance

| Requirement | DXP Status | Action Required |
|------------|-----------|----------------|
| Page load < 2s (Core Web Vitals) | React + Vite — fast by default | Load test + optimize |
| Mobile launch < 3s | No mobile app yet | Optimize at build time |
| API response < 500ms (p95) | NestJS BFF — typical <100ms | 3rd Party API latency is the bottleneck |
| 1,500 concurrent users (Q4) | Architecture supports horizontal scaling | Load test + provision |

### 4.3 Availability & Hosting

| Requirement | DXP Status | Action Required |
|------------|-----------|----------------|
| 99.5% uptime | No production deployment | AWS Multi-AZ + monitoring |
| Singapore-hosted (MAS) | Architecture is cloud-agnostic | Deploy to ap-southeast-1 |
| BCP/DR (RPO <1h, RTO <4h) | No DR setup | RDS Multi-AZ + S3 cross-region |

### 4.4 Scalability

| Requirement | DXP Status | Action Required |
|------------|-----------|----------------|
| Horizontal scaling | Stateless BFF — scales horizontally | Container orchestration (ECS/EKS) |
| Multi-market (HK, Taiwan) | Wealth portal has region toggle (SG/IN) | Extend to HK/TW |
| Multi-language (EN, ZH-CN, ZH-TW) | No i18n framework | New: i18n implementation |
| Multi-currency (SGD, USD, HKD) | Wealth portal has multi-currency display | Extend to HKD |

### 4.5 Compliance & Regulatory

| Requirement | DXP Status | Action Required |
|------------|-----------|----------------|
| Data stored in Singapore | Cloud-agnostic | Deploy to ap-southeast-1 |
| MAS audit support | No audit module | New: audit export tools |
| 5-year record retention | No retention policy | New: retention policy + archival |
| PDPA consent management | Not implemented | New: consent tracking |

**NFR Coverage: 50%** — Auth, performance architecture, and horizontal scaling are ready. Security hardening, compliance, i18n, and audit trail are new work.

---

## Integration Requirements (Section 5)

| System | DXP Adapter Available | Effort |
|--------|----------------------|--------|
| 3rd Party Trading Platform (REST API) | Pattern exists (port+adapter) | 2-3 weeks — new `TradingPlatformAdapter` with 10 methods |
| CRM / Back-office | No CRM module | 1-2 weeks — depends on KGI's CRM choice |
| Email Service (SMTP/API) | BFF `notifications` module with SMTP adapter | 1-2 days — configure + add templates |
| Push Notification (FCM/APNs) | Not implemented | 1 week — new push adapter |
| SMS Gateway | Not implemented | 2-3 days — new adapter (Twilio/similar) |

---

## Deliverables Match (Section 7)

| # | Deliverable | DXP Can Provide | Notes |
|---|------------|----------------|-------|
| 1 | Technical Architecture Document | Yes | DXP architecture is documented; extend for KGI-specific |
| 2 | API Integration Specification | Yes | BFF generates OpenAPI/Swagger automatically |
| 3 | Database Schema Design | Yes | PostgreSQL schema + Entity model documented |
| 4 | Web Application (Client Portal) | Yes | Wealth portal as starting point |
| 5 | Mobile Application (iOS & Android) | No | New build required |
| 6 | Admin / Back-office Panel | No | New build required |
| 7 | UAT Plan & Scripts | Partial | 44 backend tests exist; need UAT plan |
| 8 | SOPs | No | New document |
| 9 | Source Code & Repository | Yes | Git repository with full history |
| 10 | Deployment & Handover | Partial | Docker + Makefile exist; need production runbook |

---

## Value-Add: AI Trading Advisor (Not in SOW)

The DXP platform includes a **conversational AI trading assistant** that KGI's SOW does not request. This can be offered as a differentiator:

| Capability | Status | Value to KGI |
|-----------|--------|-------------|
| AI-powered stock lookup with live Yahoo Finance prices | Built | Faster market research for retail traders |
| Paper trading order placement via chat | Built | Lower barrier for demo account users |
| Config-driven persona (swap JSON = new personality) | Built | KGI can customize the advisor voice |
| Entity cards with trade forms (buy/sell, qty, order type) | Built | Inline trading from chat interface |
| Session persistence across navigation | Built | Traders don't lose conversation context |

---

## Recommended Approach

### Phase 1: Demo Launch (Q2 2026) — 8 weeks

**Leverage DXP:**
- Wealth portal pages (Dashboard, Portfolio, Trading Terminal, Watchlist, Orders)
- `@dxp/ui` component library (30+ components)
- Keycloak auth (registration, login, 2FA)
- Kong API gateway
- BFF with market data adapter (Yahoo Finance)
- AI Trading Advisor

**Build New:**
- Registration flow with email OTP (Keycloak config + frontend screens)
- 3rd Party Trading Platform `Create Account` adapter (demo account provisioning)
- Basic profile capture form
- KGI branding/theming

### Phase 2: Live Launch (Q3 2026) — 10 weeks

**Build New:**
- KYC onboarding wizard (multi-step form, document upload)
- 3rd Party Trading Platform adapter (remaining 9 endpoints)
- Funding module (deposit/withdrawal screens, SWIFT flow)
- Admin panel (KYC review queue, client management) — recommend .NET for KGI IT ownership
- Email notification templates (KYC, funding events)
- Audit trail middleware

### Phase 3: Scale (Q4 2026) — 8 weeks

**Build New:**
- Mobile app (React Native — share BFF + business logic)
- Push notifications (FCM/APNs)
- i18n (English + Mandarin + Traditional Chinese)
- Production deployment (AWS ap-southeast-1, Multi-AZ)
- Load testing + performance optimization
- Security penetration test
- MAS compliance documentation

---

## Summary Matrix

| SOW Area | Ready | Needs Config | Needs New Build | Estimate |
|----------|-------|-------------|----------------|----------|
| Auth (Registration, 2FA, SSO) | 80% | 20% | 0% | 1 week |
| KYC Onboarding | 30% (UI components) | 0% | 70% | 3 weeks |
| Funding (Deposit/Withdrawal) | 20% (adapter pattern) | 0% | 80% | 2 weeks |
| Dashboard / Portfolio / Watchlist | 80% | 10% | 10% | 2 weeks |
| Trading Terminal + Orders | 70% | 10% | 20% | 2 weeks |
| 3rd Party Trading Platform Integration | 0% (pattern exists) | 0% | 100% | 3 weeks |
| Admin Panel | 0% | 0% | 100% | 6 weeks |
| Mobile App | 0% | 0% | 100% | 12 weeks |
| AI Trading Advisor | 90% | 10% | 0% | 1 week |
| Security & Compliance | 40% | 20% | 40% | 4 weeks |
| Push Notifications | 0% | 0% | 100% | 1 week |
| i18n (Multi-language) | 0% | 0% | 100% | 2 weeks |
