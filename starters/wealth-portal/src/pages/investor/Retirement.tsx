import React, { useState } from 'react';
import { Card, Chart } from '@dxp/ui';
import { useRegion, useRegionMock, useRegionUser } from '../../contexts/RegionContext';

/**
 * Projects retirement corpus growth with annual contributions.
 * Returns an array of balances — one entry per year.
 */
function projectGrowth(principal: number, rate: number, years: number, annualContribution: number): number[] {
  const result = [principal];
  for (let i = 1; i <= years; i++) {
    result.push(result[i - 1] * (1 + rate) + annualContribution);
  }
  return result;
}

export function Retirement() {
  const { region, formatCurrency } = useRegion();
  const user = useRegionUser();
  const { portfolioSummary, retirementBalances } = useRegionMock();
  const [, setSuperExpanded] = useState(false);

  const accounts = region.retirement.accounts;
  const scheme = region.retirement.scheme;
  const investmentSchemeLabel = region.retirement.investmentSchemeLabel;
  const monthlyContribution = region.retirement.monthlyContributionDefault;
  const annualContribution = monthlyContribution * 12;
  const returnPct = region.retirement.projectionReturnPct;

  const totalScheme = retirementBalances.oa + retirementBalances.sa + retirementBalances.ma + retirementBalances.ra;
  const totalNetWorth = totalScheme + portfolioSummary.totalValue + portfolioSummary.cashBalance;

  // Project from user's current age to target retirement age
  const currentInvestment = portfolioSummary.totalValue + portfolioSummary.cashBalance;
  const projectionYears = user.targetRetirementAge - user.age;
  const projections = projectGrowth(currentInvestment, returnPct, projectionYears, annualContribution);
  const projectionChartData = projections.map((value, i) => ({
    age: user.age + i,
    value: Math.round(value),
  }));

  // Show ~40% of OA as invested, rest as cash (works for both regions)
  const oaInvested = Math.round(retirementBalances.oa * 0.4);
  const oaCash = retirementBalances.oa - oaInvested;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Retirement Planning</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1 flex items-center gap-2">
          <span>{region.flag}</span> {user.name} · Age {user.age} → target {user.targetRetirementAge} · {scheme} + Investment Portfolio
        </p>
      </div>

      {/* Net worth banner */}
      <Card className="p-5 mb-6 bg-amber-50 border-amber-200">
        <p className="text-xs text-amber-700 font-bold uppercase tracking-wider mb-1">Total Retirement Net Worth</p>
        <p className="text-3xl font-bold font-mono text-amber-700">{formatCurrency(totalNetWorth)}</p>
        <p className="text-sm text-[var(--dxp-text-secondary)] mt-1">
          {scheme} {formatCurrency(totalScheme)} + Portfolio {formatCurrency(portfolioSummary.totalValue)} + Cash {formatCurrency(portfolioSummary.cashBalance)}
        </p>
      </Card>

      {/* Scheme accounts */}
      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-4">{scheme} Accounts</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {accounts.map((acc) => (
          <Card key={acc.key} className="p-4">
            <div className={`w-3 h-3 rounded-full ${acc.color} mb-2`} />
            <p className="text-xs font-bold text-[var(--dxp-text-secondary)] mb-0.5">{acc.label}</p>
            <p className="text-xl font-bold font-mono text-[var(--dxp-text)]">
              {formatCurrency(retirementBalances[acc.key])}
            </p>
            <p className="text-xs text-[var(--dxp-text-muted)] mt-1">{acc.desc}</p>
            <p className="text-xs font-semibold text-emerald-600 mt-1">Earns {acc.rate} p.a.</p>
          </Card>
        ))}
      </div>

      {/* Investment scheme */}
      <Card className="p-5 mb-6">
        <h3 className="text-base font-bold text-[var(--dxp-text)] mb-3">{investmentSchemeLabel}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-[var(--dxp-border-light)] rounded-lg">
            <p className="text-xs text-[var(--dxp-text-muted)]">Invested in Funds</p>
            <p className="text-lg font-bold font-mono text-amber-600">{formatCurrency(oaInvested)}</p>
            <p className="text-xs text-[var(--dxp-text-secondary)] mt-0.5">Mixed equity & bond funds</p>
          </div>
          <div className="p-3 bg-[var(--dxp-border-light)] rounded-lg">
            <p className="text-xs text-[var(--dxp-text-muted)]">Remaining Balance</p>
            <p className="text-lg font-bold font-mono text-[var(--dxp-text)]">{formatCurrency(oaCash)}</p>
            <p className="text-xs text-[var(--dxp-text-secondary)] mt-0.5">
              Earning {accounts[0]?.rate ?? '—'} p.a.
            </p>
          </div>
        </div>
      </Card>

      {/* Retirement projection chart */}
      <div className="mb-6">
        <Chart
          type="line"
          data={projectionChartData}
          xKey="age"
          yKeys={['value']}
          title={`Retirement Projection · age ${user.age}→${user.targetRetirementAge} · ${(returnPct * 100).toFixed(1)}% return, ${formatCurrency(monthlyContribution)}/mo contribution`}
          height={300}
        />
      </div>
    </div>
  );
}
