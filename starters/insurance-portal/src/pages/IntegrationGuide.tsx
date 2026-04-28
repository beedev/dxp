import React, { useState } from 'react';
import { Card, CardContent, CardHeader, Badge, DataTable, type Column } from '@dxp/ui';

interface PhaseStep {
  title: string;
  detail: string;
  code: string;
  tags: string[];
  highlight?: boolean;
  note?: string;
}

interface Phase {
  day: string;
  title: string;
  effort: string;
  effortVariant: 'success' | 'brand' | 'warning' | 'info';
  steps: PhaseStep[];
}

const phases: Phase[] = [
  {
    day: 'Day 1',
    title: 'Auth + Cloud Infrastructure',
    effort: '1 day',
    effortVariant: 'success' as const,
    steps: [
      {
        title: 'Keycloak ↔ Customer IdP',
        detail: 'Point Keycloak at the customer\'s identity provider via SAML or OIDC federation. No code — Keycloak admin config only.',
        code: `# infra/keycloak/dxp-realm.json
KEYCLOAK_REALM=customer-realm
KEYCLOAK_URL=https://sso.customer.com`,
        tags: ['Azure AD', 'Okta', 'Ping', 'LDAP'],
        note: 'Role mapping (member, provider, care-manager) from their group structure: 2–4 hours.',
      },
      {
        title: 'Cloud Storage',
        detail: 'Set STORAGE_PROVIDER and S3/Azure credentials. The StoragePort adapter swaps with one env var.',
        code: `STORAGE_PROVIDER=s3          # or azure
S3_BUCKET=customer-documents
S3_REGION=us-east-1`,
        tags: ['AWS S3', 'Azure Blob', 'MinIO'],
      },
      {
        title: 'Email / Notifications',
        detail: 'Point the NotificationPort at the customer\'s email provider.',
        code: `NOTIFICATION_ADAPTER=sendgrid
SENDGRID_API_KEY=SG.xxxx`,
        tags: ['SendGrid', 'SMTP', 'Exchange'],
      },
    ],
  },
  {
    day: 'Week 1',
    title: 'FHIR Server + Live Data',
    effort: '3–4 days',
    effortVariant: 'brand' as const,
    steps: [
      {
        title: 'Scenario A — Customer already runs FHIR R4',
        detail: 'One env var. All 9 FHIR adapters (prior auth, claims, eligibility, provider directory, risk, care plan, quality, consent, PDex) immediately read live data.',
        code: `FHIR_BASE_URL=https://fhir.customer-epic.com/api/FHIR/R4
FHIR_AUTH_TOKEN=<SMART-on-FHIR token>`,
        tags: ['Epic', 'Cerner', 'Azure Health Data', 'AWS HealthLake'],
        highlight: true,
      },
      {
        title: 'Scenario B — No FHIR server yet',
        detail: 'Keep HAPI FHIR in Docker (already in docker-compose.yml). Write ETL scripts to push legacy data into FHIR format. The seed scripts in apps/bff/src/seed/ are the template.',
        code: `# docker-compose already includes HAPI FHIR on port 8090
make up
pnpm seed:fhir   # replace faker data with customer extract`,
        tags: ['Legacy mainframe', 'HL7 v2', 'CSV extract'],
        note: 'ETL is the 2-week path. The portal itself does not change.',
      },
      {
        title: 'Portal Branding',
        detail: 'Theme tokens, logo, app name. No component changes — CSS variables only.',
        code: `// starters/payer-portal/src/main.tsx
theme={{ brand: '#005EB8', brandLight: '#E8F2FB' }}
appName="BlueCross Member Portal"`,
        tags: ['Colors', 'Logo', 'Fonts'],
      },
    ],
  },
  {
    day: 'Day 2',
    title: 'Payments + Agentic Checkout (UCP)',
    effort: '½ day',
    effortVariant: 'success' as const,
    steps: [
      {
        title: 'Stripe — drop-in via PaymentsPort',
        detail:
          'Get sk_test_* and pk_test_* from dashboard.stripe.com → set 3 env vars. The PaymentsPort (apps/bff/src/modules/payments/) already has a StripeAdapter. UCP Checkout automatically uses whatever PaymentsPort provider is active — no per-provider UCP code.',
        code: `PAYMENTS_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_xxx           # server-side; never exposed
STRIPE_PUBLISHABLE_KEY=pk_test_xxx      # browser-safe; served via /api/v1/ucp/public-config

# UCP Checkout (defaults to payments-backed adapter):
UCP_ADAPTER=payments-backed`,
        tags: ['Stripe Elements', 'PaymentIntents', 'pk_test_*', 'sk_test_*'],
        highlight: true,
      },
      {
        title: 'Embedded card capture in your portal',
        detail:
          'Drop the @dxp/sdk-react <UcpPaymentPage> composite into any cart page. Customer types card on a Stripe-managed iframe (PCI scope stays with Stripe). On success, completeCheckoutSession returns the real Stripe pi_* and ord_* — visible immediately on dashboard.stripe.com/test/payments.',
        code: `import { useUcpCreateSession, useUcpUpdateSession,
         useUcpCompleteSession, UcpPaymentPage } from '@dxp/sdk-react';

const session = await create.mutateAsync({ currency:'USD', line_items:[...] });
const updated = await update.mutateAsync({ id:session.id, patch:{buyer, fulfillment} });

<UcpPaymentPage
  clientSecret={updated.payment.client_secret}
  totalCents={updated.totals.find(t=>t.type==='total').amount}
  onSuccess={(piId) => complete.mutateAsync({ id:session.id, body:{...} })}
/>`,
        tags: ['useUcpCreateSession', 'UcpPaymentPage', 'Stripe Elements'],
      },
      {
        title: 'Agentic checkout — chat / ChatGPT / external agents',
        detail:
          'Same UCP endpoints work over REST, MCP/JSON-RPC, or as a ChatGPT Custom GPT Action via /api/v1/ucp/openapi.json. Hosted-redirect (payment_url) lets agents hand the customer a Stripe-hosted card form when they have no UI to render. Discovery doc at /.well-known/ucp.',
        code: `# REST + Custom GPT Action
GET /api/v1/ucp/openapi.json     # import URL into a ChatGPT GPT

# JSON-RPC for MCP-aware clients (Claude desktop, agent frameworks)
POST /api/v1/ucp/mcp
{"jsonrpc":"2.0","id":1,"method":"create_checkout","params":{...}}

# Discovery
GET /.well-known/ucp`,
        tags: ['UCP', 'MCP', 'OpenAPI 3.1', 'agentic commerce'],
      },
      {
        title: 'Different region / processor — adapter swap, no UCP edit',
        detail:
          'India → Razorpay. LATAM → MercadoPago. China → Alipay. Implement PaymentsPort in apps/bff/src/modules/payments/adapters/<provider>.adapter.ts → add a case in payments.module.ts → flip PAYMENTS_PROVIDER. UCP Checkout, the chat tool, the portal cart, and ChatGPT Action all keep working unchanged.',
        code: `# 1. New adapter file:
class RazorpayAdapter extends PaymentsPort { ... }

# 2. Register in payments.module.ts useFactory:
case 'razorpay': return new RazorpayAdapter(config);

# 3. .env:
PAYMENTS_PROVIDER=razorpay
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# UCP picks it up automatically — no code change in apps/bff/src/modules/ucp-checkout/`,
        tags: ['Razorpay', 'MercadoPago', 'Alipay', 'one env var'],
      },
    ],
  },
  {
    day: 'Week 2–3',
    title: 'Custom Adapters (if needed)',
    effort: '1–2 days each',
    effortVariant: 'warning' as const,
    steps: [
      {
        title: 'Non-standard systems',
        detail: 'Any system not covered by existing adapters gets a new adapter class implementing the relevant Port. The portal and SDK hooks never change.',
        code: `// Example: custom claims adjudication system
@Injectable()
export class CustomerClaimsAdapter extends ClaimsPort {
  async listClaims(tenantId, memberId, filters) {
    // call customer's internal API
    return this.mapToClaimSummary(response);
  }
}
// Module factory: CLAIMS_ADAPTER=customer → CustomerClaimsAdapter`,
        tags: ['Custom claims', 'Custom PA workflow', 'Legacy APIs'],
      },
      {
        title: 'Generic REST integrations',
        detail: 'For arbitrary customer REST APIs (Salesforce, billing, etc.) the Integration module handles it with JSON config — no new adapter code needed.',
        code: `INTEGRATIONS_CONFIG='[
  { "name": "salesforce", "baseUrl": "https://myorg.salesforce.com", "authType": "oauth2" },
  { "name": "billing",    "baseUrl": "https://billing.internal/api", "authType": "bearer" }
]'`,
        tags: ['Salesforce', 'Billing', 'Custom REST'],
      },
    ],
  },
  {
    day: 'Week 3–4',
    title: 'Hardening + Production',
    effort: '1 week',
    effortVariant: 'info' as const,
    steps: [
      {
        title: 'RBAC tuning',
        detail: 'Fine-tune role-based access per customer org structure. Roles are enforced by Keycloak JWT claims + NestJS @Roles() guards on every BFF endpoint.',
        code: `// Controller already guards by role — tune the roles:
@Roles('pa-reviewer', 'care-manager')
@Get('queue')
reviewQueue() { ... }`,
        tags: ['Keycloak roles', 'JWT claims', 'RBAC'],
      },
      {
        title: 'Kong gateway config',
        detail: 'Update Kong routes for the customer\'s domain, rate limits, and any additional auth plugins.',
        code: `# infra/kong/kong.yml
services:
  - name: bff
    url: http://bff:4201
    routes:
      - name: bff-route
        hosts: ["portal.customer.com"]`,
        tags: ['Rate limiting', 'Custom domain', 'TLS'],
      },
      {
        title: 'Load test + security review',
        detail: 'Run k6 load tests against BFF endpoints. Security scan on FHIR data flows, JWT validation, and CORS config.',
        code: `# k6 load test
k6 run --vus 50 --duration 60s scripts/load-test.js`,
        tags: ['k6', 'OWASP', 'Pen test'],
      },
    ],
  },
  {
    day: 'Day 6',
    title: 'Conversational AI Assistant',
    effort: '1 day',
    effortVariant: 'brand' as const,
    steps: [
      {
        title: 'Install @dxp/ai-assistant',
        detail: 'Add the shared package to your portal. It provides all AI components, pages, and the WebSocket hook — zero copy-paste.',
        code: `// package.json
"@dxp/ai-assistant": "workspace:*"

// tailwind.config.js — add to content array
'../../packages/ai-assistant/src/**/*.{ts,tsx}'`,
        tags: ['@dxp/ai-assistant', 'workspace dep'],
      },
      {
        title: 'Add routes to your portal',
        detail: 'Import from @dxp/ai-assistant and wire into your router. 5 lines for customer + 4 manager pages.',
        code: `import {
  AgenticAssistant, AgenticPlayground,
  AgentReadiness, ConfigBuilder, DataPipeline,
} from '@dxp/ai-assistant';

// Customer: <AgenticAssistant />
// Manager: <AgenticPlayground />, <AgentReadiness />,
//          <ConfigBuilder />, <DataPipeline />`,
        tags: ['React', '5 imports', 'drop-in'],
      },
      {
        title: 'Setup the agent backend',
        detail: 'Run the one-command setup script. Creates Python venv, installs LangGraph + OpenAI deps, initializes PostgreSQL with pgvector + Apache AGE extensions.',
        code: `cd apps/conversational-assistant
./setup.sh   # venv + deps + DB + sample data

# Start
pnpm nx run conversational-assistant:dev`,
        tags: ['Python', 'LangGraph', 'pgvector', 'AGE'],
      },
      {
        title: 'Configure your persona',
        detail: 'Use the Config Builder UI to describe your domain in natural language. The LLM generates voice, clarifiers, playbooks, and UI copy. Or write JSON manually.',
        code: `# Via UI: Manager → Config Builder → describe → generate → save

# Via CLI:
curl -X POST localhost:8002/api/agent-configs/generate \\
  -d '{"description":"...", "portal_domain":"retail"}'

# Switch: AGENTIC_CONFIG_ID=my-config`,
        tags: ['LLM-generated', 'JSON config', 'domain-scoped'],
      },
      {
        title: 'Load your catalog data',
        detail: 'Upload via the Data Pipeline UI or CLI. Config-driven: define field mappings + embedding template → run ingestion → enrich graph. Check readiness score.',
        code: `# Via UI: Manager → Data Pipeline → upload → ingest → enrich

# Via CLI:
python -m src.db.ingest my-config
python -m src.db.enrich_graph

# Verify:
curl localhost:8002/api/readiness  # target ≥ 90`,
        tags: ['pgvector', 'OpenAI embeddings', 'Apache AGE'],
        highlight: true,
      },
    ],
  },
];

