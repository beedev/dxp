import React from 'react';
import { Card, DataTable, Badge, Button, type Column } from '@dxp/ui';
import type { AdvisorClient } from '../../data/mock-portfolio';
import { useRegion, useRegionMock } from '../../contexts/RegionContext';

interface ClientListProps {
  onNavigate: (path: string) => void;
}

type ClientRow = AdvisorClient;

const RISK_BADGE_VARIANT: Record<string, 'danger' | 'warning' | 'success' | 'default'> = {
  'Aggressive Growth': 'danger',
  'Moderate Growth': 'warning',
  Balanced: 'warning',
  Conservative: 'success',
};

export function ClientList({ onNavigate }: ClientListProps) {
  const { region, formatCurrency } = useRegion();
  const { advisorClients } = useRegionMock();

  const totalAUM = advisorClients.reduce((s, c) => s + c.aum, 0);
  const avgReturn = advisorClients.reduce((s, c) => s + c.ytdReturn, 0) / (advisorClients.length || 1);
  const underReview = advisorClients.filter((c) => {
    const lastReview = new Date(c.lastReview);
    const monthsAgo = (Date.now() - lastReview.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo > 3;
  }).length;

  const columns: Column<ClientRow>[] = [
    {
      key: 'name',
      header: 'Client Name',
      render: (_value, row) => (
        <div>
          <p className="font-bold text-[var(--dxp-text)]">{row.name}</p>
          <p className="text-xs text-[var(--dxp-text-muted)]">{row.baseCurrency} base</p>
        </div>
      ),
    },
    {
      key: 'aum',
      header: 'Portfolio Value',
      render: (_value, row) => (
        <span className="font-mono font-bold text-[var(--dxp-text)]">
          {new Intl.NumberFormat(region.currency.locale, {
            style: 'currency',
            currency: row.baseCurrency,
            notation: 'compact',
            maximumFractionDigits: 1,
          }).format(row.aum)}
        </span>
      ),
    },
    {
      key: 'ytdReturn',
      header: 'Return %',
      render: (_value, row) => (
        <span className={`font-semibold ${row.ytdReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          +{row.ytdReturn.toFixed(2)}%
        </span>
      ),
    },
    {
      key: 'riskProfile',
      header: 'Risk Profile',
      render: (_value, row) => (
        <Badge variant={RISK_BADGE_VARIANT[row.riskProfile] ?? 'default'}>
          {row.riskProfile}
        </Badge>
      ),
    },
    {
      key: 'lastReview',
      header: 'Last Review',
    },
    {
      key: 'id',
      header: 'Action',
      render: () => (
        <Button variant="ghost" size="sm" onClick={() => onNavigate('/advisor/client')}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">My Clients</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">
          {advisorClients.length} clients · {region.flag} {region.name} wealth advisory
        </p>
      </div>

      {/* AUM summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-[var(--dxp-text-muted)]">Total AUM</p>
          <p className="text-xl font-bold font-mono text-[var(--dxp-text)]">{formatCurrency(totalAUM, { compact: true })}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--dxp-text-muted)]">Avg YTD Return</p>
          <p className="text-xl font-bold font-mono text-emerald-600">+{avgReturn.toFixed(2)}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--dxp-text-muted)]">Due for Review</p>
          <p className="text-xl font-bold font-mono text-amber-600">{underReview}</p>
        </Card>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={advisorClients}
          emptyMessage="No clients found"
        />
      </Card>
    </div>
  );
}
