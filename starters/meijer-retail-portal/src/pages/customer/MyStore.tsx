import React, { useState } from 'react';
import { Card, Tabs, DataTable, Badge } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { MapPin, Phone, Clock } from 'lucide-react';
import { stores } from '../../data/mock-stores';
import { services } from '../../data/mock-services';
import type { ServiceOffering } from '../../data/mock-services';

const store = stores[0]; // S001 — Naperville

const hourColumns: Column<{ day: string; open: string; close: string }>[] = [
  { key: 'day', header: 'Day', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'open', header: 'Open' },
  { key: 'close', header: 'Close' },
];

const deptColumns: Column<{ name: string; index: number }>[] = [
  { key: 'index', header: '#', render: (v: unknown) => <span className="text-[var(--dxp-text-muted)]">{v as number}</span> },
  { key: 'name', header: 'Department', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
];

const serviceColumns: Column<ServiceOffering>[] = [
  { key: 'name', header: 'Service', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'priceLabel', header: 'Price' },
  { key: 'duration', header: 'Duration' },
  {
    key: 'requiresAppointment', header: 'Appointment',
    render: (v: unknown) => (v as boolean)
      ? <Badge variant="warning">Required</Badge>
      : <Badge variant="success">Walk-in</Badge>,
  },
];

const tabs = [
  { key: 'info', label: 'Store Info' },
  { key: 'departments', label: 'Departments' },
  { key: 'services', label: 'Services' },
];

export function MyStore() {
  const [activeTab, setActiveTab] = useState('info');

  const deptRows = store.departments.map((d, i) => ({ name: d, index: i + 1 }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">My Store</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">{store.name}</p>
      </div>

      {/* Store header card */}
      <Card className="p-6 mb-6">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-[var(--dxp-brand)] mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[var(--dxp-text)]">{store.address}</p>
              <p className="text-sm text-[var(--dxp-text-secondary)]">{store.city}, {store.state} {store.zip}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={18} className="text-[var(--dxp-brand)] mt-0.5" />
            <p className="text-sm font-semibold text-[var(--dxp-text)]">{store.phone}</p>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={18} className="text-[var(--dxp-brand)] mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[var(--dxp-text)]">Today: {store.hours[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.open} – {store.hours[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.close}</p>
              <p className="text-xs text-[var(--dxp-text-muted)]">Manager: {store.manager}</p>
            </div>
          </div>
        </div>
      </Card>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} variant="underline" />

      <div className="mt-4">
        {activeTab === 'info' && (
          <div>
            <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Store Hours</h2>
            <DataTable columns={hourColumns} data={store.hours} />
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <p className="text-2xl font-extrabold text-[var(--dxp-brand)]">{store.employeeCount}</p>
                <p className="text-xs text-[var(--dxp-text-muted)] mt-1">Team Members</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-extrabold text-[var(--dxp-brand)]">{store.departments.length}</p>
                <p className="text-xs text-[var(--dxp-text-muted)] mt-1">Departments</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-extrabold text-[var(--dxp-brand)]">{store.services.length}</p>
                <p className="text-xs text-[var(--dxp-text-muted)] mt-1">Services</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-extrabold text-emerald-600">{store.customerSatScore}/100</p>
                <p className="text-xs text-[var(--dxp-text-muted)] mt-1">Satisfaction</p>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'departments' && (
          <DataTable columns={deptColumns} data={deptRows} />
        )}

        {activeTab === 'services' && (
          <DataTable columns={serviceColumns} data={services} />
        )}
      </div>
    </div>
  );
}