const adapterMatrix = [
  { system: 'AWS S3 / Azure Blob',         adapter: 'StoragePort → env var swap',           effort: '2 hours',  code: true },
  { system: 'SendGrid / SMTP',             adapter: 'NotificationPort → env var swap',       effort: '2 hours',  code: true },
  { system: 'Azure AD users',              adapter: 'IdentityPort → AzureAdAdapter (built)', effort: '½ day',    code: false },
  { system: 'SharePoint documents',        adapter: 'DocumentPort → SharePointAdapter (built)', effort: '½ day', code: false },
  { system: 'Salesforce / custom REST',    adapter: 'IntegrationPort → JSON config',         effort: '2 hours',  code: false },
  { system: 'Epic / Cerner FHIR',          adapter: 'FhirClient → FHIR_BASE_URL env var',    effort: '½ day',    code: false },
  { system: 'Custom claims system',        adapter: 'ClaimsPort → new adapter',              effort: '2–3 days', code: true },
  { system: 'Custom PA workflow',          adapter: 'PriorAuthPort → new adapter',           effort: '2–3 days', code: true },
  { system: 'Legacy LDAP / on-prem IdP',  adapter: 'Keycloak federation',                   effort: '1 day',    code: false },
  { system: 'AI Conversation Assistant', adapter: 'AgenticPort → @dxp/ai-assistant package', effort: '1 day',    code: false },
  { system: 'Custom AI backend',        adapter: 'AgenticPort → new adapter (Vertex/Bedrock)', effort: '2–3 days', code: true },
];

