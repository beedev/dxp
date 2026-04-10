import React, { useState } from 'react';
import { Card, Tabs, Badge, Button, DataTable, type Column } from '@dxp/ui';
import type { Holding } from '../../data/mock-portfolio';
import { useRegion, useRegionMock } from '../../contexts/RegionContext';

interface Recommendation {
  id: string;
  type: 'BUY' | 'REDUCE' | 'ADD';
  symbol: string;
  name: string;
  rationale: string;
  priority: 'High' | 'Medium' | 'Low';
}

const PRIORITY_VARIANT: Record<string, 'danger' | 'warning' | 'default'> = {
  High: 'danger',
  Medium: 'warning',
  Low: 'default',
};

const TYPE_VARIANT: Record<string, 'success' | 'warning'> = {
  BUY: 'success',
  ADD: 'success',
  REDUCE: 'warning',
};

type TabKey = 'portfolio' | 'notes' | 'recommendations';

const TABS = [
  { key: 'portfolio' as TabKey, label: 'Portfolio' },
  { key: 'notes' as TabKey, label: 'Advisor Notes' },
  { key: 'recommendations' as TabKey, label: 'Recommendations' },
];

export function ClientDetail() {
  const { region, formatCurrency } = useRegion();
  const { advisorClients, holdings, allocationTargets } = useRegionMock();
  const client = advisorClients[0];

  // Generate recommendations from actual holdings + allocation drift
  const recommendations: Recommendation[] = React.useMemo(() => {
    const recs: Recommendation[] = [];

    // Worst-performing position → REDUCE suggestion
    const worst = [...holdings].sort((a, b) => a.totalPnlPct - b.totalPnlPct)[0];
    if (worst) {
      recs.push({
        id: 'r1',
        type: 'REDUCE',
        symbol: worst.symbol,
        name: worst.name,
        rationale: `${worst.name} is down ${worst.totalPnlPct.toFixed(1)}%. Consider trimming to free capital for better opportunities.`,
        priority: worst.totalPnlPct < -5 ? 'High' : 'Medium',
      });
    }

    // Biggest overweight in allocation targets → REDUCE
    const overweight = [...allocationTargets].sort((a, b) => (b.current - b.target) - (a.current - a.target))[0];
    if (overweight && overweight.current - overweight.target > 3) {
      recs.push({
        id: 'r2',
        type: 'REDUCE',
        symbol: overweight.country,
        name: `${overweight.country} exposure`,
        rationale: `${overweight.country} is ${(overweight.current - overweight.target).toFixed(1)}% above target weighting. Consider rebalancing down to the ${overweight.target}% target.`,
        priority: 'High',
      });
    }

    // Biggest underweight → ADD
    const underweight = [...allocationTargets].sort((a, b) => (a.current - a.target) - (b.current - b.target))[0];
    if (underweight && underweight.target - underweight.current > 3) {
      recs.push({
        id: 'r3',
        type: 'ADD',
        symbol: underweight.country,
        name: `${underweight.country} exposure`,
        rationale: `${underweight.country} is ${(underweight.target - underweight.current).toFixed(1)}% below target. Increase allocation to reach the ${underweight.target}% weighting.`,
        priority: 'Low',
      });
    }

    return recs;
  }, [holdings, allocationTargets]);
  const [activeTab, setActiveTab] = useState<TabKey>('portfolio');
  const [notes, setNotes] = useState(
    `Client Profile Notes — ${client.name}\n\nInvestment Objectives:\n• Primary goal: Long-term wealth growth with ${client.baseCurrency} base\n• Risk tolerance: ${client.riskProfile}\n\nKey Preferences:\n• Prefers dividend-paying stocks for income\n• Interested in ${region.marketLabel} exposure\n• Avoids leveraged products\n\nLast Review: ${client.lastReview}`
  );

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg">
            {client.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">{client.name}</h1>
            <p className="text-[var(--dxp-text-secondary)] mt-0.5">
              {client.riskProfile} · AUM {new Intl.NumberFormat(region.currency.locale, { style: 'currency', currency: client.baseCurrency, maximumFractionDigits: 0 }).format(client.aum)} · Last review: {client.lastReview}
            </p>
          </div>
        </div>
      </div>

      {/* Client stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <Card className="p-3 text-center">
          <p className="text-xs text-[var(--dxp-text-muted)]">AUM</p>
          <p className="text-base font-bold font-mono text-[var(--dxp-text)]">
            {new Intl.NumberFormat(region.currency.locale, { style: 'currency', currency: client.baseCurrency, notation: 'compact', maximumFractionDigits: 1 }).format(client.aum)}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-[var(--dxp-text-muted)]">Day Change</p>
          <p className={`text-base font-bold font-mono ${client.dayChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {client.dayChange >= 0 ? '+' : ''}{client.dayChange.toFixed(0)}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-[var(--dxp-text-muted)]">YTD Return</p>
          <p className="text-base font-bold font-mono text-emerald-600">+{client.ytdReturn.toFixed(2)}%</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-[var(--dxp-text-muted)]">Risk Profile</p>
          <p className="text-sm font-bold text-amber-600">{client.riskProfile}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <Tabs
          tabs={TABS}
          active={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          variant="underline"
        />
      </div>

      {activeTab === 'portfolio' && (
        <div>
          <div className="grid grid-cols-5 gap-3 mb-4 text-xs">
            {allocationTargets.map((c) => {
              const drift = c.current - c.target;
              return (
                <Card key={c.country} className="p-3">
                  <p className="font-semibold text-[var(--dxp-text)]">{c.flag} {c.country}</p>
                  <p className="text-[var(--dxp-text-muted)]">Target: {c.target}%</p>
                  <p className="text-[var(--dxp-text-muted)]">Current: {c.current}%</p>
                  <p className={`font-bold mt-1 ${Math.abs(drift) > 3 ? (drift > 0 ? 'text-amber-600' : 'text-blue-600') : 'text-emerald-600'}`}>
                    {drift > 0 ? '+' : ''}{drift.toFixed(1)}% drift
                  </p>
                </Card>
              );
            })}
          </div>
          <Card className="overflow-x-auto">
            <DataTable
              columns={[
                {
                  key: 'symbol',
                  header: 'Symbol',
                  render: (_v: unknown, h: Holding) => {
                    const COUNTRY_FLAGS: Record<string, string> = {
                      Singapore: '🇸🇬', 'Hong Kong': '🇭🇰', Japan: '🇯🇵',
                      Australia: '🇦🇺', India: '🇮🇳', China: '🇨🇳',
                      'South Korea': '🇰🇷', Malaysia: '🇲🇾', Thailand: '🇹🇭',
                      Indonesia: '🇮🇩', Taiwan: '🇹🇼',
                    };
                    return (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{COUNTRY_FLAGS[h.country] ?? '🌏'}</span>
                        <div>
                          <p className="text-sm font-bold text-[var(--dxp-text)]">{h.symbol}</p>
                          <p className="text-xs text-[var(--dxp-text-secondary)]">{h.exchange}</p>
                        </div>
                      </div>
                    );
                  },
                },
                {
                  key: 'name',
                  header: 'Name',
                  render: (_v: unknown, h: Holding) => (
                    <div>
                      <p className="text-sm text-[var(--dxp-text)]">{h.name}</p>
                      <p className="text-xs text-[var(--dxp-text-muted)]">{h.sector}</p>
                    </div>
                  ),
                },
                {
                  key: 'qty',
                  header: 'Qty',
                  render: (_v: unknown, h: Holding) => (
                    <span className="text-sm font-mono text-[var(--dxp-text)]">{h.qty.toLocaleString(region.currency.locale)}</span>
                  ),
                },
                {
                  key: 'avgCost',
                  header: 'Avg Cost',
                  render: (_v: unknown, h: Holding) => (
                    <span className="text-sm font-mono text-[var(--dxp-text)]">
                      {h.avgCost.toLocaleString(region.currency.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  key: 'currentPrice',
                  header: 'Current',
                  render: (_v: unknown, h: Holding) => (
                    <span className="text-sm font-mono font-bold text-[var(--dxp-text)]">
                      {h.currentPrice.toLocaleString(region.currency.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  key: 'localPnl',
                  header: 'Local P&L',
                  render: (_v: unknown, h: Holding) => (
                    <div className={`text-sm font-mono ${h.localPnlPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      <p>{h.localPnlPct >= 0 ? '+' : ''}{h.localPnl.toLocaleString(region.currency.locale)} {h.currency}</p>
                      <p className="text-xs">{h.localPnlPct >= 0 ? '+' : ''}{h.localPnlPct.toFixed(2)}%</p>
                    </div>
                  ),
                },
                {
                  key: 'baseCurrencyValue',
                  header: `${region.currency.code} Value`,
                  render: (_v: unknown, h: Holding) => (
                    <span className="text-sm font-mono font-bold text-[var(--dxp-text)]">
                      {formatCurrency(h.baseCurrencyValue)}
                    </span>
                  ),
                },
                {
                  key: 'fxPnl',
                  header: 'FX P&L',
                  render: (_v: unknown, h: Holding) => (
                    <span className={`text-xs font-mono ${h.fxPnl < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {h.fxPnl === 0 ? '—' : `${h.fxPnl >= 0 ? '+' : ''}${h.fxPnl.toLocaleString(region.currency.locale)}`}
                    </span>
                  ),
                },
                {
                  key: 'totalPnlPct',
                  header: 'Total %',
                  render: (_v: unknown, h: Holding) => (
                    <span className={`font-bold text-sm ${h.totalPnlPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {h.totalPnlPct >= 0 ? '+' : ''}{h.totalPnlPct.toFixed(2)}%
                    </span>
                  ),
                },
                {
                  key: 'dividendYield',
                  header: 'Yield',
                  render: (_v: unknown, h: Holding) => (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                      {h.dividendYield > 0 ? `${h.dividendYield}% yield` : '—'}
                    </span>
                  ),
                },
              ] as Column<Holding>[]}
              data={holdings}
            />
          </Card>
        </div>
      )}

      {activeTab === 'notes' && (
        <Card className="p-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={16}
            className="w-full text-sm font-mono text-[var(--dxp-text)] bg-[var(--dxp-surface)] border border-[var(--dxp-border)] rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none leading-relaxed"
          />
          <div className="flex justify-end mt-3">
            <Button variant="primary">Save Notes</Button>
          </div>
        </Card>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {recommendations.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Badge variant={TYPE_VARIANT[r.type] ?? 'default'}>
                    {r.type}
                  </Badge>
                  <div>
                    <p className="text-sm font-bold font-mono text-[var(--dxp-text)]">{r.symbol}</p>
                    <p className="text-xs text-[var(--dxp-text-secondary)]">{r.name}</p>
                  </div>
                </div>
                <Badge variant={PRIORITY_VARIANT[r.priority] ?? 'default'}>
                  {r.priority} Priority
                </Badge>
              </div>
              <p className="text-sm text-[var(--dxp-text-secondary)] leading-relaxed">{r.rationale}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
