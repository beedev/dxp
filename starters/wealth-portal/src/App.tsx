import React, { useState } from 'react';
import { PageLayout, type NavItem } from '@dxp/ui';
import { RegionProvider, useRegion, useRegionUser } from './contexts/RegionContext';
import { REGIONS, type RegionId } from './config/regions';

// Markets pages
import { MarketOverview } from './pages/markets/Overview';
import { FxRates } from './pages/markets/FxRates';
import { StockSearch } from './pages/markets/StockSearch';
import { MacroDashboard } from './pages/markets/MacroDashboard';
import { News } from './pages/markets/News';
import { Screener } from './pages/markets/Screener';
import { EarningsCalendar } from './pages/markets/EarningsCalendar';

// Investor pages
import { InvestorDashboard } from './pages/investor/Dashboard';
import { Portfolio } from './pages/investor/Portfolio';
import { TradingTerminal } from './pages/investor/TradingTerminal';
import { Orders } from './pages/investor/Orders';
import { Transactions } from './pages/investor/Transactions';
import { Analytics } from './pages/investor/Analytics';
import { Retirement } from './pages/investor/Retirement';
import { Goals } from './pages/investor/Goals';
import { TaxSummary } from './pages/investor/TaxSummary';
import { Alerts } from './pages/investor/Alerts';
import { Settings } from './pages/investor/Settings';

// Advisor pages
import { ClientList } from './pages/advisor/ClientList';
import { ClientDetail } from './pages/advisor/ClientDetail';
import { RebalanceHelper } from './pages/advisor/RebalanceHelper';
import { ProposalBuilder } from './pages/advisor/ProposalBuilder';

// ---------------------------------------------------------------------------
// Navigation definitions
// ---------------------------------------------------------------------------

// Active user persona chip — shows whose portfolio you're viewing
function UserChip() {
  const user = useRegionUser();
  const { region } = useRegion();
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dxp-border-light)] border border-[var(--dxp-border)]">
      <div className="w-9 h-9 shrink-0 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 font-bold text-xs">
        {user.initials}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-[var(--dxp-text)] truncate">{user.name}</p>
        <p className="text-[10px] text-[var(--dxp-text-muted)] truncate">
          {region.flag} {user.location} · {user.age} · {user.occupation}
        </p>
      </div>
    </div>
  );
}

// Region toggle — lives in the sidebar, uses the context
function RegionToggle() {
  const { regionId, setRegion } = useRegion();
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-2">Region</p>
      <div className="flex rounded-md overflow-hidden border border-[var(--dxp-border)]">
        {(Object.values(REGIONS) as typeof REGIONS[RegionId][]).map((r) => (
          <button
            key={r.id}
            onClick={() => setRegion(r.id)}
            aria-pressed={regionId === r.id}
            className={`flex-1 py-1.5 text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
              regionId === r.id
                ? 'bg-[var(--dxp-brand)] text-white'
                : 'bg-[var(--dxp-surface)] text-[var(--dxp-text-secondary)] hover:bg-[var(--dxp-border-light)]'
            }`}
          >
            <span>{r.flag}</span>
            {r.id}
          </button>
        ))}
      </div>
    </div>
  );
}

const marketsNav: NavItem[] = [
  { label: 'APAC Overview', href: '/' },
  { label: 'FX Rates', href: '/markets/fx' },
  { label: 'Stock Search', href: '/markets/search' },
  { label: 'Macro Dashboard', href: '/markets/macro' },
  { label: 'News', href: '/markets/news' },
  { label: 'Screener', href: '/markets/screener' },
  { label: 'Earnings Calendar', href: '/markets/calendar' },
];

function buildInvestorNav(retirementLabel: string): NavItem[] {
  return [
    { label: '← Markets', href: '/' },
    { label: 'Dashboard', href: '/investor' },
    { label: 'Portfolio', href: '/investor/portfolio' },
    { label: 'Trading Terminal', href: '/investor/terminal' },
    { label: 'Orders', href: '/investor/orders' },
    { label: 'Transactions', href: '/investor/transactions' },
    { label: 'Analytics', href: '/investor/analytics' },
    { label: `Retirement (${retirementLabel})`, href: '/investor/retirement' },
    { label: 'Goals', href: '/investor/goals' },
    { label: 'Tax Summary', href: '/investor/tax' },
    { label: 'Alerts', href: '/investor/alerts' },
    { label: 'Settings', href: '/investor/settings' },
  ];
}

const advisorNav: NavItem[] = [
  { label: '← Markets', href: '/' },
  { label: 'Client List', href: '/advisor' },
  { label: 'Client Detail', href: '/advisor/client' },
  { label: 'Rebalance', href: '/advisor/rebalance' },
  { label: 'Proposals', href: '/advisor/proposals' },
];