type AdapterRow = typeof adapterMatrix[0];

const adapterMatrixColumns: Column<AdapterRow>[] = [
  { key: 'system', header: 'Customer System' },
  {
    key: 'adapter',
    header: 'DXP Adapter',
    render: (v) => <span className="font-mono text-xs text-[var(--dxp-text-secondary)]">{String(v)}</span>,
  },
  {
    key: 'effort',
    header: 'Effort',
    render: (v) => {
      const val = String(v);
      const variant = val.includes('hours') ? 'success' : (val.includes('day') && !val.includes('days')) ? 'info' : 'warning';
      return <Badge variant={variant}>{val}</Badge>;
    },
  },
  {
    key: 'code',
    header: 'Code?',
    render: (v) => (
      <span className={`text-xs font-bold ${v ? 'text-[var(--dxp-warning)]' : 'text-[var(--dxp-success)]'}`}>
        {v ? 'New adapter' : 'Config only'}
      </span>
    ),
  },
];

const timelines = [
  {
    scenario: 'Customer has FHIR R4 + Azure AD + S3',
    total: '~1 week',
    variant: 'success' as const,
    note: 'Env vars + Keycloak config. Portal pages unchanged.',
  },
  {
    scenario: 'Customer has FHIR R4, custom IdP, custom storage',
    total: '2–3 weeks',
    variant: 'brand' as const,
    note: '1–2 adapter writes + IdP federation work.',
  },
  {
    scenario: 'No FHIR, legacy mainframe, on-prem everything',
    total: '6–8 weeks',
    variant: 'warning' as const,
    note: 'ETL to FHIR + 2–3 custom adapters. Portal still unchanged.',
  },
];

