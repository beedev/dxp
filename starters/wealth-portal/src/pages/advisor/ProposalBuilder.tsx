import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Select } from '@dxp/ui';
import { useRegion, useRegionMock } from '../../contexts/RegionContext';

type ProposalType = 'New Portfolio' | 'Rebalance' | 'Tactical Shift';

interface RegionAllocation {
  region: string;
  flag: string;
  pct: number;
}

// Risk/return assumptions per bucket — used to project expected return / vol
// These are illustrative defaults; not market-sourced.
const BUCKET_ASSUMPTIONS: Record<string, { r: number; v: number }> = {
  Singapore:       { r: 8.5,  v: 12 },
  'Hong Kong':     { r: 7.2,  v: 18 },
  Japan:           { r: 6.8,  v: 15 },
  Australia:       { r: 9.2,  v: 14 },
  'India / SE Asia': { r: 12.4, v: 22 },
  'Large Cap':     { r: 11.8, v: 14 },
  'Mid Cap':       { r: 14.5, v: 20 },
  'Small Cap':     { r: 16.2, v: 26 },
  "Int'l":         { r: 8.0,  v: 13 },
  'Debt/Gold':     { r: 6.5,  v: 6 },
};

export function ProposalBuilder() {
  const { region, formatCurrency } = useRegion();
  const { advisorClients, allocationTargets } = useRegionMock();

  const [selectedClient, setSelectedClient] = useState(advisorClients[0]?.id ?? '');
  const [proposalType, setProposalType] = useState<ProposalType>('Rebalance');
  const [generated, setGenerated] = useState(false);

  // Build the starting allocation from the region's target allocation
  const initialAllocations = useMemo<RegionAllocation[]>(
    () => allocationTargets.map((t) => ({ region: t.country, flag: t.flag, pct: t.target })),
    [allocationTargets]
  );
  const [allocations, setAllocations] = useState<RegionAllocation[]>(initialAllocations);

  // Re-seed when region changes
  useEffect(() => {
    setAllocations(initialAllocations);
    setSelectedClient(advisorClients[0]?.id ?? '');
  }, [region.id, initialAllocations, advisorClients]);

  const client = advisorClients.find((c) => c.id === selectedClient) ?? advisorClients[0];
  const totalPct = allocations.reduce((s, a) => s + a.pct, 0);

  const updateAllocation = (regionKey: string, value: number) => {
    setAllocations((prev) => prev.map((a) => a.region === regionKey ? { ...a, pct: Math.max(0, Math.min(100, value)) } : a));
  };

  // Expected projections from bucket assumptions
  const expectedReturn = allocations.reduce((s, a) => {
    return s + (a.pct / 100) * (BUCKET_ASSUMPTIONS[a.region]?.r ?? 8);
  }, 0);

  const expectedVolatility = allocations.reduce((s, a) => {
    return s + (a.pct / 100) * (BUCKET_ASSUMPTIONS[a.region]?.v ?? 15);
  }, 0);

  const sharpe = expectedVolatility > 0 ? expectedReturn / expectedVolatility : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Proposal Builder</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Create {region.flag} {region.name} investment proposals for clients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client selector */}
          <Card className="p-4">
            <Select
              label="Client"
              value={selectedClient}
              onChange={setSelectedClient}
              options={advisorClients.map((c) => ({ value: c.id, label: c.name }))}
            />
            {client && (
              <div className="mt-3 pt-3 border-t border-[var(--dxp-border-light)]">
                <p className="text-xs text-[var(--dxp-text-muted)]">
                  AUM:{' '}
                  <span className="font-semibold text-[var(--dxp-text)]">
                    {new Intl.NumberFormat(region.currency.locale, { style: 'currency', currency: client.baseCurrency, maximumFractionDigits: 0 }).format(client.aum)}
                  </span>
                </p>
                <p className="text-xs text-[var(--dxp-text-muted)]">
                  Risk: <span className="font-semibold text-amber-600">{client.riskProfile}</span>
                </p>
              </div>
            )}
          </Card>

          {/* Proposal type */}
          <Card className="p-4">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--dxp-text-muted)] block mb-2">Proposal Type</label>
            <div className="space-y-2">
              {(['New Portfolio', 'Rebalance', 'Tactical Shift'] as ProposalType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setProposalType(t)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                    proposalType === t ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-[var(--dxp-surface)] border-[var(--dxp-border)] text-[var(--dxp-text-secondary)] hover:border-amber-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Card>

          {/* Region allocations */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--dxp-text-muted)]">Regional Allocation</label>
              <span className={`text-xs font-bold ${totalPct === 100 ? 'text-emerald-600' : 'text-rose-600'}`}>{totalPct}%</span>
            </div>
            <div className="space-y-3">
              {allocations.map((a) => (
                <div key={a.region}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--dxp-text)]">{a.flag} {a.region}</span>
                    <span className="text-xs font-bold font-mono text-[var(--dxp-text)]">{a.pct}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    value={a.pct}
                    onChange={(e) => updateAllocation(a.region, Number(e.target.value))}
                    className="w-full h-1.5 rounded-full accent-amber-600"
                  />
                </div>
              ))}
            </div>
            {totalPct !== 100 && (
              <p className="text-xs text-rose-600 mt-2">Allocations must sum to 100%</p>
            )}
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:col-span-3 space-y-5">
          {/* Projected returns */}
          <Card className="p-5">
            <h2 className="text-base font-bold text-[var(--dxp-text)] mb-4">Risk / Return Projections</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-center">
                <p className="text-xs text-[var(--dxp-text-muted)]">Expected Return</p>
                <p className="text-2xl font-bold text-emerald-600">{expectedReturn.toFixed(1)}%</p>
                <p className="text-xs text-[var(--dxp-text-muted)]">p.a. blended</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <p className="text-xs text-[var(--dxp-text-muted)]">Expected Vol.</p>
                <p className="text-2xl font-bold text-amber-600">{expectedVolatility.toFixed(1)}%</p>
                <p className="text-xs text-[var(--dxp-text-muted)]">annualised σ</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-[var(--dxp-text-muted)]">Sharpe Ratio</p>
                <p className="text-2xl font-bold text-blue-600">{sharpe.toFixed(2)}</p>
                <p className="text-xs text-[var(--dxp-text-muted)]">risk-adjusted</p>
              </div>
            </div>
          </Card>

          {/* Allocation visualisation */}
          <Card className="p-5">
            <h2 className="text-base font-bold text-[var(--dxp-text)] mb-4">Proposed Allocation</h2>
            <div className="space-y-2">
              {allocations.map((a) => (
                <div key={a.region}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span>{a.flag} {a.region}</span>
                    <span className="font-semibold">{a.pct}%</span>
                  </div>
                  <div className="h-2.5 bg-[var(--dxp-border-light)] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${a.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Proposal details */}
          <Card className="p-5">
            <h2 className="text-base font-bold text-[var(--dxp-text)] mb-3">Proposal Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--dxp-text-secondary)]">Client</span>
                <span className="font-semibold text-[var(--dxp-text)]">{client.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--dxp-text-secondary)]">Proposal Type</span>
                <span className="font-semibold text-[var(--dxp-text)]">{proposalType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--dxp-text-secondary)]">AUM</span>
                <span className="font-semibold font-mono text-[var(--dxp-text)]">
                  {client && new Intl.NumberFormat(region.currency.locale, { style: 'currency', currency: client.baseCurrency, maximumFractionDigits: 0 }).format(client.aum)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--dxp-text-secondary)]">Date</span>
                <span className="font-semibold text-[var(--dxp-text)]">{new Date().toLocaleDateString(region.currency.locale, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </Card>

          <Button
            variant="primary"
            onClick={() => setGenerated(true)}
            disabled={totalPct !== 100}
            className="w-full"
          >
            Generate PDF Proposal
          </Button>

          {generated && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm font-bold text-emerald-700">Proposal generated successfully</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                DXP_Proposal_{client?.name.replace(/ /g, '_')}_{proposalType.replace(/ /g, '_')}_{region.id}_{new Date().toISOString().slice(0,10)}.pdf
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
