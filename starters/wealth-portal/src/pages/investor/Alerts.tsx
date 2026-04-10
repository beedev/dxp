import React, { useState, useEffect } from 'react';
import { Card, DataTable, StatusBadge, Button, Input, Select, type Column } from '@dxp/ui';
import type { Alert } from '../../data/mock-portfolio';
import { useRegion, useRegionMock } from '../../contexts/RegionContext';

const TYPE_LABELS: Record<string, string> = {
  'price-above': 'Price Above',
  'price-below': 'Price Below',
  'volume-spike': 'Volume Spike',
};

const ALERT_TYPE_OPTIONS = [
  { value: 'price-above', label: 'Price Above' },
  { value: 'price-below', label: 'Price Below' },
  { value: 'volume-spike', label: 'Volume Spike' },
];

export function Alerts() {
  const { region } = useRegion();
  // Region mock is source of truth — BFF alerts don't multi-region
  const { alerts: regionAlerts } = useRegionMock();

  const [alerts, setAlerts] = useState<Alert[]>(regionAlerts);
  useEffect(() => { setAlerts(regionAlerts); }, [regionAlerts]);

  const [newSymbol, setNewSymbol] = useState('');
  const [newType, setNewType] = useState<'price-above' | 'price-below' | 'volume-spike'>('price-above');
  const [newThreshold, setNewThreshold] = useState<number>(0);

  const activeAlerts = alerts.filter((a) => a.isActive);
  const triggeredAlerts = alerts.filter((a) => !a.isActive && a.triggeredAt);

  const handleDelete = (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  const handleCreate = () => {
    if (!newSymbol || !newThreshold) return;
    const newAlert: Alert = {
      id: `a${Date.now()}`,
      symbol: newSymbol.toUpperCase(),
      name: newSymbol.toUpperCase(),
      exchange: region.defaultOrderExchange,
      type: newType,
      threshold: newThreshold,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
    setNewSymbol('');
    setNewThreshold(0);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(region.currency.locale, { month: 'short', day: 'numeric', year: 'numeric' });

  const activeColumns: Column<Alert>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (_, row) => (
        <div>
          <p className="text-sm font-bold font-mono text-[var(--dxp-text)]">{row.symbol}</p>
          <p className="text-xs text-[var(--dxp-text-muted)]">{row.exchange}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (val) => <span className="text-sm text-[var(--dxp-text-secondary)]">{TYPE_LABELS[val as string] ?? (val as string)}</span>,
    },
    {
      key: 'threshold',
      header: 'Threshold',
      render: (val) => <span className="font-mono font-bold text-[var(--dxp-text)]">{(val as number).toFixed(2)}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: () => <StatusBadge status="active" />,
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
        <Button variant="danger" size="sm" onClick={() => handleDelete(val as string)}>
          Delete
        </Button>
      ),
    },
  ];

  const triggeredColumns: Column<Alert>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (_, row) => (
        <div>
          <p className="text-sm font-bold font-mono text-[var(--dxp-text)]">{row.symbol}</p>
          <p className="text-xs text-[var(--dxp-text-muted)]">{row.exchange}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (val) => <span className="text-sm text-[var(--dxp-text-secondary)]">{TYPE_LABELS[val as string] ?? (val as string)}</span>,
    },
    {
      key: 'threshold',
      header: 'Threshold',
      render: (val) => <span className="font-mono font-bold text-[var(--dxp-text)]">{(val as number).toFixed(2)}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: () => <StatusBadge status="pending" label="TRIGGERED" />,
    },
    {
      key: 'triggeredAt',
      header: 'Triggered',
      render: (val) => (
        <span className="text-xs text-[var(--dxp-text-muted)]">
          {val ? formatDate(val as string) : '—'}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Action',
      render: (val) => (
        <Button variant="danger" size="sm" onClick={() => handleDelete(val as string)}>
          Dismiss
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Price Alerts</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Get notified when stocks hit your target prices</p>
      </div>

      {/* Active alerts */}
      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Active Alerts ({activeAlerts.length})</h2>
      <div className="mb-6">
        <DataTable<Alert>
          columns={activeColumns}
          data={activeAlerts}
          emptyMessage="No active alerts"
        />
      </div>

      {/* Triggered alerts */}
      {triggeredAlerts.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Triggered Alerts</h2>
          <div className="mb-6">
            <DataTable<Alert>
              columns={triggeredColumns}
              data={triggeredAlerts}
              emptyMessage="No triggered alerts"
            />
          </div>
        </>
      )}

      {/* Create alert */}
      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-4">Create Alert</h2>
      <Card className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-[var(--dxp-text-secondary)] block mb-1">Symbol</label>
            <Input
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              placeholder={`e.g. ${region.defaultSymbol}`}
            />
          </div>
          <div>
            <Select
              options={ALERT_TYPE_OPTIONS}
              value={newType}
              onChange={(val) => setNewType(val as typeof newType)}
              label="Alert Type"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--dxp-text-secondary)] block mb-1">Threshold</label>
            <Input
              type="number"
              value={newThreshold || ''}
              onChange={(e) => setNewThreshold(Number(e.target.value))}
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={!newSymbol || !newThreshold}
            >
              Create Alert
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
