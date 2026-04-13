import React from 'react';
import { Card, StatsDisplay, DataTable, Chart, StatusBadge, Badge } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { hourlySales, topSellers, categoryBreakdown } from '../../data/mock-sales';

const todayRevenue = hourlySales.reduce((sum, h) => sum + h.revenue, 0);
const todayTransactions = hourlySales.reduce((sum, h) => sum + h.transactions, 0);
const avgTicket = Math.round(todayRevenue / todayTransactions);

interface TopSeller {
  productId: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
}

const topSellersColumns: Column<TopSeller>[] = [
  { key: 'name', header: 'Product', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'category', header: 'Category', render: (v: unknown) => <Badge variant="info">{v as string}</Badge> },
  { key: 'unitsSold', header: 'Units' },
  { key: 'revenue', header: 'Revenue', render: (v: unknown) => `$${(v as number).toLocaleString()}` },
];

const inventoryAlerts = [
  { id: 1, name: 'KILZ Original Primer', sku: 'KL-EXT-GRY', qty: 2, reorderPoint: 10 },
  { id: 2, name: 'Philips LED 60W 4-Pack', sku: 'PH-LED-4PK', qty: 4, reorderPoint: 15 },
  { id: 3, name: 'SharkBite Push-Connect Kit', sku: 'SK-CPVC-KT', qty: 3, reorderPoint: 8 },
];

const staffOnDuty = [
  'Mike S. (Manager)', 'Sarah L.', 'Tom B.', 'Jessica R.', 'Dave P.', 'Kim H.',
];

export function ManagerDashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Store Dashboard</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">ACE Hardware — Naperville, IL</p>
      </div>

      {/* Today's Stats */}
      <div className="mb-6">
        <StatsDisplay
          stats={[
            { label: "Today's Revenue", value: todayRevenue, format: 'currency' },
            { label: 'Transactions', value: todayTransactions, format: 'number' },
            { label: 'Avg Ticket', value: avgTicket, format: 'currency' },
            { label: 'vs Yesterday', value: 12.3, format: 'percent', delta: { value: 12.3, label: 'higher' } },
          ]}
        />
      </div>

      {/* Hourly Sales Chart */}
      <div className="mb-6">
        <Chart
          type="line"
          title="Today's Sales — Hourly Breakdown"
          description="Revenue by hour (7am to 8pm)"
          data={hourlySales.map((h) => ({ ...h, revenue: h.revenue }))}
          xKey="hourLabel"
          yKeys={['revenue']}
          height={280}
          colors={['#D50032']}
        />
      </div>

      {/* Two-Column: Top Sellers + Alerts/Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Sellers Table */}
        <div>
          <h2 className="text-base font-bold text-[var(--dxp-text)] mb-3">Top Sellers Today</h2>
          <DataTable
            columns={topSellersColumns}
            data={topSellers.slice(0, 5)}
          />
        </div>

        {/* Right Column: Alerts + Staff */}
        <div className="space-y-4">
          {/* Inventory Alerts */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="text-base font-bold text-[var(--dxp-text)]">Inventory Alerts</h2>
            </div>
            <div className="space-y-2">
              {inventoryAlerts.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <div>
                    <p className="text-sm font-semibold text-[var(--dxp-text)]">{item.name}</p>
                    <p className="text-xs text-[var(--dxp-text-muted)]">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status="pending" label={`${item.qty} left`} />
                    <p className="text-[10px] text-[var(--dxp-text-muted)] mt-0.5">Reorder at {item.reorderPoint}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Staff on Duty */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-blue-500" />
              <h2 className="text-base font-bold text-[var(--dxp-text)]">Staff on Duty</h2>
              <Badge variant="info">{staffOnDuty.length} active</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {staffOnDuty.map((name) => (
                <span
                  key={name}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    name.includes('Manager')
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {name}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Weekly/Monthly Stats */}
      <div className="mb-6">
        <StatsDisplay
          columns={3}
          stats={[
            { label: 'This Week', value: 87450, format: 'currency' },
            { label: 'This Month', value: 342891, format: 'currency' },
            { label: 'YoY Growth', value: 8.3, format: 'percent', delta: { value: 8.3, label: 'vs last year' } },
          ]}
        />
      </div>
    </div>
  );
}
