import React, { useState, useMemo } from 'react';
import { Card, StatsDisplay, DataTable, FilterBar, StatusBadge, Badge } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { suppliers, purchaseOrders, vendorScorecards } from '../../data/mock-suppliers';
import type { PurchaseOrder, VendorScorecard } from '../../data/mock-suppliers';

const statusFilters = [
  { key: 'all', label: 'All', value: 'all' },
  { key: 'draft', label: 'Draft', value: 'draft' },
  { key: 'submitted', label: 'Submitted', value: 'submitted' },
  { key: 'confirmed', label: 'Confirmed', value: 'confirmed' },
  { key: 'shipped', label: 'Shipped', value: 'shipped' },
  { key: 'delivered', label: 'Delivered', value: 'delivered' },
  { key: 'cancelled', label: 'Cancelled', value: 'cancelled' },
];

const statusMap: Record<string, 'approved' | 'pending' | 'denied' | 'rejected'> = {
  delivered: 'approved',
  confirmed: 'approved',
  shipped: 'pending',
  submitted: 'pending',
  draft: 'pending',
  cancelled: 'rejected',
};

const poColumns: Column<PurchaseOrder>[] = [
  { key: 'id', header: 'PO #', render: (v: unknown) => <span className="font-mono font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'supplierName', header: 'Supplier' },
  { key: 'totalAmount', header: 'Amount', render: (v: unknown) => `$${(v as number).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
  { key: 'createdDate', header: 'Created' },
  { key: 'expectedDelivery', header: 'Expected' },
  {
    key: 'status', header: 'Status',
    render: (v: unknown) => {
      const s = v as string;
      return <StatusBadge status={statusMap[s] || 'pending'} label={s.charAt(0).toUpperCase() + s.slice(1)} />;
    },
  },
];

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export function SupplierOrders() {
  const [active, setActive] = useState<string[]>(['all']);

  const pendingPOs = purchaseOrders.filter((po) => ['draft', 'submitted', 'confirmed', 'shipped'].includes(po.status));
  const pendingValue = pendingPOs.reduce((s, po) => s + po.totalAmount, 0);
  const avgLead = Math.round(suppliers.reduce((s, sup) => s + sup.leadTimeDays, 0) / suppliers.length);

  const filtered = useMemo(() => {
    if (active.includes('all')) return purchaseOrders;
    return purchaseOrders.filter((po) => active.includes(po.status));
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
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Supplier Orders</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Purchase orders and vendor management</p>
      </div>

      <div className="mb-6">
        <StatsDisplay
          stats={[
            { label: 'Total POs', value: purchaseOrders.length, format: 'number' },
            { label: 'Pending Value', value: pendingValue, format: 'currency' },
            { label: 'Avg Lead Time', value: avgLead, format: 'number', delta: { value: 0, label: 'days' } },
            { label: 'Active Suppliers', value: suppliers.filter((s) => s.status === 'active').length, format: 'number' },
          ]}
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

      <p className="text-sm text-[var(--dxp-text-muted)] mb-4">Showing {filtered.length} of {purchaseOrders.length} orders</p>

      <div className="mb-8">
        <DataTable columns={poColumns} data={filtered} />
      </div>

      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Vendor Scorecards</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {vendorScorecards.map((sc) => {
          const borderColor = sc.overallScore >= 92 ? 'border-l-emerald-500' : sc.overallScore >= 86 ? 'border-l-amber-500' : 'border-l-red-500';
          return (
            <Card key={sc.supplierId} className={`p-4 border-l-4 ${borderColor}`}>
              <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-2 truncate">{sc.supplierName}</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--dxp-text-muted)]">Overall</span>
                  <span className="font-bold text-[var(--dxp-text)]">{sc.overallScore}/100</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--dxp-text-muted)]">Quality</span>
                  <span className="font-semibold">{sc.qualityScore}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--dxp-text-muted)]">Delivery</span>
                  <span className="font-semibold">{sc.deliveryScore}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--dxp-text-muted)]">Trend</span>
                  <Badge variant={sc.trend === 'improving' ? 'success' : sc.trend === 'stable' ? 'info' : 'danger'}>{sc.trend}</Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
