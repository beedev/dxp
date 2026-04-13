import React from 'react';
import { Card, StatsDisplay, DataTable, Chart, Badge } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { Users, Lightbulb, TrendingUp } from 'lucide-react';

// Top customers mock data
interface TopCustomer {
  name: string;
  tier: 'Platinum' | 'Gold' | 'Silver';
  lifetimeSpend: number;
  lastVisit: string;
  avgTicket: number;
}

const topCustomers: TopCustomer[] = [
  { name: 'Robert & Linda Mitchell', tier: 'Platinum', lifetimeSpend: 14820, lastVisit: '2026-04-08', avgTicket: 187 },
  { name: 'Garcia Construction LLC', tier: 'Platinum', lifetimeSpend: 12450, lastVisit: '2026-04-07', avgTicket: 342 },
  { name: 'James Kowalski', tier: 'Platinum', lifetimeSpend: 9870, lastVisit: '2026-04-06', avgTicket: 156 },
  { name: 'Patel Home Renovations', tier: 'Gold', lifetimeSpend: 8340, lastVisit: '2026-04-05', avgTicket: 278 },
  { name: 'Sarah & David Chen', tier: 'Gold', lifetimeSpend: 7210, lastVisit: '2026-04-04', avgTicket: 124 },
  { name: 'Thompson Property Mgmt', tier: 'Gold', lifetimeSpend: 6890, lastVisit: '2026-04-03', avgTicket: 215 },
  { name: 'Emily Rodriguez', tier: 'Gold', lifetimeSpend: 5420, lastVisit: '2026-04-02', avgTicket: 98 },
  { name: 'Mike O\'Brien', tier: 'Silver', lifetimeSpend: 4150, lastVisit: '2026-04-01', avgTicket: 87 },
  { name: 'Naperville School District', tier: 'Silver', lifetimeSpend: 3890, lastVisit: '2026-03-28', avgTicket: 432 },
  { name: 'Williams Landscaping', tier: 'Silver', lifetimeSpend: 3540, lastVisit: '2026-03-25', avgTicket: 165 },
];

const tierVariant: Record<string, 'info' | 'warning' | 'default'> = {
  Platinum: 'info',
  Gold: 'warning',
  Silver: 'default',
};

const customerColumns: Column<TopCustomer>[] = [
  { key: 'name', header: 'Customer', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'tier', header: 'Tier', render: (v: unknown) => <Badge variant={tierVariant[v as string] || 'default'}>{v as string}</Badge> },
  { key: 'lifetimeSpend', header: 'Lifetime Spend', render: (v: unknown) => `$${(v as number).toLocaleString()}` },
  { key: 'lastVisit', header: 'Last Visit' },
  { key: 'avgTicket', header: 'Avg Ticket', render: (v: unknown) => `$${v as number}` },
];

// Spend by category for chart
const spendByCategory = [
  { category: 'Paint', revenue: 42800 },
  { category: 'Tools', revenue: 38200 },
  { category: 'Plumbing', revenue: 28900 },
  { category: 'Outdoor', revenue: 24600 },
  { category: 'Electrical', revenue: 21300 },
  { category: 'Hardware', revenue: 15400 },
  { category: 'Seasonal', revenue: 8900 },
];

// Purchase pattern insights
const insights = [
  {
    icon: '🎨',
    title: 'Paint + Brush Combo',
    description: 'Paint buyers also buy brushes and rollers 73% of the time. Consider bundled promotions.',
  },
  {
    icon: '📅',
    title: 'Weekend Traffic Surge',
    description: 'Weekend traffic up 15% vs weekday. Saturday 10am-2pm is peak. Schedule specialists accordingly.',
  },
  {
    icon: '🔧',
    title: 'Tool Department Drives Value',
    description: 'Tool department drives highest avg ticket at $89. Power tool buyers have 2.4x higher lifetime value.',
  },
];

export function CustomerInsights() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Customer Insights</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">ACE Hardware — Naperville, IL &middot; Loyalty Program Analytics</p>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <StatsDisplay
          stats={[
            { label: 'Total Members', value: 2847, format: 'number' },
            { label: 'Avg Monthly Spend', value: 312, format: 'currency' },
            { label: 'Platinum Tier', value: 12, format: 'percent', delta: { value: 2.1, label: 'vs last quarter' } },
            { label: 'Retention Rate', value: 89, format: 'percent', delta: { value: 3.2, label: 'vs last year' } },
          ]}
        />
      </div>

      {/* Spend by Category Chart */}
      <div className="mb-6">
        <Chart
          type="bar"
          title="Loyalty Member Spend by Category"
          description="How members spend across departments (trailing 12 months)"
          data={spendByCategory}
          xKey="category"
          yKeys={['revenue']}
          height={280}
          colors={['#D50032']}
        />
      </div>

      {/* Top Customers Table */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-[var(--dxp-text)] mb-3">Top Customers</h2>
        <DataTable columns={customerColumns} data={topCustomers} />
      </div>

      {/* Purchase Patterns */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={18} className="text-amber-500" />
          <h2 className="text-lg font-bold text-[var(--dxp-text)]">Purchase Patterns</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, idx) => (
            <Card key={idx} className="p-4 border border-[var(--dxp-border)]">
              <div className="text-2xl mb-2">{insight.icon}</div>
              <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-1">{insight.title}</h3>
              <p className="text-xs text-[var(--dxp-text-secondary)] leading-relaxed">{insight.description}</p>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
