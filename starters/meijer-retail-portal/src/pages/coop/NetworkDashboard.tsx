import React from 'react';
import { Card, StatsDisplay, DataTable, Chart, StatusBadge, Badge } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { networkSummary, regions, topStores, distributionCenters, networkRevenueTrend } from '../../data/mock-network';

function formatBillions(n: number): string {
  return `$${(n / 1_000_000_000).toFixed(1)}B`;
}

function formatMillions(n: number): string {
  return `$${(n / 1_000_000).toFixed(2)}M`;
}

interface StoreRow {
  rank: number;
  name: string;
  city: string;
  state: string;
  annualRevenue: number;
  growth: number;
  satScore: number;
  status: string;
}

const storeColumns: Column<StoreRow>[] = [
  { key: 'rank', header: '#', render: (v: unknown) => <span className="font-bold text-[var(--dxp-text-muted)]">{v as number}</span> },
  { key: 'name', header: 'Store', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  {
    key: 'city', header: 'Location',
    render: (_v: unknown, row: StoreRow) => `${row.city}, ${row.state}`,
  },
  { key: 'annualRevenue', header: 'Annual Revenue', render: (v: unknown) => formatMillions(v as number) },
  { key: 'growth', header: 'YoY Growth', render: (v: unknown) => <span className={(v as number) >= 3 ? 'text-emerald-600 font-semibold' : 'text-[var(--dxp-text)]'}>{`+${(v as number).toFixed(1)}%`}</span> },
  { key: 'satScore', header: 'Sat Score', render: (v: unknown) => `${v}/100` },
  {
    key: 'status', header: 'Status',
    render: (v: unknown) => {
      const s = v as string;
      const statusMap: Record<string, 'approved' | 'pending' | 'rejected'> = {
        'Exceeding': 'approved', 'Meeting': 'pending', 'Below Target': 'rejected',
      };
      return <StatusBadge status={statusMap[s] || 'pending'} label={s} />;
    },
  },
];

// Convert revenue trend for chart (show in millions)
const chartData = networkRevenueTrend.map((d) => ({
  month: d.month,
  revenue: Math.round(d.revenue / 1_000_000),
}));

export function NetworkDashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Network Dashboard</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">ACE Hardware Cooperative — National Overview</p>
      </div>

      {/* Network Summary */}
      <div className="mb-6">
        <StatsDisplay
          stats={[
            { label: 'Total Stores', value: networkSummary.totalStores, format: 'number' },
            { label: 'Network Revenue', value: networkSummary.totalRevenue, format: 'compact' },
            { label: 'Avg Store Revenue', value: networkSummary.avgStoreRevenue, format: 'compact' },
            { label: 'Customer Satisfaction', value: networkSummary.customerSatAvg, format: 'number', delta: { value: 2.1, label: 'vs last year' } },
          ]}
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="mb-6">
        <Chart
          type="line"
          title="Network Revenue Trend"
          description="Monthly revenue in millions (USD)"
          data={chartData}
          xKey="month"
          yKeys={['revenue']}
          height={300}
          colors={['#D50032']}
        />
      </div>

      {/* Regional Performance */}
      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Regional Performance</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {regions.map((region) => {
          const borderColor = region.growth > 3 ? 'border-l-emerald-500' : region.growth >= 1 ? 'border-l-amber-500' : 'border-l-red-500';
          return (
            <Card key={region.name} className={`p-4 border-l-4 ${borderColor}`}>
              <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-2">{region.name}</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--dxp-text-muted)]">Stores</span>
                  <span className="font-semibold text-[var(--dxp-text)]">{region.stores.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--dxp-text-muted)]">Revenue</span>
                  <span className="font-semibold text-[var(--dxp-text)]">{formatBillions(region.revenue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--dxp-text-muted)]">YoY Growth</span>
                  <span className={`font-bold ${region.growth > 3 ? 'text-emerald-600' : region.growth >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
                    +{region.growth.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--dxp-text-muted)]">Satisfaction</span>
                  <span className="font-semibold text-[var(--dxp-text)]">{region.satScore}/100</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Top Performing Stores */}
      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Top Performing Stores</h2>
      <div className="mb-8">
        <DataTable
          columns={storeColumns}
          data={topStores}
        />
      </div>

      {/* Distribution Center Stats */}
      <div className="mb-6">
        <StatsDisplay
          columns={3}
          stats={[
            { label: 'DCs Active', value: 12, format: 'number' },
            { label: 'On-Time Delivery', value: 96.2, format: 'percent' },
            { label: 'Network Stock-Out Rate', value: 1.8, format: 'percent' },
          ]}
        />
      </div>

      {/* Distribution Centers Detail */}
      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Distribution Centers</h2>
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
