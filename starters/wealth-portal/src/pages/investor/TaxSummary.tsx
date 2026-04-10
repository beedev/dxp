import React from 'react';
import { Card, DataTable, Badge, type Column } from '@dxp/ui';
import type { Holding } from '../../data/mock-portfolio';
import { useRegion, useRegionMock, useRegionUser } from '../../contexts/RegionContext';

interface DividendRow {
  country: string;
  flag: string;
  grossDividends: number;
  whtRate: number;
  whtPaid: number;
  netReceived: number;
}

const COUNTRY_FLAGS: Record<string, string> = {
  Singapore: '🇸🇬', 'Hong Kong': '🇭🇰', Japan: '🇯🇵', Australia: '🇦🇺', India: '🇮🇳',
  China: '🇨🇳', 'South Korea': '🇰🇷', 'United States': '🇺🇸', 'United Kingdom': '🇬🇧',
};

export function TaxSummary() {
  const { region, formatCurrency } = useRegion();
  const user = useRegionUser();
  const { holdings, transactions } = useRegionMock();

  // Compute dividend income per country from transactions + apply the region's WHT map
  const dividendTxns = transactions.filter((t) => t.side === 'dividend');
  const grossByCountry = new Map<string, number>();
  dividendTxns.forEach((t) => {
    const h = holdings.find((x) => x.symbol === t.symbol);
    const country = h?.country ?? 'Unknown';
    grossByCountry.set(country, (grossByCountry.get(country) ?? 0) + t.baseCurrencyAmount);
  });

  const dividendsByCountry: DividendRow[] = Array.from(grossByCountry.entries()).map(([country, gross]) => {
    const whtRate = region.tax.dividendWhtByCountry[country] ?? 0;
    const whtPaid = Math.round((gross * whtRate) / 100);
    return {
      country,
      flag: COUNTRY_FLAGS[country] ?? '🌏',
      grossDividends: Math.round(gross),
      whtRate,
      whtPaid,
      netReceived: Math.round(gross) - whtPaid,
    };
  });

  const whtColumns: Column<DividendRow>[] = [
    {
      key: 'country',
      header: 'Country',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{row.flag}</span>
          <span className="font-semibold text-[var(--dxp-text)]">{val as string}</span>
        </div>
      ),
    },
    {
      key: 'grossDividends',
      header: 'Gross Dividends',
      render: (val) => (
        <span className="font-mono text-[var(--dxp-text)]">{formatCurrency(val as number)}</span>
      ),
    },
    {
      key: 'whtRate',
      header: 'WHT Rate',
      render: (val) => {
        const rate = val as number;
        return (
          <Badge variant={rate === 0 ? 'success' : 'danger'}>
            {rate === 0 ? 'Nil' : `${rate}%`}
          </Badge>
        );
      },
    },
    {
      key: 'whtPaid',
      header: 'WHT Paid',
      render: (val) => {
        const paid = val as number;
        return (
          <span className={`font-mono font-semibold ${paid > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {paid > 0 ? `-${formatCurrency(paid)}` : '—'}
          </span>
        );
      },
    },
    {
      key: 'netReceived',
      header: 'Net Received',
      render: (val) => (
        <span className="font-mono font-bold text-emerald-600">{formatCurrency(val as number)}</span>
      ),
    },
  ];

  const totalGross = dividendsByCountry.reduce((s, r) => s + r.grossDividends, 0);
  const totalWHT   = dividendsByCountry.reduce((s, r) => s + r.whtPaid, 0);
  const totalNet   = dividendsByCountry.reduce((s, r) => s + r.netReceived, 0);
  const totalUnrealised = holdings.reduce((s, h) => s + h.baseCurrencyPnl, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Tax Summary</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">
          {user.name} · {region.tax.year} · {region.flag} {region.name} resident taxpayer
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-[var(--dxp-text-muted)]">Gross Dividends</p>
          <p className="text-xl font-bold font-mono text-[var(--dxp-text)]">{formatCurrency(totalGross)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--dxp-text-muted)]">Withholding Tax Paid</p>
          <p className="text-xl font-bold font-mono text-rose-600">{formatCurrency(totalWHT)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--dxp-text-muted)]">Net Dividends Received</p>
          <p className="text-xl font-bold font-mono text-emerald-600">{formatCurrency(totalNet)}</p>
        </Card>
      </div>

      {/* WHT DataTable */}
      {dividendsByCountry.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-4">Dividend Income by Country</h2>
          <div className="mb-6">
            <DataTable<DividendRow>
              columns={whtColumns}
              data={dividendsByCountry}
              emptyMessage="No dividend data"
            />
          </div>
        </>
      )}

      {/* Region tax rules */}
      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-4">
        {region.name} Tax Rules ({region.tax.year})
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {region.tax.rules.map((rule, i) => (
          <Card key={i} className="p-5 border-l-4 border-amber-400">
            <p className="text-xs text-[var(--dxp-text-secondary)] leading-relaxed">{rule}</p>
          </Card>
        ))}
      </div>

      {/* Deduction hint */}
      <Card className="p-5 bg-blue-50 border-blue-200 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="text-sm font-bold text-blue-700 mb-1">
              {region.tax.sectionLabel} Deduction
            </h3>
            <p className="text-xs text-[var(--dxp-text-secondary)] leading-relaxed">
              You can claim up to {formatCurrency(region.tax.sectionAnnualLimit)} in {region.tax.sectionLabel} deductions
              per financial year to reduce your taxable income.
            </p>
          </div>
        </div>
      </Card>

      {/* Capital gains summary */}
      <Card className={`p-5 ${region.tax.hasCapitalGainsTax ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{region.flag}</span>
          <div>
            <h3 className={`text-sm font-bold mb-1 ${region.tax.hasCapitalGainsTax ? 'text-amber-700' : 'text-emerald-700'}`}>
              Capital Gains: {region.tax.capitalGainsLabel}
            </h3>
            <p className="text-xs text-[var(--dxp-text-secondary)] leading-relaxed">
              Your total unrealised gain of{' '}
              <span className="font-semibold text-[var(--dxp-text)]">{formatCurrency(totalUnrealised)}</span>{' '}
              across your {region.name} portfolio{' '}
              {region.tax.hasCapitalGainsTax
                ? `would be subject to capital gains tax upon disposal based on the holding period and the ${region.tax.capitalGainsLabel} rules applicable in ${region.name}.`
                : `would be entirely tax-free upon disposal, provided you are not considered a trader.`}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
