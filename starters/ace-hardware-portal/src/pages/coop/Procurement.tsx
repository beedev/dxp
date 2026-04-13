import React, { useState, useMemo } from 'react';
import { Card, StatsDisplay, DataTable, FilterBar, StatusBadge } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { purchaseOrders, suppliers } from '../../data/mock-suppliers';
import type { PurchaseOrder } from '../../data/mock-suppliers';

const categoryFilters = [
  { key: 'all', label: 'All Categories', value: 'all' },
  ...['Tools', 'Paint', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware'].map((c) => ({ key: c, label: c, value: c })),
];

const statusMap: Record<string, 'approved' | 'pending' | 'rejected'> = {
  delivered: 'approved', confirmed: 'approved', shipped: 'pending', submitted: 'pending', draft: 'pending', cancelled: 'rejected',
};

// Enrich POs with supplier category
const enrichedPOs = purchaseOrders.map((po) => {
  const sup = suppliers.find((s) => s.id === po.supplierId);
  return { ...po, category: sup?.category || 'Other' };
});

type EnrichedPO = (typeof enrichedPOs)[0];

const columns: Column<EnrichedPO>[] = [
  { key: 'id', header: 'PO #', render: (v: unknown) => <span className="font-mono font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'supplierName', header: 'Supplier' },
  { key: 'category', header: 'Category' },
  { key: 'totalAmount', header: 'Amount', render: (v: unknown) => `$${(v as number).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
  { key: 'expectedDelivery', header: 'Delivery' },
  {
    key: 'status', header: 'Status',
    render: (v: unknown) => {
      const s = v as string;
      return <StatusBadge status={statusMap[s] || 'pending'} label={s.charAt(0).toUpperCase() + s.slice(1)} />;
    },
  },
];

// Savings by category (simulated 12-18% below MSRP)
const savingsByCategory = ['Tools', 'Paint', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware'].map((cat) => {
  const catPOs = enrichedPOs.filter((po) => po.category === cat);
  const total = catPOs.reduce((s, po) => s + po.totalAmount, 0);
  const savingsPct = 12 + Math.random() * 6;
  return { category: cat, totalSpend: total, savings: Math.round(total * savingsPct / 100), savingsPct: +savingsPct.toFixed(1) };
});

export function Procurement() {
  const [active, setActive] = useState<string[]>(['all']);

  const totalValue = purchaseOrders.reduce((s, po) => s + po.totalAmount, 0);
  const totalSavings = savingsByCategory.reduce((s, c) => s + c.savings, 0);
  const avgLead = Math.round(suppliers.reduce((s, sup) => s + sup.leadTimeDays, 0) / suppliers.length);

  const filtered = useMemo(() => {
    if (active.includes('all')) return enrichedPOs;
    return enrichedPOs.filter((po) => active.includes(po.category));
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
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Procurement</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Cooperative bulk purchasing and savings</p>
      </div>

      <div className="mb-6">
        <StatsDisplay
          stats={[
            { label: 'Total PO Value', value: totalValue, format: 'currency' },
            { label: 'Est. Savings vs MSRP', value: totalSavings, format: 'currency' },
            { label: 'Avg Lead Time', value: avgLead, format: 'number', delta: { value: 0, label: 'days' } },
            { label: 'Active Suppliers', value: suppliers.filter((s) => s.status === 'active').length, format: 'number' },
          ]}
        />
      </div>

      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Savings by Category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {savingsByCategory.map((cat) => (
          <Card key={cat.category} className="p-4 text-center">
            <p className="text-xs text-[var(--dxp-text-muted)] mb-1">{cat.category}</p>
            <p className="text-lg font-extrabold text-emerald-600">${(cat.savings / 1000).toFixed(1)}K</p>
            <p className="text-[10px] text-[var(--dxp-text-muted)]">{cat.savingsPct}% below MSRP</p>
          </Card>
        ))}
      </div>

      <div className="mb-4">
        <FilterBar
          filters={categoryFilters}
          activeFilters={active}
          onToggle={handleToggle}
          onClear={() => setActive(['all'])}
        />
      </div>

      <p className="text-sm text-[var(--dxp-text-muted)] mb-4">Showing {filtered.length} orders</p>

      <DataTable columns={columns} data={filtered} />
    </div>
  );
}
