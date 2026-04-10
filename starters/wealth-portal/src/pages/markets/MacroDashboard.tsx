import React, { useState, useEffect } from 'react';
import { Card, Chart, DataTable, type Column } from '@dxp/ui';
import { useCountryProfiles, useMacroIndicators } from '@dxp/sdk-react';
import { useRegion } from '../../contexts/RegionContext';

interface CountryMacro {
  code: string;
  name: string;
  flag: string;
  gdp: number;
  gdpGrowth: number;
  inflation: number;
  policyRate: number;
  currency: string;
  gdpHistory: { year: number; value: number }[];
}

// Fallback static data (shown when World Bank API is unreachable)
const MACRO_FALLBACK: CountryMacro[] = [
  { code: 'SG', name: 'Singapore',   flag: '🇸🇬', gdp: 0.52, gdpGrowth: 3.2, inflation: 2.8, policyRate: 3.50, currency: 'SGD', gdpHistory: [{ year: 2020, value: 0.34 }, { year: 2021, value: 0.40 }, { year: 2022, value: 0.47 }, { year: 2023, value: 0.50 }, { year: 2024, value: 0.52 }, { year: 2025, value: 0.52 }] },
  { code: 'IN', name: 'India',       flag: '🇮🇳', gdp: 3.73, gdpGrowth: 7.1, inflation: 4.8, policyRate: 6.50, currency: 'INR', gdpHistory: [{ year: 2020, value: 2.67 }, { year: 2021, value: 3.18 }, { year: 2022, value: 3.40 }, { year: 2023, value: 3.73 }, { year: 2024, value: 3.73 }, { year: 2025, value: 4.00 }] },
  { code: 'HK', name: 'Hong Kong',   flag: '🇭🇰', gdp: 0.38, gdpGrowth: 2.8, inflation: 1.9, policyRate: 5.25, currency: 'HKD', gdpHistory: [{ year: 2020, value: 0.35 }, { year: 2021, value: 0.37 }, { year: 2022, value: 0.36 }, { year: 2023, value: 0.38 }, { year: 2024, value: 0.38 }, { year: 2025, value: 0.39 }] },
  { code: 'JP', name: 'Japan',       flag: '🇯🇵', gdp: 4.21, gdpGrowth: 1.4, inflation: 2.3, policyRate: 0.10, currency: 'JPY', gdpHistory: [{ year: 2020, value: 5.06 }, { year: 2021, value: 5.00 }, { year: 2022, value: 4.23 }, { year: 2023, value: 4.21 }, { year: 2024, value: 4.21 }, { year: 2025, value: 4.30 }] },
  { code: 'AU', name: 'Australia',   flag: '🇦🇺', gdp: 1.69, gdpGrowth: 2.1, inflation: 3.2, policyRate: 4.10, currency: 'AUD', gdpHistory: [{ year: 2020, value: 1.33 }, { year: 2021, value: 1.55 }, { year: 2022, value: 1.68 }, { year: 2023, value: 1.69 }, { year: 2024, value: 1.69 }, { year: 2025, value: 1.72 }] },
  { code: 'CN', name: 'China',       flag: '🇨🇳', gdp: 18.50, gdpGrowth: 4.9, inflation: 0.4, policyRate: 3.45, currency: 'CNY', gdpHistory: [{ year: 2020, value: 14.69 }, { year: 2021, value: 17.73 }, { year: 2022, value: 17.96 }, { year: 2023, value: 17.79 }, { year: 2024, value: 18.50 }, { year: 2025, value: 18.80 }] },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', gdp: 1.71, gdpGrowth: 2.5, inflation: 2.9, policyRate: 3.50, currency: 'KRW', gdpHistory: [{ year: 2020, value: 1.63 }, { year: 2021, value: 1.79 }, { year: 2022, value: 1.67 }, { year: 2023, value: 1.71 }, { year: 2024, value: 1.71 }, { year: 2025, value: 1.74 }] },
  { code: 'ID', name: 'Indonesia',   flag: '🇮🇩', gdp: 1.37, gdpGrowth: 5.0, inflation: 3.4, policyRate: 6.00, currency: 'IDR', gdpHistory: [{ year: 2020, value: 1.06 }, { year: 2021, value: 1.19 }, { year: 2022, value: 1.32 }, { year: 2023, value: 1.37 }, { year: 2024, value: 1.37 }, { year: 2025, value: 1.44 }] },
  { code: 'MY', name: 'Malaysia',    flag: '🇲🇾', gdp: 0.40, gdpGrowth: 4.3, inflation: 2.6, policyRate: 3.00, currency: 'MYR', gdpHistory: [{ year: 2020, value: 0.34 }, { year: 2021, value: 0.37 }, { year: 2022, value: 0.40 }, { year: 2023, value: 0.40 }, { year: 2024, value: 0.40 }, { year: 2025, value: 0.42 }] },
  { code: 'TH', name: 'Thailand',    flag: '🇹🇭', gdp: 0.51, gdpGrowth: 3.1, inflation: 1.8, policyRate: 2.50, currency: 'THB', gdpHistory: [{ year: 2020, value: 0.50 }, { year: 2021, value: 0.51 }, { year: 2022, value: 0.50 }, { year: 2023, value: 0.51 }, { year: 2024, value: 0.51 }, { year: 2025, value: 0.53 }] },
];

