import React, { useState, useMemo } from 'react';
import { Card, StatsDisplay, DataTable, FilterBar, StatusBadge, Chart, Badge } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { suppliers, vendorScorecards } from '../../data/mock-suppliers';
import type { Supplier, VendorScorecard } from '../../data/mock-suppliers';

const categoryFilters = [
  { key: 'all', label: 'All Categories', value: 'all' },
  ...['Tools', 'Paint', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware'].map((c) => ({ key: c, label: c, value: c })),
];

const scorecardColumns: Column<VendorScorecard>[] = [
  { key: 'supplierName', header: 'Vendor', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'qualityScore', header: 'Quality', render: (v: unknown) => <span className={(v as number) >= 90 ? 'text-emerald-600 font-semibold' : 'text-[var(--dxp-text)]'}>{String(v)}</span> },
  { key: 'deliveryScore', header: 'Delivery', render: (v: unknown) => <span className={(v as number) >= 95 ? 'text-emerald-600 font-semibold' : 'text-[var(--dxp-text)]'}>{String(v)}</span> },
  { key: 'priceCompetitiveness', header: 'Price' },
  { key: 'responsiveness', header: 'Response' },
  { key: 'overallScore', header: 'Overall', render: (v: unknown) => <span className="font-bold text-lg">{String(v)}</span> },
  {
    key: 'trend', header: 'Trend',
    render: (v: unknown) => {
      const t = v as string;
      return <Badge variant={t === 'improving' ? 'success' : t === 'stable' ? 'info' : 'danger'}>{t}</Badge>;
    },
  },
];

const chartData = vendorScorecards
  .sort((a, b) => b.overallScore - a.overallScore)
  .map((sc) => ({
    vendor: sc.supplierName.length > 15 ? sc.supplierName.slice(0, 13) + '...' : sc.supplierName,
    score: sc.overallScore,
  }));

export function VendorManagement() {
  const [active, setActive] = useState<string[]>(['all']);

  // Filter scorecards by supplier category
  const filtered = useMemo(() => {
    if (active.includes('all')) return vendorScorecards;
    return vendorScorecards.filter((sc) => {
      const sup = suppliers.find((s) => s.id === sc.supplierId);
      return sup && active.includes(sup.category);
    });
  }, [active]);

  const avgScore = Math.round(vendorScorecards.reduce((s, sc) => s + sc.overallScore, 0) / vendorScorecards.length);
  const improvingCount = vendorScorecards.filter((sc) => sc.trend === 'improving').length;
  const decliningCount = vendorScorecards.filter((sc) => sc.trend === 'declining').length;

  const handleToggle = (key: string) => {
    if (key === 'all') { setActive(['all']); return; }
    const without = active.filter((k) => k !== 'all');
    if (without.includes(key)) {
      const updated = without.filter((k) => k !== key);
      setActive(updated.length === 0 ? ['all'] : updated);
    } else {
      setActive([...without, key]);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Vendor Management</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Supplier scorecards and quality tracking</p>
      </div>

      <div className="mb-6">
        <StatsDisplay
          stats={[
            { label: 'Total Vendors', value: suppliers.length, format: 'number' },
            { label: 'Avg Score', value: avgScore, format: 'number' },
            { label: 'Improving', value: improvingCount, format: 'number', delta: { value: improvingCount, label: 'vendors' } },
            { label: 'Declining', value: decliningCount, format: 'number', delta: { value: -decliningCount, label: 'vendors' } },
          ]}
        />
      </div>

      <div className="mb-6">
        <Chart
          type="bar"
          title="Vendor Overall Scores"
          description="Higher is better (out of 100)"
          data={chartData}
          xKey="vendor"
          yKeys={['score']}
          height={300}
          colors={['#D50032']}
        />
      </div>

      <div className="mb-4">
        <FilterBar
          filters={categoryFilters}
          activeFilters={active}
          onToggle={handleToggle}
          onClear={() => setActive(['all'])}
        />
      </div>

      <DataTable columns={scorecardColumns} data={filtered} />
    </div>
  );
}
