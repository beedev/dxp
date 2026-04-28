import React from 'react';
import { Card, StatsDisplay, DataTable, StatusBadge, Chart } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { distributionCenters, regions } from '../../data/mock-network';

type DC = (typeof distributionCenters)[0];

const dcColumns: Column<DC>[] = [
  { key: 'name', header: 'Distribution Center', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'location', header: 'Location' },
  { key: 'onTimeRate', header: 'On-Time %', render: (v: unknown) => <span className={(v as number) >= 95 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{String(v)}%</span> },
  { key: 'stockOutRate', header: 'Stock-Out %', render: (v: unknown) => <span className={(v as number) <= 2 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>{String(v)}%</span> },
  {
    key: 'status', header: 'Status',
    render: (v: unknown) => <StatusBadge status={(v as string) === 'Operational' ? 'approved' : 'pending'} label={v as string} />,
  },
];

const stockOutChart = regions.map((r) => ({
  region: r.name,
  stockOut: +(Math.random() * 2 + 0.8).toFixed(1),
}));

export function SupplyChain() {
  const avgOnTime = +(distributionCenters.reduce((s, dc) => s + dc.onTimeRate, 0) / distributionCenters.length).toFixed(1);
  const avgStockOut = +(distributionCenters.reduce((s, dc) => s + dc.stockOutRate, 0) / distributionCenters.length).toFixed(1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Supply Chain</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Distribution center operations and logistics</p>
      </div>

      <div className="mb-6">
        <StatsDisplay
          stats={[
            { label: 'DCs Active', value: distributionCenters.filter((dc) => dc.status === 'Operational').length, format: 'number' },
            { label: 'Avg On-Time Rate', value: avgOnTime, format: 'percent' },
            { label: 'Avg Stock-Out Rate', value: avgStockOut, format: 'percent' },
            { label: 'Total DCs', value: distributionCenters.length, format: 'number' },
          ]}
        />
      </div>

      <div className="mb-6">
        <Chart
          type="bar"
          title="Stock-Out Rate by Region"
          description="Lower is better"
          data={stockOutChart}
          xKey="region"
          yKeys={['stockOut']}
          height={280}
          colors={['#D50032']}
        />
      </div>

      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Distribution Centers</h2>
      <div className="mb-8">
        <DataTable columns={dcColumns} data={distributionCenters} />
      </div>

      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Regional Support Centers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {distributionCenters.map((dc) => (
          <Card key={dc.name} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-[var(--dxp-text)]">{dc.name}</h3>
              <StatusBadge status={dc.status === 'Operational' ? 'approved' : 'pending'} label={dc.status} />
            </div>
            <p className="text-xs text-[var(--dxp-text-muted)] mb-2">{dc.location}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--dxp-text-muted)]">On-Time</span>
                <span className={`font-semibold ${dc.onTimeRate >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>{dc.onTimeRate}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--dxp-text-muted)]">Stock-Out</span>
                <span className={`font-semibold ${dc.stockOutRate <= 2 ? 'text-emerald-600' : 'text-red-600'}`}>{dc.stockOutRate}%</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
