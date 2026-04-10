import React, { useState } from 'react';
import { Card, Tabs, DataTable, Badge, type Column } from '@dxp/ui';
import type { Holding } from '../../data/mock-portfolio';
import { useRegion, useRegionMock, useRegionUser } from '../../contexts/RegionContext';

type Tab = 'holdings' | 'sector' | 'country' | 'currency';

const COUNTRY_FLAGS: Record<string, string> = {
  Singapore: '🇸🇬', 'Hong Kong': '🇭🇰', Japan: '🇯🇵', Australia: '🇦🇺', India: '🇮🇳',
  China: '🇨🇳', 'South Korea': '🇰🇷', Malaysia: '🇲🇾', Thailand: '🇹🇭', Indonesia: '🇮🇩', Taiwan: '🇹🇼',
  'United States': '🇺🇸', 'United Kingdom': '🇬🇧',
};

const CURRENCY_FLAGS: Record<string, string> = {
  SGD: '🇸🇬', HKD: '🇭🇰', JPY: '🇯🇵', AUD: '🇦🇺', INR: '🇮🇳',
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', CNY: '🇨🇳', KRW: '🇰🇷',
};

export function Portfolio() {
  const { region, formatCurrency } = useRegion();
  const user = useRegionUser();
  // Region mock is the source of truth for personal portfolio data
  const { holdings, portfolioSummary: summary } = useRegionMock();
  const [activeTab, setActiveTab] = useState<Tab>('holdings');

  const sortedHoldings = [...holdings].sort((a, b) => b.totalPnlPct - a.totalPnlPct);

  // Column definitions depend on region for currency labels
  const holdingsColumns: Column<Holding>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{COUNTRY_FLAGS[row.country] ?? '🌏'}</span>
          <div>
            <p className="text-sm font-bold text-[var(--dxp-text)]">{row.symbol}</p>
            <p className="text-xs text-[var(--dxp-text-secondary)]">{row.exchange}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name / Sector',
      render: (_, row) => (
        <div>
          <p className="text-sm text-[var(--dxp-text)]">{row.name}</p>
          <p className="text-xs text-[var(--dxp-text-muted)]">{row.sector}</p>
        </div>
      ),
    },
    {
      key: 'qty',
      header: 'Qty',
      render: (val) => <span className="font-mono text-sm text-[var(--dxp-text)]">{(val as number).toLocaleString(region.currency.locale)}</span>,
    },
    {
      key: 'avgCost',
      header: 'Avg Cost',
      render: (val) => (
        <span className="font-mono text-sm text-[var(--dxp-text)]">
          {(val as number).toLocaleString(region.currency.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'currentPrice',
      header: 'Current Price',
      render: (val) => (
        <span className="font-mono text-sm font-bold text-[var(--dxp-text)]">
          {(val as number).toLocaleString(region.currency.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'localPnlPct',
      header: 'P&L %',
      render: (val, row) => {
        const isGain = (val as number) >= 0;
        return (
          <div className={`font-mono text-sm ${isGain ? 'text-emerald-600' : 'text-rose-600'}`}>
            <p>{isGain ? '+' : ''}{row.localPnl.toLocaleString(region.currency.locale)} {row.currency}</p>
            <p className="text-xs">{isGain ? '+' : ''}{(val as number).toFixed(2)}%</p>
          </div>
        );
      },
    },
    {
      key: 'baseCurrencyValue',
      header: `${region.currency.code} Value`,
      render: (val) => (
        <span className="font-mono text-sm font-bold text-[var(--dxp-text)]">
          {formatCurrency(val as number)}
        </span>
      ),
    },
    {
      key: 'fxPnl',
      header: 'FX P&L',
      render: (val) => {
        const v = val as number;
        return (
          <span className={`font-mono text-xs ${v < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {v === 0 ? '—' : `${v >= 0 ? '+' : ''}${v.toLocaleString(region.currency.locale)}`}
          </span>
        );
      },
    },
    {
      key: 'totalPnlPct',
      header: 'Total %',
      render: (val) => {
        const pct = val as number;
        const isGain = pct >= 0;
        return (
          <Badge variant={isGain ? 'success' : 'danger'}>
            {isGain ? '+' : ''}{pct.toFixed(2)}%
          </Badge>
        );
      },
    },
    {
      key: 'dividendYield',
      header: 'Yield',
      render: (val) => {
        const y = val as number;
        return y > 0
          ? <Badge variant="warning">{y}% yield</Badge>
          : <span className="text-[var(--dxp-text-muted)]">—</span>;
      },
    },
  ];

  const countries = new Set(holdings.map((h) => h.country));
  const tabs: { key: Tab; label: string }[] = [
    { key: 'holdings', label: 'Holdings' },
    { key: 'sector', label: 'By Sector' },
    { key: 'country', label: 'By Country' },
    { key: 'currency', label: 'By Currency' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Portfolio</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">
          {user.name} · {holdings.length} holdings across {countries.size} {countries.size === 1 ? 'country' : 'countries'} · Base {region.currency.code} {region.flag}
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="p-3 text-center">
          <p className="text-xs text-[var(--dxp-text-muted)]">Total Value</p>
          <p className="text-lg font-bold font-mono text-[var(--dxp-text)]">{formatCurrency(summary.totalValue)}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-[var(--dxp-text-muted)]">Day Change</p>
          <p className={`text-lg font-bold font-mono ${summary.dayChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {summary.dayChange >= 0 ? '+' : ''}{formatCurrency(summary.dayChange)} ({summary.dayChangePct.toFixed(2)}%)
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-[var(--dxp-text-muted)]">Total P&L</p>
          <p className={`text-lg font-bold font-mono ${summary.totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {summary.totalPnl >= 0 ? '+' : ''}{formatCurrency(summary.totalPnl)} ({summary.totalPnlPct >= 0 ? '+' : ''}{summary.totalPnlPct.toFixed(2)}%)
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-[var(--dxp-text-muted)]">FX P&L</p>
          <p className={`text-lg font-bold font-mono ${summary.fxPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(summary.fxPnl)}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <Tabs
          tabs={tabs}
          active={activeTab}
          onChange={(key) => setActiveTab(key as Tab)}
          variant="underline"
        />
      </div>

      {activeTab === 'holdings' && (
        <DataTable<Holding>
          columns={holdingsColumns}
          data={sortedHoldings}
          emptyMessage="No holdings found"
        />
      )}

      {activeTab === 'sector' && (
        <div className="space-y-3">
          {summary.bySector.map((s) => (
            <Card key={s.sector} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-[var(--dxp-text)]">{s.sector}</p>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-[var(--dxp-text)]">{formatCurrency(s.value)}</p>
                  <p className="text-xs text-[var(--dxp-text-muted)]">{s.pct.toFixed(1)}% of portfolio</p>
                </div>
              </div>
              <div className="h-2 bg-[var(--dxp-border-light)] rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${s.pct}%` }} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'country' && (
        <div className="space-y-3">
          {summary.byCountry.map((c) => (
            <Card key={c.country} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{COUNTRY_FLAGS[c.country] ?? '🌏'}</span>
                  <p className="text-sm font-bold text-[var(--dxp-text)]">{c.country}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-[var(--dxp-text)]">{formatCurrency(c.value)}</p>
                  <p className="text-xs text-[var(--dxp-text-muted)]">{c.pct.toFixed(1)}% of portfolio</p>
                </div>
              </div>
              <div className="h-2 bg-[var(--dxp-border-light)] rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${c.pct}%` }} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'currency' && (
        <div className="space-y-3">
          {summary.byCurrency.map((c) => (
            <Card key={c.currency} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{CURRENCY_FLAGS[c.currency] ?? '💱'}</span>
                  <p className="text-sm font-bold text-[var(--dxp-text)]">{c.currency}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-[var(--dxp-text)]">{formatCurrency(c.value)}</p>
                  <p className="text-xs text-[var(--dxp-text-muted)]">{c.pct.toFixed(1)}% of portfolio</p>
                </div>
              </div>
              <div className="h-2 bg-[var(--dxp-border-light)] rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${c.pct}%` }} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
