import React, { useState, useMemo } from 'react';
import { DataTable, FilterBar, StatusBadge, StatsDisplay, DetailPanel, StepIndicator, Badge, Card } from '@dxp/ui';
import { Package, Clock, DollarSign } from 'lucide-react';
import { orders, type Order, type OrderStatus } from '../../data/mock-orders';

const statusFilters = [
  { key: 'all', label: 'All Orders', value: 'all' },
  { key: 'processing', label: 'Processing', value: 'processing' },
  { key: 'ready-for-pickup', label: 'Ready for Pickup', value: 'ready-for-pickup' },
  { key: 'shipped', label: 'Shipped', value: 'shipped' },
  { key: 'delivered', label: 'Delivered', value: 'delivered' },
  { key: 'returned', label: 'Returned', value: 'returned' },
];

const statusBadgeMap: Record<OrderStatus, 'pending' | 'in-review' | 'approved' | 'rejected'> = {
  'processing': 'pending',
  'ready-for-pickup': 'in-review',
  'shipped': 'in-review',
  'delivered': 'approved',
  'returned': 'rejected',
  'cancelled': 'rejected',
};

const statusLabels: Record<OrderStatus, string> = {
  'processing': 'Processing',
  'ready-for-pickup': 'Ready for Pickup',
  'shipped': 'Shipped',
  'delivered': 'Delivered',
  'returned': 'Returned',
  'cancelled': 'Cancelled',
};

function getOrderSteps(status: OrderStatus) {
  const steps = [
    { label: 'Ordered', description: 'Order confirmed' },
    { label: 'Processing', description: 'Being prepared' },
    { label: 'Shipped', description: 'On the way' },
    { label: 'Delivered', description: 'At your door' },
  ];
  const stepIndex: Record<OrderStatus, number> = {
    'processing': 1,
    'ready-for-pickup': 2,
    'shipped': 2,
    'delivered': 3,
    'returned': 3,
    'cancelled': 0,
  };
  return { steps, currentStep: stepIndex[status] ?? 0 };
}

interface OrderRow {
  id: string;
  date: string;
  itemCount: number;
  total: string;
  status: OrderStatus;
}

export function OrderHistory() {
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleToggle = (key: string) => {
    if (key === 'all') {
      setActiveFilters(['all']);
    } else {
      const without = activeFilters.filter((k) => k !== 'all');
      if (without.includes(key)) {
        const updated = without.filter((k) => k !== key);
        setActiveFilters(updated.length === 0 ? ['all'] : updated);
      } else {
        setActiveFilters([...without, key]);
      }
    }
  };

  const filtered = useMemo(() => {
    if (activeFilters.includes('all')) return orders;
    return orders.filter((o) => activeFilters.includes(o.status));
  }, [activeFilters]);

  const tableData: OrderRow[] = filtered.map((o) => ({
    id: o.id,
    date: o.date,
    itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
    total: `$${o.total.toFixed(2)}`,
    status: o.status,
  }));

  // Stats
  const totalOrders = orders.length;
  const totalSpent = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'returned').reduce((s, o) => s + o.total, 0);
  const avgOrder = totalSpent / totalOrders;

  const { steps: orderSteps, currentStep } = selectedOrder
    ? getOrderSteps(selectedOrder.status)
    : { steps: [], currentStep: 0 };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Order History</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Track and manage all your orders</p>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <StatsDisplay
          stats={[
            { label: 'Total Orders', value: totalOrders, format: 'number' },
            { label: 'Total Spent', value: totalSpent, format: 'currency' },
            { label: 'Avg Order Value', value: avgOrder, format: 'currency' },
          ]}
        />
      </div>

      {/* Filters */}
      <div className="mb-4">
        <FilterBar
          filters={statusFilters}
          activeFilters={activeFilters}
          onToggle={handleToggle}
          onClear={() => setActiveFilters(['all'])}
        />
      </div>

      {/* Table */}
      <DataTable<OrderRow>
        columns={[
          {
            key: 'id',
            header: 'Order #',
            render: (val: unknown) => (
              <span className="text-sm font-bold text-[var(--dxp-brand)] cursor-pointer hover:underline">{val as string}</span>
            ),
            sortable: true,
          },
          { key: 'date', header: 'Date', sortable: true },
          {
            key: 'itemCount',
            header: 'Items',
            render: (val: unknown) => <span>{val as number} items</span>,
          },
          {
            key: 'total',
            header: 'Total',
            sortable: true,
            render: (val: unknown) => <span className="font-semibold">{val as string}</span>,
          },
          {
            key: 'status',
            header: 'Status',
            render: (val: unknown) => {
              const s = val as OrderStatus;
              return <StatusBadge status={statusBadgeMap[s]} label={statusLabels[s]} />;
            },
          },
        ]}
        data={tableData}
        onRowClick={(row) => {
          const order = orders.find((o) => o.id === row.id);
          if (order) setSelectedOrder(order);
        }}
      />

      {/* Detail Panel */}
      <DetailPanel
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.id || ''}`}
      >
        {selectedOrder && (
          <div>
            {/* Status */}
            <div className="flex items-center gap-2 mb-4">
              <StatusBadge status={statusBadgeMap[selectedOrder.status]} label={statusLabels[selectedOrder.status]} />
              <span className="text-xs text-[var(--dxp-text-muted)]">Placed {selectedOrder.date}</span>
            </div>

            {/* Order Timeline */}
            {selectedOrder.status !== 'cancelled' && (
              <div className="mb-6">
                <StepIndicator steps={orderSteps} currentStep={currentStep} />
              </div>
            )}

            {selectedOrder.status === 'cancelled' && (
              <Card className="p-4 mb-6 bg-red-50 border-red-200">
                <p className="text-sm font-semibold text-red-700">This order was cancelled</p>
              </Card>
            )}

            {/* Items */}
            <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-3">Items</h3>
            <div className="space-y-2 mb-6">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-[var(--dxp-border-light)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--dxp-text)]">{item.name}</p>
                    <p className="text-xs text-[var(--dxp-text-muted)]">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                  </div>
                  <span className="text-sm font-semibold text-[var(--dxp-text)]">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-[var(--dxp-text-muted)]">Subtotal</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--dxp-text-muted)]">Tax</span>
                <span>${selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[var(--dxp-border)] font-bold">
                <span>Total</span>
                <span>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery info */}
            <Card className="p-4">
              <h4 className="text-sm font-bold text-[var(--dxp-text)] mb-2">Delivery Details</h4>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={selectedOrder.deliveryMethod === 'pickup' ? 'info' : 'default'}>
                  {selectedOrder.deliveryMethod === 'pickup' ? 'Store Pickup' : 'Home Delivery'}
                </Badge>
              </div>
              {selectedOrder.storeId && (
                <p className="text-xs text-[var(--dxp-text-muted)]">Store: {selectedOrder.storeId}</p>
              )}
              {selectedOrder.trackingNumber && (
                <p className="text-xs text-[var(--dxp-text-muted)] mt-1">
                  Tracking: <span className="font-mono">{selectedOrder.trackingNumber}</span>
                </p>
              )}
            </Card>
          </div>
        )}
      </DetailPanel>
    </div>
  );
}