interface IntegrationGuideProps {
  onNavigate?: (path: string) => void;
}

export function IntegrationGuide({ onNavigate }: IntegrationGuideProps) {
  const [openPhase, setOpenPhase] = useState<string | null>('Day 1');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <button
          onClick={() => onNavigate?.('/')}
          className="text-xs text-[var(--dxp-text-muted)] hover:text-[var(--dxp-brand)] mb-4 flex items-center gap-1 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Home
        </button>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)] mb-3">
          Customer Integration Guide
        </h1>
        <p className="text-[var(--dxp-text-secondary)] text-base leading-relaxed max-w-2xl">
          Steps and timeline to wire DXP into a customer environment. All integration work lives in the BFF adapter layer — portal pages, UI components, and SDK hooks never change.
        </p>
      </div>

      {/* Key insight callout */}
      <Card className="mb-8 border-[var(--dxp-brand)] bg-[var(--dxp-brand-light)]">
        <CardContent className="p-4">
          <p className="text-sm font-bold text-[var(--dxp-brand)] mb-1">The core principle</p>
          <p className="text-sm text-[var(--dxp-text-secondary)] leading-relaxed">
            Every integration is an <strong>adapter swap</strong> — one env var change, zero frontend changes.
            The Port contract isolates the portal from the backend system. Swap <code className="font-mono text-xs bg-white px-1 py-0.5 rounded">FHIR_BASE_URL</code>, swap <code className="font-mono text-xs bg-white px-1 py-0.5 rounded">CLAIMS_ADAPTER</code>, swap <code className="font-mono text-xs bg-white px-1 py-0.5 rounded">STORAGE_PROVIDER</code> — the portal renders identically.
          </p>
        </CardContent>
      </Card>

      {/* Timeline summary */}
      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-4">Timeline by Scenario</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {timelines.map((t) => (
            <Card key={t.scenario}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={t.variant}>{t.total}</Badge>
                </div>
                <p className="text-sm font-bold text-[var(--dxp-text)] mb-1">{t.scenario}</p>
                <p className="text-xs text-[var(--dxp-text-muted)]">{t.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Phase accordion */}
      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-4">Integration Phases</h2>
        <div className="space-y-3">
          {phases.map((phase) => (
            <Card key={phase.day} className="overflow-hidden">
              <button
                className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-[var(--dxp-border-light)] transition-colors"
                onClick={() => setOpenPhase(openPhase === phase.day ? null : phase.day)}
              >
                <div className="flex items-center gap-3">
                  <Badge variant={phase.effortVariant}>{phase.day}</Badge>
                  <span className="font-bold text-sm text-[var(--dxp-text)]">{phase.title}</span>
                  <span className="text-xs text-[var(--dxp-text-muted)]">{phase.effort}</span>
                </div>
                <svg
                  className={`w-4 h-4 text-[var(--dxp-text-muted)] transition-transform ${openPhase === phase.day ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openPhase === phase.day && (
                <div className="border-t border-[var(--dxp-border-light)] divide-y divide-[var(--dxp-border-light)]">
                  {phase.steps.map((step, i) => (
                    <div key={i} className={`p-5 ${step.highlight ? 'bg-teal-50' : ''}`}>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="text-sm font-bold text-[var(--dxp-text)]">{step.title}</h4>
                        {step.highlight && <Badge variant="success">Fastest path</Badge>}
                      </div>
                      <p className="text-sm text-[var(--dxp-text-secondary)] leading-relaxed mb-3">{step.detail}</p>
                      {step.code && (
                        <pre className="rounded-[var(--dxp-radius)] bg-gray-900 text-green-300 px-4 py-3 font-mono text-xs overflow-auto whitespace-pre mb-3">
{step.code}
                        </pre>
                      )}
                      {step.tags && (
                        <div className="flex flex-wrap gap-1.5">
                          {step.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--dxp-border-light)] text-[var(--dxp-text-muted)] font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {step.note && (
                        <p className="mt-3 text-xs text-[var(--dxp-text-muted)] italic">{step.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Adapter matrix */}
      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-4">Adapter Integration Matrix</h2>
        <DataTable
          columns={adapterMatrixColumns}
          data={adapterMatrix}
        />
      </div>

      {/* Footer note */}
      <Card className="border-dashed">
        <CardContent className="p-5 text-center">
          <p className="text-sm text-[var(--dxp-text-secondary)]">
            <strong className="text-[var(--dxp-text)]">The portal pages are already done.</strong>
            {' '}100% of integration work is in the BFF adapter layer.
            Writing a new adapter typically takes 1–3 days and follows the same pattern as
            <code className="font-mono text-xs bg-[var(--dxp-border-light)] px-1.5 py-0.5 rounded mx-1">davinci-pas.adapter.ts</code> or
            <code className="font-mono text-xs bg-[var(--dxp-border-light)] px-1.5 py-0.5 rounded mx-1">fhir-claim.adapter.ts</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