function navForPath(path: string, retirementLabel: string): NavItem[] {
  if (path.startsWith('/investor')) return buildInvestorNav(retirementLabel);
  if (path.startsWith('/advisor')) return advisorNav;
  return marketsNav;
}

// ---------------------------------------------------------------------------
// Page router
// ---------------------------------------------------------------------------

function renderPage(path: string, navigate: (p: string) => void) {
  switch (path) {
    // Markets
    case '/':                    return <MarketOverview />;
    case '/markets/fx':          return <FxRates />;
    case '/markets/search':      return <StockSearch />;
    case '/markets/macro':       return <MacroDashboard />;
    case '/markets/news':        return <News />;
    case '/markets/screener':    return <Screener />;
    case '/markets/calendar':    return <EarningsCalendar />;

    // Investor
    case '/investor':            return <InvestorDashboard onNavigate={navigate} />;
    case '/investor/portfolio':  return <Portfolio />;
    case '/investor/terminal':   return <TradingTerminal />;
    case '/investor/orders':     return <Orders />;
    case '/investor/transactions': return <Transactions />;
    case '/investor/analytics':  return <Analytics />;
    case '/investor/retirement': return <Retirement />;
    case '/investor/goals':      return <Goals />;
    case '/investor/tax':        return <TaxSummary />;
    case '/investor/alerts':     return <Alerts />;
    case '/investor/settings':   return <Settings />;

    // Advisor
    case '/advisor':             return <ClientList onNavigate={navigate} />;
    case '/advisor/client':      return <ClientDetail />;
    case '/advisor/rebalance':   return <RebalanceHelper />;
    case '/advisor/proposals':   return <ProposalBuilder />;

    default:
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-[var(--dxp-text)]">Page Not Found</h1>
          <p className="mt-2 text-[var(--dxp-text-secondary)]">The page at "{path}" does not exist.</p>
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// Mode switcher
// ---------------------------------------------------------------------------

type PortalSection = 'markets' | 'investor' | 'advisor';

function SectionSwitcher({
  current,
  onChange,
}: {
  current: PortalSection;
  onChange: (s: PortalSection) => void;
}) {
  const sections: { key: PortalSection; label: string; icon: string }[] = [
    { key: 'markets', label: 'Markets', icon: '📊' },
    { key: 'investor', label: 'Investor', icon: '💼' },
    { key: 'advisor', label: 'Advisor', icon: '🏦' },
  ];

  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-2">Portal Section</p>
      <div className="flex flex-col gap-1">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors text-left ${
              current === s.key
                ? 'bg-[var(--dxp-brand)] text-white'
                : 'text-[var(--dxp-text-secondary)] hover:text-[var(--dxp-text)] hover:bg-[var(--dxp-border-light)]'
            }`}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const defaultPathBySection: Record<PortalSection, string> = {
  markets: '/',
  investor: '/investor',
  advisor: '/advisor',
};

function AppInner() {
  const { region } = useRegion();
  const [currentPath, setCurrentPath] = useState('/');

  const currentSection: PortalSection =
    currentPath.startsWith('/investor') ? 'investor' :
    currentPath.startsWith('/advisor') ? 'advisor' :
    'markets';

  const handleSectionChange = (section: PortalSection) => {
    setCurrentPath(defaultPathBySection[section]);
  };

  const nav = navForPath(currentPath, region.retirement.scheme).map((item) => ({
    ...item,
    active: item.href === currentPath,
  }));

  const appName = `DXP Wealth · ${region.flag} ${region.name}`;

  return (
    <PageLayout
      appName={appName}
      navItems={nav}
      onNavigate={setCurrentPath}
      userMenu={
        <div className="space-y-4">
          <UserChip />
          <RegionToggle />
          <SectionSwitcher current={currentSection} onChange={handleSectionChange} />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-2">Dev Tools</p>
            <div className="space-y-1">
              {[
                { label: 'Insurance Portal', href: 'http://localhost:4200' },
                { label: 'Payer Portal', href: 'http://localhost:4300' },
                { label: 'Swagger', href: '/api/docs' },
                { label: 'Storybook', href: '/storybook/index.html' },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-xs text-[var(--dxp-text-secondary)] hover:text-[var(--dxp-brand)] py-0.5"
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      }
    >
      {renderPage(currentPath, setCurrentPath)}
    </PageLayout>
  );
}

export function App() {
  return (
    <RegionProvider>
      <AppInner />
    </RegionProvider>
  );
}
