import React, { useState } from 'react';
import { AuthPanel } from '../components/AuthPanel';
import { ApiTester } from '../components/ApiTester';
import { adapterModules } from '../data/modules';

// ── Module grouping by domain ───────────────────────────────────────────────

const FHIR_NAMES = new Set([
  'Prior Auth (Da Vinci PAS)', 'Claims (FHIR EOB)', 'Eligibility (FHIR Coverage)',
  'Provider Directory', 'Risk Stratification (HCC)',
]);
const WEALTH_NAMES = new Set([
  'Market Data', 'FX Rates', 'Wealth Portfolio', 'Paper Trading', 'Broker Gateway',
]);
const RETAIL_NAMES = new Set([
  'Inventory', 'POS Connector', 'Project Planner', 'Loyalty',
]);
const AI_NAMES = new Set([
  'Conversational AI', 'Config Builder', 'Data Pipeline', 'Readiness Monitor',
]);

interface DomainGroup {
  label: string;
  badge?: string;
  badgeColor?: string;
  activeColor: string;
  modules: typeof adapterModules;
}

const domains: DomainGroup[] = [
  {
    label: 'Core Platform',
    activeColor: 'bg-[var(--dxp-brand)] text-white',
    modules: adapterModules.filter((m) => !FHIR_NAMES.has(m.name) && !WEALTH_NAMES.has(m.name) && !RETAIL_NAMES.has(m.name) && !AI_NAMES.has(m.name)),
  },
  {
    label: 'Healthcare — FHIR / Da Vinci',
    badge: 'FHIR R4',
    badgeColor: 'bg-teal-100 text-teal-700',
    activeColor: 'bg-teal-600 text-white',
    modules: adapterModules.filter((m) => FHIR_NAMES.has(m.name)),
  },
  {
    label: 'Wealth — APAC Markets',
    badge: 'Live data',
    badgeColor: 'bg-amber-100 text-amber-700',
    activeColor: 'bg-amber-600 text-white',
    modules: adapterModules.filter((m) => WEALTH_NAMES.has(m.name)),
  },
  {
    label: 'Retail — ACE Hardware',
    badge: 'New',
    badgeColor: 'bg-red-100 text-red-700',
    activeColor: 'bg-red-600 text-white',
    modules: adapterModules.filter((m) => RETAIL_NAMES.has(m.name)),
  },
  {
    label: 'Conversational AI Assistant',
    badge: 'Live demo',
    badgeColor: 'bg-purple-100 text-purple-700',
    activeColor: 'bg-purple-600 text-white',
    modules: adapterModules.filter((m) => AI_NAMES.has(m.name)),
  },
];

// ── Grouped tab bar ──────────────────────────────────────────────────────────

function GroupedTabs({ active, onChange }: { active: string; onChange: (name: string) => void }) {
  const inactiveCls = 'text-[var(--dxp-text-secondary)] hover:text-[var(--dxp-text)] hover:bg-[var(--dxp-border-light)]';
  const baseCls = 'px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer';

  return (
    <div className="space-y-3">
      {domains.map((domain, i) => (
        <div key={domain.label}>
          {i > 0 && <div className="border-t border-[var(--dxp-border-light)] mb-3" />}
          <div className="flex items-center gap-2 mb-2 px-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">
              {domain.label}
            </p>
            {domain.badge && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${domain.badgeColor}`}>
                {domain.badge}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {domain.modules.map((m) => (
              <button
                key={m.name}
                onClick={() => onChange(m.name)}
                className={`${baseCls} ${active === m.name ? `${domain.activeColor} shadow-sm` : inactiveCls}`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Domain banner ────────────────────────────────────────────────────────────

function getDomainBanner(name: string) {
  if (FHIR_NAMES.has(name)) return {
    color: 'text-teal-700 bg-teal-50 border-teal-200',
    text: 'FHIR R4 module — results come live from HAPI FHIR via the BFF adapter. Requires make up + pnpm seed:fhir.',
  };
  if (WEALTH_NAMES.has(name)) return {
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    text: 'Wealth module — connects to APAC market data providers. Set MARKET_DATA_ADAPTER=yahoo-finance for live quotes.',
  };
  if (RETAIL_NAMES.has(name)) return {
    color: 'text-red-700 bg-red-50 border-red-200',
    text: 'Retail module — built for the ACE Hardware portal. Uses mock adapters by default. Run ACE portal at localhost:4500.',
  };
  return null;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function Playground() {
  const [activeModule, setActiveModule] = useState(adapterModules[0].name);
  const [token, setToken] = useState<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    obtainedAt: number;
    decoded: Record<string, unknown>;
  } | null>(null);

  const currentModule = adapterModules.find((m) => m.name === activeModule) || adapterModules[0];
  const banner = getDomainBanner(activeModule);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--dxp-text)]">API Playground</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Interactive explorer for BFF adapter modules</p>
      </div>

      <div className="mb-6">
        <AuthPanel token={token} onTokenChange={setToken} />
      </div>

      {/* Grouped module selector */}
      <div className="mb-6 p-4 rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)]">
        <GroupedTabs active={activeModule} onChange={setActiveModule} />
      </div>

      {/* Domain-specific banner */}
      {banner && (
        <div className={`mb-4 flex items-center gap-2 text-xs border rounded-[var(--dxp-radius)] px-3 py-2 ${banner.color}`}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{banner.text}</span>
        </div>
      )}

      <ApiTester module={currentModule} accessToken={token?.accessToken} />
    </div>
  );
}
