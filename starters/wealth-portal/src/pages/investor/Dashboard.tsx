import React from 'react';
import { Card, StatsDisplay } from '@dxp/ui';
import { useApacIndices, useApacNews } from '@dxp/sdk-react';
import { APAC_INDICES } from '../../data/apac-markets';
import { useRegion, useRegionMock, useRegionUser } from '../../contexts/RegionContext';

const COUNTRY_FLAGS: Record<string, string> = {
  Singapore: '🇸🇬', 'Hong Kong': '🇭🇰', Japan: '🇯🇵', Australia: '🇦🇺', India: '🇮🇳',
};

const SECTOR_COLORS: Record<string, string> = {
  Financials: 'bg-blue-400',
  Technology: 'bg-purple-400',
  Materials: 'bg-amber-400',
  REITs: 'bg-emerald-400',
  'Consumer Discretionary': 'bg-rose-400',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface DashboardProps {
  onNavigate: (path: string) => void;
}

export function InvestorDashboard({ onNavigate }: DashboardProps) {
  const { region, formatCurrency } = useRegion();
  const user = useRegionUser();
  const {
    holdings,                    // region mock is the source of truth — BFF has no multi-region portfolios
    news: regionNews,
    portfolioSummary: summary,
    retirementBalances,
  } = useRegionMock();

  const totalNetWorth =
    summary.totalValue + summary.cashBalance + retirementBalances.oa + retirementBalances.sa + retirementBalances.ma;

  const sortedHoldings = [...holdings].sort((a, b) => b.totalPnlPct - a.totalPnlPct);
  const topMovers = sortedHoldings.slice(0, 3);
  const worstMover = sortedHoldings[sortedHoldings.length - 1];

  // Live market pulse — region-specific indices
  const { data: liveIndices } = useApacIndices({ refetchInterval: 5 * 60 * 1000 });
  const allIndices = liveIndices ?? APAC_INDICES;
  const quickIndices = allIndices.filter((idx) => region.pulseIndices.includes(idx.symbol));

  // Live news digest — top 3 headlines, fall back to region-specific mock news
  const { data: liveNews } = useApacNews({
    country: region.newsDefaultCountry,
    pageSize: 3,
    refetchInterval: 15 * 60 * 1000,
  });
  const latestNews = (liveNews && liveNews.length > 0 ? liveNews : regionNews).slice(0, 3);

  const totalPct = summary.bySector.reduce((a, s) => a + s.pct, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Portfolio Dashboard</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">{user.name} · {user.occupation} · {user.location} {region.flag} · Base {region.currency.code}</p>
      </div>

      {/* Net worth hero */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-amber-700 to-amber-500 text-white">
        <p className="text-sm font-semibold opacity-80 mb-1">Total Net Worth (incl. {region.retirement.scheme})</p>
        <p className="text-4xl font-bold font-mono mb-2">{formatCurrency(totalNetWorth)}</p>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-semibold ${summary.dayChange >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
            {summary.dayChange >= 0 ? '+' : ''}{formatCurrency(summary.dayChange)} today ({summary.dayChangePct.toFixed(2)}%)
          </span>
        </div>
      </Card>

      {/* Quick stats */}
      <div className="mb-8">
        <StatsDisplay
          currency={region.currency.code}
          locale={region.currency.locale}
          stats={[
            { label: 'Invested',     value: summary.totalValue,   format: 'currency' },
            { label: 'Cash Balance', value: summary.cashBalance,  format: 'currency' },
            { label: `${region.retirement.scheme} Total`, value: retirementBalances.oa + retirementBalances.sa + retirementBalances.ma, format: 'currency' },
            { label: 'Unrealised P&L', value: summary.totalPnl,   format: 'currency', delta: { value: summary.totalPnlPct, label: 'total return' } },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* APAC Market Pulse */}
        <Card className="p-5">
          <h2 className="text-base font-bold text-[var(--dxp-text)] mb-4">{region.flag} Market Pulse</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickIndices.map((idx) => (
              <div key={idx.symbol} className="text-center">
                <p className="text-lg mb-0.5">{idx.flag}</p>
                <p className="text-[10px] font-bold text-[var(--dxp-text-secondary)] truncate">{idx.exchange}</p>
                <p className="text-xs font-bold font-mono text-[var(--dxp-text)]">
                  {idx.value.toLocaleString(region.currency.locale, { maximumFractionDigits: 0 })}
                </p>
                <p className={`text-[10px] font-semibold ${idx.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {idx.changePercent >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Allocation Donut */}
        <Card className="p-5">
          <h2 className="text-base font-bold text-[var(--dxp-text)] mb-4">Portfolio by Sector</h2>
          <div className="space-y-2">
            {summary.bySector.map((s) => (
              <div key={s.sector}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-[var(--dxp-text-secondary)]">{s.sector}</span>
                  <span className="font-semibold text-[var(--dxp-text)]">{s.pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-[var(--dxp-border-light)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${SECTOR_COLORS[s.sector] ?? 'bg-gray-400'}`}
                    style={{ width: `${(s.pct / (totalPct || 100)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top movers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <h2 className="text-base font-bold text-[var(--dxp-text)] mb-3">Top Movers</h2>
          <div className="space-y-2">
            {[...topMovers, worstMover].map((h) => (
              <Card key={h.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{COUNTRY_FLAGS[h.country] ?? '🌏'}</span>
                  <div>
                    <p className="text-sm font-bold text-[var(--dxp-text)]">{h.symbol}</p>
                    <p className="text-xs text-[var(--dxp-text-muted)]">{h.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${h.totalPnlPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {h.totalPnlPct >= 0 ? '+' : ''}{h.totalPnlPct.toFixed(2)}%
                  </p>
                  <p className="text-xs text-[var(--dxp-text-muted)]">{formatCurrency(h.baseCurrencyValue)}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-base font-bold text-[var(--dxp-text)] mb-3">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Add Transaction', path: '/investor/transactions', icon: '📝' },
              { label: 'Place Order', path: '/investor/terminal', icon: '📊' },
              { label: 'Set Alert', path: '/investor/alerts', icon: '🔔' },
              { label: 'View Portfolio', path: '/investor/portfolio', icon: '💼' },
            ].map((action) => (
              <button
                key={action.path}
                onClick={() => onNavigate(action.path)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--dxp-border)] bg-[var(--dxp-surface)] hover:bg-amber-50 hover:border-amber-300 text-left transition-colors"
              >
                <span className="text-lg">{action.icon}</span>
                <span className="text-sm font-semibold text-[var(--dxp-text)]">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* News digest */}
      <h2 className="text-base font-bold text-[var(--dxp-text)] mb-3">News Digest</h2>
      <div className="space-y-3">
        {latestNews.map((n, i) => (
          <Card key={`${n.id}-${i}`} className="p-4 flex items-start gap-3">
            <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${n.sentiment === 'positive' ? 'bg-emerald-500' : n.sentiment === 'negative' ? 'bg-rose-500' : 'bg-gray-400'}`} />
            <div>
              {n.url ? (
                <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[var(--dxp-text)] leading-snug hover:text-amber-700 hover:underline">{n.title}</a>
              ) : (
                <p className="text-sm font-semibold text-[var(--dxp-text)] leading-snug">{n.title}</p>
              )}
              <p className="text-xs text-[var(--dxp-text-muted)] mt-0.5">{n.source} · {timeAgo(n.publishedAt)}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
