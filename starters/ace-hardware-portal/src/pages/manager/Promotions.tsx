import React, { useState, useMemo } from 'react';
import { StatsDisplay, DataTable, FilterBar, StatusBadge, Chart, Badge } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { promotions, coupons, promoPerformanceChart } from '../../data/mock-promotions';
import type { Promotion, Coupon } from '../../data/mock-promotions';

const statusFilters = [
  { key: 'all', label: 'All', value: 'all' },
  { key: 'active', label: 'Active', value: 'active' },
  { key: 'scheduled', label: 'Scheduled', value: 'scheduled' },
  { key: 'expired', label: 'Expired', value: 'expired' },
  { key: 'draft', label: 'Draft', value: 'draft' },
];

const statusMap: Record<string, 'approved' | 'pending' | 'denied'> = {
  active: 'approved',
  scheduled: 'pending',
  expired: 'denied',
  draft: 'pending',
};

const promoColumns: Column<Promotion>[] = [
  { key: 'name', header: 'Promotion', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'type', header: 'Type', render: (v: unknown) => <Badge variant="info">{(v as string).toUpperCase()}</Badge> },
  { key: 'discount', header: 'Discount', render: (v: unknown, row: Promotion) => row.type === 'percentage' || row.type === 'bogo' ? `${v}%` : `$${v}` },
  { key: 'startDate', header: 'Start' },
  { key: 'endDate', header: 'End' },
  { key: 'redemptions', header: 'Redeemed', render: (v: unknown) => (v as number).toLocaleString() },
  { key: 'revenue', header: 'Revenue', render: (v: unknown) => `$${(v as number).toLocaleString()}` },
  {
    key: 'status', header: 'Status',
    render: (v: unknown) => {
      const s = v as string;
      return <StatusBadge status={statusMap[s] || 'pending'} label={s.charAt(0).toUpperCase() + s.slice(1)} />;
    },
  },
];

const couponColumns: Column<Coupon>[] = [
  { key: 'code', header: 'Code', render: (v: unknown) => <span className="font-mono font-bold text-[var(--dxp-brand)]">{v as string}</span> },
  { key: 'promotionName', header: 'Promotion' },
  { key: 'usageCount', header: 'Used', render: (v: unknown, row: Coupon) => `${v}/${row.maxUsage}` },
  {
    key: 'status', header: 'Status',
    render: (v: unknown) => {
      const s = v as string;
      const map: Record<string, 'approved' | 'pending' | 'denied'> = { active: 'approved', expired: 'denied', exhausted: 'denied' };
      return <StatusBadge status={map[s] || 'pending'} label={s.charAt(0).toUpperCase() + s.slice(1)} />;
    },
  },
];

export function Promotions() {
  const [active, setActive] = useState<string[]>(['all']);

  const activePromos = promotions.filter((p) => p.status === 'active').length;
  const totalRedemptions = promotions.reduce((s, p) => s + p.redemptions, 0);
  const totalRevenue = promotions.reduce((s, p) => s + p.revenue, 0);

  const filtered = useMemo(() => {
    if (active.includes('all')) return promotions;
    return promotions.filter((p) => active.includes(p.status));
  }, [active]);

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
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Promotions</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Campaign management and coupon performance</p>
      </div>

      <div className="mb-6">
        <StatsDisplay
          stats={[
            { label: 'Active Promos', value: activePromos, format: 'number' },
            { label: 'Total Redemptions', value: totalRedemptions, format: 'number' },
            { label: 'Revenue Impact', value: totalRevenue, format: 'currency' },
            { label: 'Active Coupons', value: coupons.filter((c) => c.status === 'active').length, format: 'number' },
          ]}
        />
      </div>

      <div className="mb-6">
        <Chart
          type="bar"
          title="Promotion Performance"
          description="Redemptions by campaign"
          data={promoPerformanceChart}
          xKey="name"
          yKeys={['redemptions']}
          height={280}
          colors={['#D50032']}
        />
      </div>

      <div className="mb-4">
        <FilterBar
          filters={statusFilters}
          activeFilters={active}
          onToggle={handleToggle}
          onClear={() => setActive(['all'])}
        />
      </div>

      <div className="mb-8">
        <DataTable columns={promoColumns} data={filtered} />
      </div>

      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Coupon Codes</h2>
      <DataTable columns={couponColumns} data={coupons} />
    </div>
  );
}
