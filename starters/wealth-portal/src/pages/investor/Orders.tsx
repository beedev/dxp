import React, { useState, useEffect } from 'react';
import { Tabs, DataTable, StatusBadge, Button, type Column } from '@dxp/ui';
import type { PaperOrder } from '../../data/mock-portfolio';
import { useRegion, useRegionMock } from '../../contexts/RegionContext';

export function Orders() {
  const { region } = useRegion();
  const { paperOrders: mockOrders } = useRegionMock();
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');

  // Fetch live orders from BFF paper trading, fall back to mock if unavailable
  const [liveOrders, setLiveOrders] = useState<any[] | null>(null);
  const BFF = 'http://localhost:4201/api';
  const fetchOrders = () => {
    fetch(`${BFF}/v1/paper/orders`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setLiveOrders(Array.isArray(data) ? data : data.orders || []);
      })
      .catch(() => {});
  };
  useEffect(() => { fetchOrders(); }, []);

  const orders = liveOrders ?? mockOrders;

  const handleCancel = (id: string) => {
    fetch(`${BFF}/v1/paper/orders/${id}`, { method: 'DELETE' })
      .then(() => fetchOrders())
      .catch(() => {});
  };

  const openOrders    = orders.filter((o) => o.status === 'pending');
  const historyOrders = orders.filter((o) => o.status === 'filled' || o.status === 'cancelled');

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(region.currency.locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const openOrdersColumns: Column<PaperOrder>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (_, row) => (
        <div>
          <p className="font-mono font-bold text-[var(--dxp-text)]">{row.symbol}</p>
          <p className="text-[10px] text-[var(--dxp-text-muted)]">{row.exchange}</p>
        </div>
      ),
    },
    {
      key: 'side',
      header: 'Side',
      render: (val) => (
        <StatusBadge
          status={(val as string) === 'buy' ? 'approved' : 'rejected'}
          label={(val as string).toUpperCase()}
        />
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (val) => <span className="text-xs uppercase text-[var(--dxp-text-secondary)]">{val as string}</span>,
    },
    {
      key: 'qty',
      header: 'Qty',
      render: (val) => <span className="font-mono text-[var(--dxp-text)]">{(val as number).toLocaleString(region.currency.locale)}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      render: (val, row) => (
        <span className="font-mono text-[var(--dxp-text)]">
          {(val as number).toLocaleString(region.currency.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {row.currency}
        </span>
      ),
    },
    {
      key: 'estimatedValue',
      header: 'Est. Value',
      render: (val, row) => (
        <span className="font-mono text-[var(--dxp-text)]">
          {(val as number).toLocaleString(region.currency.locale)} {row.currency}
        </span>
      ),
    },
    {
      key: 'validity',
      header: 'Validity',
      render: (val) => <span className="text-xs text-[var(--dxp-text-secondary)]">{val as string}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (val) => <span className="text-xs text-[var(--dxp-text-muted)]">{formatDate(val as string)}</span>,
    },
    {
      key: 'id',
      header: 'Action',
      render: (val) => (
        <Button variant="danger" size="sm" onClick={() => handleCancel(val as string)}>
          Cancel
        </Button>
      ),
    },
  ];

  const historyColumns: Column<PaperOrder>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (_, row) => (
        <div>
          <p className="font-mono font-bold text-[var(--dxp-text)]">{row.symbol}</p>
          <p className="text-[10px] text-[var(--dxp-text-muted)]">{row.exchange}</p>
        </div>
      ),
    },
    {
      key: 'side',
      header: 'Side',
      render: (val) => (
        <StatusBadge
          status={(val as string) === 'buy' ? 'approved' : 'rejected'}
          label={(val as string).toUpperCase()}
        />
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (val) => <span className="text-xs uppercase text-[var(--dxp-text-secondary)]">{val as string}</span>,
    },
    {
      key: 'filledQty',
      header: 'Qty',
      render: (val, row) => (
        <span className="font-mono text-[var(--dxp-text)]">{((val as number) || row.qty).toLocaleString(region.currency.locale)}</span>
      ),
    },
    {
      key: 'avgFillPrice',
      header: 'Fill Price',
      render: (val, row) => (
        <span className="font-mono text-[var(--dxp-text)]">
          {((val as number | undefined) ?? row.price).toLocaleString(region.currency.locale, { minimumFractionDigits: 2 })} {row.currency}
        </span>
      ),
    },
    {
      key: 'estimatedValue',
      header: 'Value',
      render: (val, row) => (
        <span className="font-mono text-[var(--dxp-text)]">
          {(val as number).toLocaleString(region.currency.locale)} {row.currency}
        </span>
      ),
    },
    {
      key: 'pnl',
      header: 'P&L',
      render: (val) => {
        const pnl = val as number | undefined;
        if (pnl === undefined) return <span className="text-[var(--dxp-text-muted)]">—</span>;
        return (
          <span className={`font-mono font-semibold text-sm ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {pnl >= 0 ? '+' : ''}{pnl}
          </span>
        );
      },
    },
    {
      key: 'updatedAt',
      header: 'Date',
      render: (val) => <span className="text-xs text-[var(--dxp-text-muted)]">{formatDate(val as string)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => (
        <StatusBadge status={(val as string) as 'pending' | 'filled' | 'cancelled' | 'partial'} />
      ),
    },
  ];

  const tabItems = [
    { key: 'open', label: `Open Orders (${openOrders.length})` },
    { key: 'history', label: 'Order History' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Orders</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">{region.flag} {region.name} paper trading orders · All simulated</p>
      </div>

      <div className="mb-4">
        <Tabs
          tabs={tabItems}
          active={activeTab}
          onChange={(key) => setActiveTab(key as 'open' | 'history')}
          variant="underline"
        />
      </div>

      {activeTab === 'open' && (
        <DataTable<PaperOrder>
          columns={openOrdersColumns}
          data={openOrders}
          emptyMessage="No open orders"
        />
      )}

      {activeTab === 'history' && (
        <DataTable<PaperOrder>
          columns={historyColumns}
          data={historyOrders}
          emptyMessage="No order history"
        />
      )}
    </div>
  );
}
