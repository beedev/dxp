import React, { useState, useMemo } from 'react';
import { StatsDisplay, DataTable, FilterBar, StatusBadge, Chart } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { topStores, regions, networkSummary } from '../../data/mock-network';

type StoreRow = (typeof topStores)[0];

const regionFilters = [
  { key: 'all', label: 'All Regions', value: 'all' },
  ...regions.map((r) => ({ key: r.name, label: r.name, value: r.name })),
];

const perfFilters = [
  { key: 'all-perf', label: 'All Tiers', value: 'all-perf' },
  { key: 'Exceeding', label: 'Exceeding', value: 'Exceeding' },
  { key: 'Meeting', label: 'Meeting', value: 'Meeting' },
  { key: 'Below Target', label: 'Below Target', value: 'Below Target' },
];

const statusMap: Record<string, 'approved' | 'pending' | 'rejected'> = {
  Exceeding: 'approved',
  Meeting: 'pending',
  'Below Target': 'rejected',
};

const columns: Column<StoreRow>[] = [
  { key: 'rank', header: '#', render: (v: unknown) => <span className="font-bold text-[var(--dxp-text-muted)]">{v as number}</span> },
  { key: 'name', header: 'Store', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'city', header: 'Location', render: (_v: unknown, row: StoreRow) => `${row.city}, ${row.state}` },
  { key: 'annualRevenue', header: 'Annual Revenue', render: (v: unknown) => `$${((v as number) / 1_000_000).toFixed(2)}M` },
  { key: 'growth', header: 'YoY Growth', render: (v: unknown) => <span className={(v as number) >= 3 ? 'text-emerald-600 font-semibold' : 'text-[var(--dxp-text)]'}>{`+${(v as number).toFixed(1)}%`}</span> },
  { key: 'satScore', header: 'Sat Score', render: (v: unknown) => `${v}/100` },
  { key: 'status', header: 'Status', render: (v: unknown) => <StatusBadge status={statusMap[v as string] || 'pending'} label={v as string} /> },
];

const chartData = topStores.map((s) => ({
  store: s.name.replace('ACE — ', ''),
  revenue: Math.round(s.annualRevenue / 1000),
}));

export function StorePerformance() {
  const [activeRegion, setActiveRegion] = useState<string[]>(['all']);
  const [activePerf, setActivePerf] = useState<string[]>(['all-perf']);

  const filtered = useMemo(() => {
    let result = topStores;
    if (!activePerf.includes('all-perf')) {
      result = result.filter((s) => activePerf.includes(s.status));
    }
    return result;
  }, [activePerf]);

  const handlePerfToggle = (key: string) => {
    if (key === 'all-perf') { setActivePerf(['all-perf']); return; }
    const without = activePerf.filter((k) => k !== 'all-perf');
    if (without.includes(key)) {
      const updated = without.filter((k) => k !== key);
      setActivePerf(updated.length === 0 ? ['all-perf'] : updated);
    } else {
      setActivePerf([...without, key]);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Store Performance</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Network-wide store rankings and analysis</p>
      </div>

      <div className="mb-6">
        <StatsDisplay
          stats={[
            { label: 'Total Stores', value: networkSummary.totalStores, format: 'number' },
            { label: 'Avg Store Revenue', value: networkSummary.avgStoreRevenue, format: 'compact' },
            { label: 'Avg Satisfaction', value: networkSummary.customerSatAvg, format: 'number' },
            { label: 'YoY Growth', value: networkSummary.yoyGrowth, format: 'percent' },
          ]}
        />
      </div>

      <div className="mb-6">
        <Chart
          type="bar"
          title="Top 10 Stores — Revenue ($K)"
          data={chartData}
          xKey="store"
          yKeys={['revenue']}
          height={300}
          colors={['#D50032']}
        />
      </div>

      <div className="mb-4">
        <FilterBar
          filters={perfFilters}
          activeFilters={activePerf}
          onToggle={handlePerfToggle}
          onClear={() => setActivePerf(['all-perf'])}
        />
      </div>

      <p className="text-sm text-[var(--dxp-text-muted)] mb-4">Showing {filtered.length} stores</p>

      <DataTable columns={columns} data={filtered} />
    </div>
  );
}
