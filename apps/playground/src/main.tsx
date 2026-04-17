import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, Tabs, Badge } from '@dxp/ui';
import { AuthPanel } from './components/AuthPanel';
import { ApiTester } from './components/ApiTester';
import { adapterModules, type ModuleDomain } from './data/modules';
import './index.css';

// Group modules by domain
const domainOrder: ModuleDomain[] = [
  'Core Platform',
  'Healthcare — FHIR / Da Vinci',
  'Wealth — APAC Markets',
  'Retail — ACE Hardware',
  'Conversational AI Assistant',
];

const domainBadges: Partial<Record<ModuleDomain, string>> = {
  'Healthcare — FHIR / Da Vinci': 'FHIR R4',
  'Conversational AI Assistant': 'Live demo',
};

const modulesByDomain = domainOrder.map((domain) => ({
  domain,
  badge: domainBadges[domain],
  modules: adapterModules.filter((m) => m.domain === domain),
}));

function App() {
  const [activeModule, setActiveModule] = useState(adapterModules[0].name);
  const [token, setToken] = useState<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    obtainedAt: number;
    decoded: Record<string, unknown>;
  } | null>(null);

  const currentModule = adapterModules.find((m) => m.name === activeModule) || adapterModules[0];

  return (
    <div style={{ fontFamily: 'var(--dxp-font)', background: 'var(--dxp-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--dxp-border)', background: 'var(--dxp-surface)', padding: '1rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '80rem', margin: '0 auto' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dxp-text)' }}>DXP API Playground</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--dxp-text-secondary)' }}>
              Interactive explorer for BFF adapter modules
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--dxp-text-muted)' }}>
            <span>BFF: <code style={{ color: 'var(--dxp-brand)' }}>localhost:4201</code></span>
            <span>Swagger: <a href="http://localhost:4201/api/docs" target="_blank" rel="noreferrer" style={{ color: 'var(--dxp-brand)' }}>docs</a></span>
          </div>
        </div>
      </header>

      {/* Auth Panel */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 2rem 0' }}>
        <AuthPanel token={token} onTokenChange={setToken} />
      </div>

      {/* Domain-grouped module tabs */}
      <div style={{ background: 'var(--dxp-surface)', padding: '0.75rem 2rem 0', marginTop: '1.5rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          {modulesByDomain.map(({ domain, badge, modules }) => (
            <div key={domain} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dxp-text-muted)' }}>
                  {domain}
                </span>
                {badge && <Badge variant="info">{badge}</Badge>}
              </div>
              <Tabs
                tabs={modules.map((m) => ({ key: m.name, label: m.name }))}
                active={modules.some((m) => m.name === activeModule) ? activeModule : ''}
                onChange={setActiveModule}
                variant="pill"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem' }}>
        <ApiTester module={currentModule} accessToken={token?.accessToken} />
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
