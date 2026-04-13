import React, { useState, useMemo } from 'react';
import { Card, StatsDisplay, DataTable, Input, FilterBar, StatusBadge, Badge } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { Search, AlertTriangle, Package } from 'lucide-react';
import { products } from '../../data/mock-products';
import { stockLevels, stockAlerts } from '../../data/mock-inventory';
import type { StockLevel } from '../../data/mock-inventory';

// Merge product names into stock levels for display
const inventoryRows = stockLevels.map((s) => {
  const product = products.find((p) => p.id === s.productId);
  return {
    ...s,
    productName: product?.name || s.productId,
    sku: product?.sku || '',
    category: product?.category || '',
  };
});

type InventoryRow = (typeof inventoryRows)[0];

const statusFilters = [
  { key: 'all', label: 'All', value: 'all' },
  { key: 'in-stock', label: 'In Stock', value: 'in-stock' },
  { key: 'low-stock', label: 'Low Stock', value: 'low-stock' },
  { key: 'out-of-stock', label: 'Out of Stock', value: 'out-of-stock' },
];

const deptFilters = [
  { key: 'all-dept', label: 'All Depts', value: 'all-dept' },
  { key: 'paint', label: 'Paint', value: 'paint' },
  { key: 'tools', label: 'Tools', value: 'tools' },
  { key: 'plumbing', label: 'Plumbing', value: 'plumbing' },
  { key: 'electrical', label: 'Electrical', value: 'electrical' },
  { key: 'outdoor', label: 'Outdoor', value: 'outdoor' },
  { key: 'hardware', label: 'Hardware', value: 'hardware' },
  { key: 'seasonal', label: 'Seasonal', value: 'seasonal' },
];

const columns: Column<InventoryRow>[] = [
  { key: 'productName', header: 'Product', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'sku', header: 'SKU', render: (v: unknown) => <span className="text-xs text-[var(--dxp-text-muted)] font-mono">{v as string}</span> },
  { key: 'aisle', header: 'Aisle/Bin', render: (_v: unknown, row: InventoryRow) => <span className="font-medium">{row.aisle}/{row.bin}</span> },
  { key: 'quantity', header: 'Qty', render: (v: unknown) => <span className="font-bold text-lg">{v as number}</span> },
  { key: 'reorderPoint', header: 'Reorder Pt' },
  {
    key: 'status',
    header: 'Status',
    render: (v: unknown) => {
      const s = v as string;
      if (s === 'in-stock') return <StatusBadge status="approved" label="In Stock" />;
      if (s === 'low-stock') return <StatusBadge status="pending" label="Low Stock" />;
      return <StatusBadge status="denied" label="Out of Stock" />;
    },
  },
  { key: 'lastCounted', header: 'Last Counted' },
];

export function InventoryManagement() {
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<string[]>(['all']);
  const [activeDept, setActiveDept] = useState<string[]>(['all-dept']);

  const inStockCount = stockLevels.filter((s) => s.status === 'in-stock').length;
  const lowStockCount = stockLevels.filter((s) => s.status === 'low-stock').length;
  const outOfStockCount = stockLevels.filter((s) => s.status === 'out-of-stock').length;

  const filtered = useMemo(() => {
    let result = inventoryRows;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.productName.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q),
      );
    }

    if (!activeStatus.includes('all')) {
      result = result.filter((r) => activeStatus.includes(r.status));
    }

    if (!activeDept.includes('all-dept')) {
      result = result.filter((r) => activeDept.includes(r.category));
    }

    return result;
  }, [search, activeStatus, activeDept]);

  const handleStatusToggle = (key: string) => {
    if (key === 'all') { setActiveStatus(['all']); return; }
    const without = activeStatus.filter((k) => k !== 'all');
    if (without.includes(key)) {
      const updated = without.filter((k) => k !== key);
      setActiveStatus(updated.length === 0 ? ['all'] : updated);
    } else {
      setActiveStatus([...without, key]);
    }
  };

  const handleDeptToggle = (key: string) => {
    if (key === 'all-dept') { setActiveDept(['all-dept']); return; }
    const without = activeDept.filter((k) => k !== 'all-dept');
    if (without.includes(key)) {
      const updated = without.filter((k) => k !== key);
      setActiveDept(updated.length === 0 ? ['all-dept'] : updated);
    } else {
      setActiveDept([...without, key]);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Inventory Management</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">ACE Hardware — Naperville, IL &middot; Store S001</p>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <StatsDisplay
          stats={[
            { label: 'Total SKUs', value: stockLevels.length, format: 'number' },
            { label: 'In Stock', value: inStockCount, format: 'number' },
            { label: 'Low Stock', value: lowStockCount, format: 'number', delta: { value: lowStockCount, label: 'need attention' } },
            { label: 'Out of Stock', value: outOfStockCount, format: 'number', delta: { value: -outOfStockCount, label: 'critical' } },
          ]}
        />
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dxp-text-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Status Filters */}
      <div className="mb-2">
        <FilterBar
          filters={statusFilters}
          activeFilters={activeStatus}
          onToggle={handleStatusToggle}
          onClear={() => setActiveStatus(['all'])}
        />
      </div>

      {/* Department Filters */}
      <div className="mb-4">
        <FilterBar
          filters={deptFilters}
          activeFilters={activeDept}
          onToggle={handleDeptToggle}
          onClear={() => setActiveDept(['all-dept'])}
        />
      </div>

      {/* Results count */}
      <p className="text-sm text-[var(--dxp-text-muted)] mb-4">
        Showing {filtered.length} of {inventoryRows.length} items
      </p>

      {/* Inventory Table */}
      <div className="mb-6">
        <DataTable columns={columns} data={filtered} />
      </div>

      {/* Reorder Needed */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-amber-500" />
          <h2 className="text-lg font-bold text-[var(--dxp-text)]">Reorder Needed</h2>
          <Badge variant="warning">{stockAlerts.length} items</Badge>
        </div>
        <div className="space-y-2">
          {stockAlerts.map((alert) => (
            <div key={alert.productId} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-3">
                <Package size={16} className="text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-[var(--dxp-text)]">{alert.productName}</p>
                  <p className="text-xs text-[var(--dxp-text-muted)]">Store: {alert.storeId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-red-600">{alert.currentQty} in stock</p>
                <p className="text-[10px] text-[var(--dxp-text-muted)]">Reorder at {alert.reorderPoint}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