export function MacroDashboard() {
  const { region } = useRegion();
  const [selected, setSelected] = useState<string>(region.id);

  // Reset to the region's country when user switches regions
  useEffect(() => { setSelected(region.id); }, [region.id]);

  // Live World Bank data
  const { data: liveProfiles } = useCountryProfiles();
  const { data: liveIndicators } = useMacroIndicators(selected, 6);

  const liveProfilesCast = liveProfiles as unknown as CountryMacro[] | undefined;
  const macroData: CountryMacro[] = liveProfilesCast?.length ? liveProfilesCast : MACRO_FALLBACK;

  const country =
    macroData.find((c) => c.code === selected) ??
    MACRO_FALLBACK.find((c) => c.code === selected) ??
    MACRO_FALLBACK[0];

  // Prefer live GDP history from World Bank when present
  const gdpHistory = (liveIndicators as { year: number; value: number }[] | undefined)?.length
    ? (liveIndicators as { year: number; value: number }[])
    : country.gdpHistory;

  const gdpChartData = gdpHistory.map((d) => ({
    year: String(d.year),
    gdp: d.value,
  }));

  const comparisonColumns: Column<CountryMacro>[] = [
    {
      key: 'name',
      header: 'Country',
      render: (_value, row) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{row.flag}</span>
          <span className="font-semibold text-[var(--dxp-text)]">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'gdp',
      header: 'GDP ($T)',
      render: (value) => (
        <span className="font-mono text-[var(--dxp-text)]">${(value as number).toFixed(2)}</span>
      ),
    },
    {
      key: 'gdpGrowth',
      header: 'Growth %',
      render: (value) => {
        const v = value as number;
        const cls = v >= 5 ? 'text-emerald-600' : v >= 2 ? 'text-amber-600' : 'text-rose-500';
        return <span className={`font-semibold ${cls}`}>+{v.toFixed(1)}%</span>;
      },
    },
    {
      key: 'inflation',
      header: 'Inflation %',
      render: (value) => {
        const v = value as number;
        const cls = v > 4 ? 'text-rose-600' : v > 2.5 ? 'text-amber-600' : 'text-emerald-600';
        return <span className={`font-semibold ${cls}`}>{v.toFixed(1)}%</span>;
      },
    },
    {
      key: 'policyRate',
      header: 'Policy Rate %',
      render: (value) => (
        <span className="font-mono text-[var(--dxp-text)]">{(value as number).toFixed(2)}%</span>
      ),
    },
    {
      key: 'currency',
      header: 'Currency',
      render: (value) => (
        <span className="text-[var(--dxp-text-secondary)]">{value as string}</span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Macro Dashboard</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">
          Key economic indicators · {region.flag} {region.name} focus · data: World Bank
        </p>
      </div>

      {/* Country selector */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {macroData.map((c) => (
          <button
            key={c.code}
            onClick={() => setSelected(c.code)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              selected === c.code
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-[var(--dxp-surface)] text-[var(--dxp-text-secondary)] border-[var(--dxp-border)] hover:border-amber-400'
            }`}
          >
            <span>{c.flag}</span> {c.code}
          </button>
        ))}
      </div>

      {/* Country Profile */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{country.flag}</span>
          <div>
            <h2 className="text-xl font-bold text-[var(--dxp-text)]">{country.name}</h2>
            <p className="text-sm text-[var(--dxp-text-secondary)]">
              Economic Profile · Currency: {country.currency} · Central bank: {region.macro.centralBank}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[var(--dxp-border-light)] rounded-lg p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--dxp-text-muted)] mb-1">GDP (USD Trillion)</p>
            <p className="text-2xl font-bold text-[var(--dxp-text)]">${country.gdp.toFixed(2)}T</p>
            <p className={`text-sm font-semibold mt-1 ${country.gdpGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              +{country.gdpGrowth.toFixed(1)}% growth
            </p>
          </div>
          <div className="bg-[var(--dxp-border-light)] rounded-lg p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--dxp-text-muted)] mb-1">Inflation Rate</p>
            <p className="text-2xl font-bold text-[var(--dxp-text)]">{country.inflation.toFixed(1)}%</p>
            <p className={`text-sm font-semibold mt-1 ${country.inflation > 3 ? 'text-rose-500' : country.inflation > 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
              {country.inflation > 3 ? 'Above target' : country.inflation > 2 ? 'Moderate' : 'Contained'}
            </p>
          </div>
          <div className="bg-[var(--dxp-border-light)] rounded-lg p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--dxp-text-muted)] mb-1">Policy Rate</p>
            <p className="text-2xl font-bold text-[var(--dxp-text)]">{country.policyRate.toFixed(2)}%</p>
            <p className="text-sm font-semibold text-[var(--dxp-text-secondary)] mt-1">Central bank rate</p>
          </div>
        </div>
      </Card>

      {/* GDP History Bar Chart */}
      <Chart
        type="bar"
        data={gdpChartData}
        xKey="year"
        yKeys={['gdp']}
        title={`${country.name} — GDP History (USD Trillion) · World Bank`}
        height={300}
      />

      {/* Comparison Table */}
      <h2 className="text-xl font-bold text-[var(--dxp-text)] mb-4 mt-8">Regional Comparison</h2>
      <DataTable
        columns={comparisonColumns}
        data={macroData}
        onRowClick={(row) => setSelected(row.code)}
        emptyMessage="No macro data available"
      />
    </div>
  );
}
