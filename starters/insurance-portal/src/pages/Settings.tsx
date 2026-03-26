import React, { useState } from 'react';
import { PreferencesPanel, type PreferenceGroup } from '@dxp/ui';

export function Settings() {
  const [groups, setGroups] = useState<PreferenceGroup[]>([
    {
      title: 'Notifications',
      items: [
        { id: 'claim-updates', label: 'Claim Status Updates', description: 'Get notified when your claim status changes', type: 'toggle', value: true },
        { id: 'payment-reminders', label: 'Payment Reminders', description: 'Reminder before auto-pay date', type: 'toggle', value: true },
        { id: 'policy-alerts', label: 'Policy Alerts', description: 'Renewal reminders and coverage changes', type: 'toggle', value: true },
        { id: 'marketing', label: 'Marketing & Offers', description: 'Bundling deals and new products', type: 'toggle', value: false },
        { id: 'channel', label: 'Preferred Channel', type: 'select', value: 'email', options: [{ value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' }, { value: 'both', label: 'Email + SMS' }] },
      ],
    },
    {
      title: 'Display',
      items: [
        { id: 'compact', label: 'Compact Mode', description: 'Show more data in less space', type: 'toggle', value: false },
        { id: 'currency', label: 'Currency Format', type: 'select', value: 'usd', options: [{ value: 'usd', label: 'USD ($)' }, { value: 'eur', label: 'EUR' }, { value: 'gbp', label: 'GBP' }] },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        { id: 'analytics', label: 'Usage Analytics', description: 'Help us improve the portal experience', type: 'toggle', value: true },
        { id: 'session-timeout', label: 'Session Timeout', type: 'select', value: '30', options: [{ value: '15', label: '15 minutes' }, { value: '30', label: '30 minutes' }, { value: '60', label: '1 hour' }] },
      ],
    },
  ]);

  const handleChange = (id: string, value: boolean | string) => {
    setGroups((prev) => prev.map((g) => ({
      ...g,
      items: g.items.map((item) => item.id === id ? { ...item, value } : item),
    })));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--dxp-text)]">Settings</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Manage your portal preferences</p>
      </div>
      <div className="max-w-2xl">
        <PreferencesPanel groups={groups} onChange={handleChange} />
      </div>
    </div>
  );
}
