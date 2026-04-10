import React from 'react';
import { Card, Chart, Button, Badge } from '@dxp/ui';
import { useRegion, useRegionMock } from '../../contexts/RegionContext';

const GOAL_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  amber: { bar: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' },
  blue: { bar: 'bg-blue-400', text: 'text-blue-700', bg: 'bg-blue-50' },
  emerald: { bar: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50' },
};

function monthsUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
}

function monthlyContribution(current: number, target: number, months: number): number {
  if (months <= 0) return 0;
  const remaining = target - current;
  return Math.ceil(remaining / months);
}

export function Goals() {
  const { region, formatCurrency } = useRegion();
  const { goals } = useRegionMock();
  const totalGoalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalGoalCurrent = goals.reduce((s, g) => s + g.current, 0);

  // Region-aware net worth projection
  const annualContribution = region.retirement.monthlyContributionDefault * 12;
  const growthRate = region.retirement.projectionReturnPct;
  const startYear = new Date().getFullYear();
  const netWorthProjection = Array.from({ length: 20 }, (_, i) => ({
    year: startYear + i,
    value: Math.round(totalGoalCurrent * Math.pow(1 + growthRate, i) + annualContribution * i),
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Financial Goals</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Track your progress toward key financial milestones</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-[var(--dxp-text-muted)]">Combined Goal Target</p>
          <p className="text-xl font-bold font-mono text-[var(--dxp-text)]">{formatCurrency(totalGoalTarget)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--dxp-text-muted)]">Total Progress</p>
          <p className="text-xl font-bold font-mono text-amber-600">{formatCurrency(totalGoalCurrent)}</p>
          <p className="text-xs text-[var(--dxp-text-secondary)] mt-0.5">{((totalGoalCurrent / totalGoalTarget) * 100).toFixed(1)}% overall</p>
        </Card>
      </div>

      {/* Goal cards */}
      <div className="space-y-4 mb-8">
        {goals.map((goal) => {
          const pct = Math.min((goal.current / goal.target) * 100, 100);
          const months = monthsUntil(goal.targetDate);
          const monthly = monthlyContribution(goal.current, goal.target, months);
          const colors = GOAL_COLORS[goal.color] ?? GOAL_COLORS.amber;

          return (
            <Card key={goal.id} className={`p-5 ${colors.bg}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[var(--dxp-text)]">{goal.name}</h3>
                  <p className="text-xs text-[var(--dxp-text-secondary)] mt-0.5">Target: {new Date(goal.targetDate).toLocaleDateString(region.currency.locale, { month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold font-mono ${colors.text}`}>{pct.toFixed(1)}%</p>
                  <p className="text-xs text-[var(--dxp-text-muted)]">{months} months left</p>
                </div>
              </div>

              <div className="h-3 bg-white/60 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full ${colors.bar} transition-all`} style={{ width: `${pct}%` }} />
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-[var(--dxp-text-muted)]">Current</p>
                  <p className={`font-bold font-mono ${colors.text}`}>{formatCurrency(goal.current)}</p>
                </div>
                <div>
                  <p className="text-[var(--dxp-text-muted)]">Target</p>
                  <p className="font-bold font-mono text-[var(--dxp-text)]">{formatCurrency(goal.target)}</p>
                </div>
                <div>
                  <p className="text-[var(--dxp-text-muted)]">Monthly needed</p>
                  <p className="font-bold font-mono text-[var(--dxp-text)]">{formatCurrency(monthly)}/mo</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add goal button */}
      <div className="mb-8">
        <Button variant="secondary" size="md">+ Add New Goal</Button>
      </div>

      {/* Net worth timeline */}
      <Chart
        type="line"
        data={netWorthProjection}
        xKey="year"
        yKeys={['value']}
        title="Net Worth Projection (5% annual growth)"
        height={300}
      />
    </div>
  );
}
