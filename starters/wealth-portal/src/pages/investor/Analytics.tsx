import React from 'react';
import { Card, Chart, DataTable, type Column } from '@dxp/ui';
import type { Holding } from '../../data/mock-portfolio';
import { useRegion, useRegionMock } from '../../contexts/RegionContext';

export function Analytics() {
  const { region, formatCurrency } = useRegion();
  const {
    holdings,
    portfolioSummary: summary,
    transactions: fallbackTxns,
    ytdPerformance,
  } = useRegionMock();

  const sortedByPnl = [...holdings].sort((a, b) => b.baseCurrencyPnl - a.baseCurrencyPnl);
  const top3Holdings = [...holdings].sort((a, b) => b.baseCurrencyValue - a.baseCurrencyValue).slice(0, 3);
  const totalValue = summary.totalValue;

  // Worst-performer for max drawdown tag
  const worstHolding = sortedByPnl[sortedByPnl.length - 1];

  // YTD performance data — already shaped per region in region mock
  const ytdChartData = ytdPerformance.map((p) => ({
    month: p.month,
    portfolio: p.portfolio,
    [region.benchmarkLabel.toLowerCase()]: p.benchmark,
  }));
  const benchmarkKey = region.benchmarkLabel.toLowerCase();

  // Monthly dividend income from transaction history (in base currency)
  const dividendByMonth: Record<string, number> = {};
  fallbackTxns.filter((t) => t.side === 'dividend').forEach((t) => {
    const m = new Date(t.date).toLocaleDateString(region.currency.locale, { month: 'short' });
    dividendByMonth[m] = (dividendByMonth[m] ?? 0) + t.baseCurrencyAmount;
  });
  const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyDividends = monthLabels.map((m) => ({ month: m, amount: Math.round(dividendByMonth[m] ?? 0) }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Portfolio Analytics</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Performance attribution and risk analysis · Base {region.currency.code} {region.flag}</p>
      </div>

      {/* Performance chart */}
      <div className="mb-6">
        <Chart
          type="line"
          data={ytdChartData}
          xKey="month"
          yKeys={['portfolio', benchmarkKey]}
          title={`YTD Performance vs ${region.benchmarkLabel} Benchmark`}
          height={300}
        />
      </div>

      {/* Risk metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Portfolio Beta',   value: '0.87', desc: `vs ${region.benchmarkLabel} index`, color: 'text-blue-600' },
          { label: 'Sharpe Ratio',     value: '1.23', desc: 'Risk-adjusted return',             color: 'text-emerald-600' },
          { label: 'Max Drawdown',     value: `${worstHolding?.localPnlPct.toFixed(1) ?? '0'}%`, desc: worstHolding?.name ?? '—', color: 'text-rose-600' },
        ].map((m) => (
          <Card key={m.label} className="p-5">
            <p className="text-xs text-[var(--dxp-text-muted)] mb-1">{m.label}</p>
            <p className={`text-2xl font-bold font-mono ${m.color}`}>{m.value}</p>
            <p className="text-xs text-[var(--dxp-text-secondary)] mt-1">{m.desc}</p>
          </Card>
        ))}
      </div>

      {/* Attribution table */}
      <h2 className="text-base font-bold text-[var(--dxp-text)] mb-3">P&L Attribution by Position</h2>
      <Card className="overflow-x-auto mb-6">
        <DataTable
          columns={[
            {
              key: 'symbol',
              header: 'Symbol',
              render: (_v, h) => (
                <span className="font-mono font-bold text-[var(--dxp-text)]">{h.symbol}</span>
              ),
            },
            {
              key: 'country',
              header: 'Country',
              render: (_v, h) => (
                <span className="text-[var(--dxp-text-secondary)]">{h.country}</span>
              ),
            },
            {
              key: 'localPnlPct',
              header: 'Price Return',
              render: (_v, h) => (
                <span className={`font-semibold ${h.localPnlPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {h.localPnlPct >= 0 ? '+' : ''}{h.localPnlPct.toFixed(2)}%
                </span>
              ),
            },
            {
              key: 'fxPnl',
              header: 'FX Impact',
              render: (_v, h) => (
                <span className={`text-sm ${h.fxPnl < 0 ? 'text-rose-500' : h.fxPnl > 0 ? 'text-emerald-500' : 'text-[var(--dxp-text-muted)]'}`}>
                  {h.fxPnl === 0 ? 'No FX' : formatCurrency(h.fxPnl)}
                </span>
              ),
            },
            {
              key: 'baseCurrencyPnl',
              header: `Total ${region.currency.code} P&L`,
              render: (_v, h) => (
                <span className={`font-mono font-bold ${h.baseCurrencyPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {h.baseCurrencyPnl >= 0 ? '+' : ''}{formatCurrency(h.baseCurrencyPnl)}
                </span>
              ),
            },
            {
              key: 'contribution',
              header: 'Contribution',
              render: (_v, h) => {
                const contribution = summary.totalPnl !== 0 ? (h.baseCurrencyPnl / summary.totalPnl) * 100 : 0;
                return (
                  <span className={`font-semibold text-sm ${contribution >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {contribution >= 0 ? '+' : ''}{contribution.toFixed(1)}%
                  </span>
                );
              },
            },
          ] as Column<Holding>[]}
          data={sortedByPnl}
        />
      </Card>

      {/* Concentration */}
      <h2 className="text-base font-bold text-[var(--dxp-text)] mb-3">Concentration Risk</h2>
      <Card className="p-5 mb-6">
        <p className="text-sm text-[var(--dxp-text-secondary)] mb-4">
          Top 3 holdings represent{' '}
          <span className="font-bold text-[var(--dxp-text)]">
            {top3Holdings.reduce((s, h) => s + (h.baseCurrencyValue / totalValue) * 100, 0).toFixed(1)}%
          </span>{' '}
          of portfolio
        </p>
        <div className="space-y-2">
          {top3Holdings.map((h) => {
            const pct = (h.baseCurrencyValue / totalValue) * 100;
            return (
              <div key={h.id}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="font-semibold text-[var(--dxp-text)]">{h.symbol} · {h.name}</span>
                  <span className="text-[var(--dxp-text-secondary)]">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-[var(--dxp-border-light)] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Dividend income tracker */}
      <div className="mb-6">
        <Chart
          type="bar"
          data={monthlyDividends}
          xKey="month"
          yKeys={['amount']}
          title={`Dividend Income (${region.currency.code})`}
          height={300}
        />
      </div>
    </div>
  );
}
