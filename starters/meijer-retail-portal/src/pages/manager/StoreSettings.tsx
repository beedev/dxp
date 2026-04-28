import React, { useState } from 'react';
import { Card, Tabs, DataTable, Badge, StatusBadge } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { MapPin, Phone, Clock, Users } from 'lucide-react';
import { stores } from '../../data/mock-stores';
import { services } from '../../data/mock-services';
import type { ServiceOffering } from '../../data/mock-services';

const store = stores[0]; // S001 — Naperville

const tabs = [
  { key: 'general', label: 'General' },
  { key: 'departments', label: 'Departments' },
  { key: 'services', label: 'Services' },
];

const deptColumns: Column<{ name: string; index: number }>[] = [
  { key: 'index', header: '#', render: (v: unknown) => <span className="text-[var(--dxp-text-muted)]">{v as number}</span> },
  { key: 'name', header: 'Department', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
];

const serviceColumns: Column<ServiceOffering>[] = [
  { key: 'name', header: 'Service', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'category', header: 'Category', render: (v: unknown) => <Badge variant="info">{(v as string).toUpperCase()}</Badge> },
  { key: 'priceLabel', header: 'Price' },
  { key: 'duration', header: 'Duration' },
  {
    key: 'requiresAppointment', header: 'Status',
    render: () => <StatusBadge status="approved" label="Active" />,
  },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-[var(--dxp-border)]">
      <span className="text-sm text-[var(--dxp-text-muted)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--dxp-text)]">{value}</span>
    </div>
  );
}

export function StoreSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const deptRows = store.departments.map((d, i) => ({ name: d, index: i + 1 }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Store Settings</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">{store.name} — Configuration &amp; Info</p>
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} variant="underline" />

      <div className="mt-4">
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-[var(--dxp-brand)]" />
                <h2 className="text-lg font-bold text-[var(--dxp-text)]">Location</h2>
              </div>
              <InfoRow label="Store ID" value={store.id} />
              <InfoRow label="Address" value={store.address} />
              <InfoRow label="City" value={`${store.city}, ${store.state} ${store.zip}`} />
              <InfoRow label="Coordinates" value={`${store.lat}, ${store.lng}`} />
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Phone size={18} className="text-[var(--dxp-brand)]" />
                <h2 className="text-lg font-bold text-[var(--dxp-text)]">Contact</h2>
              </div>
              <InfoRow label="Phone" value={store.phone} />
              <InfoRow label="Manager" value={store.manager} />
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className="text-[var(--dxp-brand)]" />
                <h2 className="text-lg font-bold text-[var(--dxp-text)]">Hours</h2>
              </div>
              {store.hours.map((h) => (
                <InfoRow key={h.day} label={h.day} value={`${h.open} – ${h.close}`} />
              ))}
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-[var(--dxp-brand)]" />
                <h2 className="text-lg font-bold text-[var(--dxp-text)]">Operations</h2>
              </div>
              <InfoRow label="Team Members" value={String(store.employeeCount)} />
              <InfoRow label="Departments" value={String(store.departments.length)} />
              <InfoRow label="Services Offered" value={String(store.services.length)} />
              <InfoRow label="Satisfaction Score" value={`${store.customerSatScore}/100`} />
              <InfoRow label="Annual Revenue" value={`$${(store.annualRevenue / 1000000).toFixed(1)}M`} />
            </Card>
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
