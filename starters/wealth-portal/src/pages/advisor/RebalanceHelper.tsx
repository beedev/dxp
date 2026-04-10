import React, { useState } from 'react';
import { Card, Button, Badge, DataTable, type Column } from '@dxp/ui';
import { useRegion, useRegionMock, useRegionUser } from '../../contexts/RegionContext';
import type { AllocationTarget } from '../../data/region-mock';

interface SuggestedTrade {
  symbol: string;
  name: string;
  country: string;
  action: 'Buy' | 'Sell';
  estimatedValue: number;
  reason: string;
}

export function RebalanceHelper() {
  const { region, formatCurrency } = useRegion();
  const user = useRegionUser();
  const { portfolioSummary, holdings, allocationTargets: TARGETS } = useRegionMock();
  const [tradeListGenerated, setTradeListGenerated] = useState(false);

  const totalValue = portfolioSummary.totalValue;

  // Generate suggested trades from drifted allocation targets
  const SUGGESTED_TRADES: SuggestedTrade[] = React.useMemo(() => {
    return TARGETS.filter((t) => Math.abs(t.current - t.target) > 2).flatMap((t) => {
      const drift = t.current - t.target;
      const actionValue = Math.round(Math.abs((drift / 100) * totalValue));
      // Find a matching holding to trade
      const candidate = holdings.find((h) => h.country === t.country || h.sector === t.country);
      return [{
        symbol: candidate?.symbol ?? t.country,
        name: candidate?.name ?? `${t.country} basket`,
        country: t.country,
        action: (drift > 0 ? 'Sell' : 'Buy') as 'Buy' | 'Sell',
        estimatedValue: actionValue,
        reason: `${drift > 0 ? 'Reduce' : 'Increase'} ${t.country} from ${t.current.toFixed(1)}% to ${t.target}%`,
      }];
    });
  }, [TARGETS, totalValue, holdings]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Rebalance Helper</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">{user.name} · {region.flag} {user.location} · Drift analysis and trade suggestions</p>
      </div>

      {/* Current vs Target table */}
      <Card className="overflow-x-auto mb-6">
        <DataTable
          columns={[
            {
              key: 'country',
              header: 'Country',
              render: (_v: unknown, t: AllocationTarget) => (
                <div className="flex items-center gap-2">
                  <span className="text-lg">{t.flag}</span>
                  <span className="font-semibold text-[var(--dxp-text)]">{t.country}</span>
                </div>
              ),
            },
            {
              key: 'target',
              header: 'Target %',
              render: (_v: unknown, t: AllocationTarget) => (
                <span className="font-mono text-[var(--dxp-text)]">{t.target.toFixed(0)}%</span>
              ),
            },
            {
              key: 'current',
              header: 'Current %',
              render: (_v: unknown, t: AllocationTarget) => (
                <span className="font-mono text-[var(--dxp-text)]">{t.current.toFixed(1)}%</span>
              ),
            },
            {
              key: 'drift',
              header: 'Drift',
              render: (_v: unknown, t: AllocationTarget) => {
                const drift = t.current - t.target;
                const isOver = drift > 0;
                return (
                  <span className={`font-bold ${Math.abs(drift) > 3 ? (isOver ? 'text-amber-600' : 'text-blue-600') : 'text-emerald-600'}`}>
                    {drift > 0 ? '+' : ''}{drift.toFixed(1)}%
                  </span>
                );
              },
            },
            {
              key: 'targetValue',
              header: 'Target Value',
              render: (_v: unknown, t: AllocationTarget) => (
                <span className="font-mono text-[var(--dxp-text)]">{formatCurrency((t.target / 100) * totalValue)}</span>
              ),
            },
            {
              key: 'currentValue',
              header: 'Current Value',
              render: (_v: unknown, t: AllocationTarget) => (
                <span className="font-mono text-[var(--dxp-text)]">{formatCurrency((t.current / 100) * totalValue)}</span>
              ),
            },
            {
              key: 'action',
              header: 'Action Needed',
              render: (_v: unknown, t: AllocationTarget) => {
                const drift = t.current - t.target;
                const targetValue = (t.target / 100) * totalValue;
                const currentValue = (t.current / 100) * totalValue;
                const actionValue = Math.abs(currentValue - targetValue);
                const isOver = drift > 0;
                return (
                  <span className={`font-semibold ${isOver ? 'text-amber-600' : 'text-blue-600'}`}>
                    {Math.abs(drift) < 1 ? '✓ On target' : `${isOver ? 'Sell' : 'Buy'} ${formatCurrency(actionValue)}`}
                  </span>
                );
              },
            },
          ] as Column<AllocationTarget>[]}
          data={TARGETS}
        />
      </Card>

      {/* Drift visualization */}
      <Card className="p-5 mb-6">
        <h2 className="text-base font-bold text-[var(--dxp-text)] mb-4">Drift Analysis</h2>
        <div className="space-y-3">
          {TARGETS.map((t) => {
            const drift = t.current - t.target;
            return (
              <div key={t.country}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1">{t.flag} <span className="text-[var(--dxp-text)]">{t.country}</span></span>
                  <span className={`font-semibold ${Math.abs(drift) > 3 ? (drift > 0 ? 'text-amber-600' : 'text-blue-600') : 'text-emerald-600'}`}>
                    {drift > 0 ? 'Overweight +' : 'Underweight '}{Math.abs(drift).toFixed(1)}%
                  </span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden bg-[var(--dxp-border-light)]">
                  <div className="bg-emerald-300 rounded-l-full" style={{ width: `${t.target}%` }} />
                  {drift > 0 && <div className="bg-amber-400" style={{ width: `${drift}%` }} />}
                  {drift < 0 && <div className="bg-[var(--dxp-border-light)]" style={{ width: `${Math.abs(drift)}%` }} />}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Suggested trades */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[var(--dxp-text)]">Suggested Trades</h2>
        <Button variant="primary" onClick={() => setTradeListGenerated(true)}>
          Generate Trade List
        </Button>
      </div>

      {tradeListGenerated && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-semibold">
          Trade list generated and exported to PDF. Total estimated transactions: {formatCurrency(SUGGESTED_TRADES.reduce((s, t) => s + t.estimatedValue, 0))}
        </div>
      )}

      <Card className="overflow-x-auto">
        <DataTable
          columns={[
            {
              key: 'symbol',
              header: 'Symbol',
              render: (_v: unknown, t: SuggestedTrade) => (
                <span className="font-mono font-bold text-[var(--dxp-text)]">{t.symbol}</span>
              ),
            },
            { key: 'name', header: 'Name' },
            {
              key: 'country',
              header: 'Country',
              render: (_v: unknown, t: SuggestedTrade) => (
                <span className="text-[var(--dxp-text-secondary)]">{t.country}</span>
              ),
            },
            {
              key: 'action',
              header: 'Action',
              render: (_v: unknown, t: SuggestedTrade) => (
                <Badge variant={t.action === 'Buy' ? 'success' : 'danger'}>{t.action}</Badge>
              ),
            },
            {
              key: 'estimatedValue',
              header: 'Est. Value',
              render: (_v: unknown, t: SuggestedTrade) => (
                <span className="font-mono text-[var(--dxp-text)]">{formatCurrency(t.estimatedValue)}</span>
              ),
            },
            {
              key: 'reason',
              header: 'Reason',
              render: (_v: unknown, t: SuggestedTrade) => (
                <span className="text-xs text-[var(--dxp-text-secondary)]">{t.reason}</span>
              ),
            },
          ] as Column<SuggestedTrade>[]}
          data={SUGGESTED_TRADES}
        />
      </Card>
    </div>
  );
}
