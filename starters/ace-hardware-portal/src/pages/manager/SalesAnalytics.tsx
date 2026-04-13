import React, { useState, useMemo } from 'react';
import { StatsDisplay, DataTable, Chart, Tabs, Badge } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { dailySales, categoryBreakdown, topSellers, monthlyRevenue } from '../../data/mock-sales';

interface CategoryRow {
  category: string;
  revenue: number;
  units: number;
  pctOfTotal: number;
}

interface TopSellerRow {
  productId: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
}

const categoryColumns: Column<CategoryRow>[] = [
  { key: 'category', header: 'Category', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'revenue', header: 'Revenue', render: (v: unknown) => `$${(v as number).toLocaleString()}` },
  { key: 'units', header: 'Units Sold' },
  {
    key: 'pctOfTotal',
    header: '% of Total',
    render: (v: unknown) => (
      <div className="flex items-center gap-2">
        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--dxp-brand)] rounded-full" style={{ width: `${v as number}%` }} />
        </div>
        <span className="text-xs">{v as number}%</span>
      </div>
    ),
  },
];

const topSellersColumns: Column<TopSellerRow>[] = [
  { key: 'name', header: 'Product', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'category', header: 'Category', render: (v: unknown) => <Badge variant="info">{v as string}</Badge> },
  { key: 'unitsSold', header: 'Units' },
  { key: 'revenue', header: 'Revenue', render: (v: unknown) => `$${(v as number).toLocaleString()}` },
];

const tabs = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

export function SalesAnalytics() {
  const [activeTab, setActiveTab] = useState('daily');

  // Compute stats for each period
  const last7 = dailySales.slice(-7);
  const last30 = dailySales.slice(-30);

  const todayRevenue = dailySales[dailySales.length - 1]?.revenue || 0;
  const todayTransactions = dailySales[dailySales.length - 1]?.transactions || 0;
  const todayAvgTicket = dailySales[dailySales.length - 1]?.avgTicket || 0;
  const yesterdayRevenue = dailySales[dailySales.length - 2]?.revenue || 1;
  const dailyDelta = Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 * 10) / 10;

  const weekRevenue = last7.reduce((sum, d) => sum + d.revenue, 0);
  const weekTransactions = last7.reduce((sum, d) => sum + d.transactions, 0);
  const weekAvgTicket = Math.round(weekRevenue / weekTransactions);
  const priorWeek = dailySales.slice(-14, -7);
  const priorWeekRevenue = priorWeek.reduce((sum, d) => sum + d.revenue, 0);
  const weekDelta = Math.round(((weekRevenue - priorWeekRevenue) / priorWeekRevenue) * 100 * 10) / 10;

  const monthRevenue = last30.reduce((sum, d) => sum + d.revenue, 0);
  const monthTransactions = last30.reduce((sum, d) => sum + d.transactions, 0);
  const monthAvgTicket = Math.round(monthRevenue / monthTransactions);

  const stats = useMemo(() => {
    switch (activeTab) {
      case 'daily':
        return [
          { label: "Today's Revenue", value: todayRevenue, format: 'currency' as const },
          { label: 'Transactions', value: todayTransactions, format: 'number' as const },
          { label: 'Avg Ticket', value: todayAvgTicket, format: 'currency' as const },
          { label: 'vs Yesterday', value: dailyDelta, format: 'percent' as const, delta: { value: dailyDelta, label: dailyDelta >= 0 ? 'higher' : 'lower' } },
        ];
      case 'weekly':
        return [
          { label: 'Week Revenue', value: weekRevenue, format: 'currency' as const },
          { label: 'Transactions', value: weekTransactions, format: 'number' as const },
          { label: 'Avg Ticket', value: weekAvgTicket, format: 'currency' as const },
          { label: 'vs Prior Week', value: weekDelta, format: 'percent' as const, delta: { value: weekDelta, label: weekDelta >= 0 ? 'higher' : 'lower' } },
        ];
      case 'monthly':
        return [
          { label: 'Month Revenue', value: monthRevenue, format: 'currency' as const },
          { label: 'Transactions', value: monthTransactions, format: 'number' as const },
          { label: 'Avg Ticket', value: monthAvgTicket, format: 'currency' as const },
          { label: 'YoY Growth', value: 8.3, format: 'percent' as const, delta: { value: 8.3, label: 'vs last year' } },
        ];
      default:
        return [];
    }
  }, [activeTab, todayRevenue, todayTransactions, todayAvgTicket, dailyDelta, weekRevenue, weekTransactions, weekAvgTicket, weekDelta, monthRevenue, monthTransactions, monthAvgTicket]);

  const chartData = useMemo(() => {
    switch (activeTab) {
      case 'daily':
        return dailySales.slice(-7).map((d) => ({ label: d.date.split('-').slice(1).join('/'), revenue: d.revenue }));
      case 'weekly': {
        // Group into weeks
        const weeks: { label: string; revenue: number }[] = [];
        for (let i = 0; i < 4; i++) {
          const weekSlice = dailySales.slice(-(i + 1) * 7, -i * 7 || undefined);
          const rev = weekSlice.reduce((s, d) => s + d.revenue, 0);
          weeks.unshift({ label: `Week ${4 - i}`, revenue: rev });
        }
        return weeks;
      }
      case 'monthly':
        return monthlyRevenue.map((m) => ({ label: m.month, revenue: m.revenue }));
      default:
        return [];
    }
  }, [activeTab]);

  // Top 5 categories for bar chart
  const topCategories = categoryBreakdown.slice(0, 5).map((c) => ({
    category: c.category.length > 12 ? c.category.substring(0, 12) + '...' : c.category,
    revenue: c.revenue,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Sales Analytics</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">ACE Hardware — Naperville, IL</p>
      </div>

      {/* Period Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={tabs}
          active={activeTab}
          onChange={setActiveTab}
          variant="pill"
        />
      </div>

      {/* Period Stats */}
      <div className="mb-6">
        <StatsDisplay stats={stats} />
      </div>

      {/* Revenue Chart */}
      <div className="mb-6">
        <Chart
          type={activeTab === 'daily' ? 'bar' : 'line'}
          title={`${activeTab === 'daily' ? 'Daily' : activeTab === 'weekly' ? 'Weekly' : 'Monthly'} Revenue`}
          description={activeTab === 'daily' ? 'Last 7 days' : activeTab === 'weekly' ? 'Last 4 weeks' : 'Last 12 months'}
          data={chartData}
          xKey="label"
          yKeys={['revenue']}
          height={280}
          colors={['#D50032']}
        />
      </div>

      {/* Two-Column: Category Breakdown + Top Categories Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-base font-bold text-[var(--dxp-text)] mb-3">Category Breakdown</h2>
          <DataTable columns={categoryColumns} data={categoryBreakdown} />
        </div>
        <div>
          <Chart
            type="bar"
            title="Top 5 Categories by Revenue"
            data={topCategories}
            xKey="category"
            yKeys={['revenue']}
            height={280}
            colors={['#D50032']}
          />
        </div>
      </div>

      {/* Top 10 Products */}
      <div>
        <h2 className="text-base font-bold text-[var(--dxp-text)] mb-3">Top 10 Products</h2>
        <DataTable columns={topSellersColumns} data={topSellers} />
      </div>
    </div>
  );
}
