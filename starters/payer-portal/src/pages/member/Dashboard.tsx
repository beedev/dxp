import React from 'react';
import {
  StatsDisplay,
  Card,
  StatusBadge,
  ItemCarousel,
  Badge,
  QuickActions,
  CoverageCard,
  Button,
} from '@dxp/ui';
import { useMemberDashboard, useClaimsDashboard } from '@dxp/sdk-react';
import { claims as mockClaims, notifications, coverage as mockCoverage } from '../../data/mock';

const careGapNotifs = notifications.filter((n) => n.category === 'care-gap');

export interface DashboardProps {
  onNavigate: (href: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { data: memberDash } = useMemberDashboard();
  const { data: claimsDash } = useClaimsDashboard();
  const claims = mockClaims;
  const memberName = memberDash?.memberName ?? 'Member';
  const firstName = memberName.split(' ')[0];
  const openClaims = memberDash?.openClaims ?? 3;
  const pendingPAs = memberDash?.pendingPAs ?? 1;
  const careGaps = memberDash?.careGaps ?? 4;
  const deductibleMet = claimsDash?.totalPaid
    ? (claimsDash.totalPaid as any)?.value ?? 687
    : 687;

  // Build stats list — drop Pending PAs row when zero (rare for most members).
  const stats = [
    { label: 'Open Claims', value: openClaims, delta: { value: -2, label: 'vs last month' } },
    { label: 'Care Gaps', value: careGaps, delta: { value: 1, label: 'action needed' } },
    { label: 'Deductible Met', value: deductibleMet, format: 'currency' as const },
  ];
  if (pendingPAs > 0) {
    stats.splice(1, 0, {
      label: 'Pending PAs',
      value: pendingPAs,
      delta: { value: 0, label: 'in review' },
    });
  }

  const quickActions = [
    {
      id: 'id-card',
      label: 'ID Card',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
        </svg>
      ),
      onClick: () => onNavigate('/id-card'),
    },
    {
      id: 'find-care',
      label: 'Find Care',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      onClick: () => onNavigate('/find-provider'),
    },
    {
      id: 'claims',
      label: 'Claims',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: () => onNavigate('/claims'),
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      onClick: () => onNavigate('/messages'),
    },
    {
      id: 'assistant',
      label: 'Ask AI',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      onClick: () => onNavigate('/assistant'),
    },
  ];

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Good morning, {firstName}</h1>
        <p className="text-[var(--dxp-text-secondary)] font-medium mt-1">Your health plan at a glance</p>
      </div>

      <div className="mb-10">
        <QuickActions actions={quickActions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <Card variant="promo" accent="purple" className="p-5 flex flex-col gap-3">
          <h3 className="text-base font-bold">Let's review your contact information</h3>
          <p className="text-sm opacity-90">Make sure we have the right way to reach you.</p>
          <div>
            <Button variant="secondary" size="sm" onClick={() => onNavigate('/settings')}>
              Review now
            </Button>
          </div>
        </Card>
        <Card variant="promo" accent="green" className="p-5 flex flex-col gap-3">
          <h3 className="text-base font-bold">Select a primary care provider</h3>
          <p className="text-sm opacity-90">Pick a PCP for you and your dependents.</p>
          <div>
            <Button variant="secondary" size="sm" onClick={() => onNavigate('/primary-care')}>
              Choose PCP
            </Button>
          </div>
        </Card>
      </div>

      <h2 className="text-xl font-bold text-[var(--dxp-text)] tracking-tight mb-4">Coverage</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <CoverageCard
          type="health"
          memberId={mockCoverage.memberId}
          effectiveStart={mockCoverage.period.start}
          effectiveEnd={mockCoverage.period.end}
          highlights={[
            { label: 'Deductible', value: '$1,500' },
            { label: 'Out-of-pocket max', value: '$6,000' },
            { label: 'PCP visit', value: '$25 copay' },
          ]}
          status="active"
          onViewDetails={() => onNavigate('/plan')}
        />
        <CoverageCard
          type="dental"
          memberId={`${mockCoverage.memberId}-D`}
          effectiveStart={mockCoverage.period.start}
          effectiveEnd={mockCoverage.period.end}
          highlights={[
            { label: 'Deductible', value: '$75' },
            { label: 'Cleanings', value: '2 / year' },
            { label: 'Annual max', value: '$1,500' },
          ]}
          status="active"
          onViewDetails={() => onNavigate('/plan')}
        />
        <CoverageCard
          type="pharmacy"
          memberId={`${mockCoverage.memberId}-Rx`}
          effectiveStart={mockCoverage.period.start}
          effectiveEnd={mockCoverage.period.end}
          highlights={[
            { label: 'Tier 1 generic', value: '$10' },
            { label: 'Tier 2 preferred', value: '$35' },
            { label: 'Mail order', value: '90 days' },
          ]}
          status="active"
          onViewDetails={() => onNavigate('/plan')}
        />
      </div>

      <div className="mb-10">
        <StatsDisplay stats={stats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
        <section className="lg:col-span-6 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--dxp-text)] tracking-tight">Recent Claims</h2>
            <button
              type="button"
              onClick={() => onNavigate('/claims')}
              className="text-[var(--dxp-brand)] text-sm font-bold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {claims.slice(0, 4).map((claim) => (
              <Card key={claim.id} interactive onClick={() => onNavigate('/claim-detail')} className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--dxp-brand-light)] flex items-center justify-center text-[var(--dxp-brand)]">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[var(--dxp-text)]">{claim.claimNumber}</span>
                    <p className="text-xs text-[var(--dxp-text-secondary)]">{claim.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <span className="text-sm font-bold text-[var(--dxp-text)]">${claim.billedAmount.toLocaleString()}</span>
                    <p className="text-[10px] text-[var(--dxp-text-muted)]">{claim.serviceDate}</p>
                  </div>
                  <StatusBadge status={claim.status} />
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="lg:col-span-4 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-[var(--dxp-text)] tracking-tight">Care Gap Alerts</h2>
          <ItemCarousel
            title="Action Items"
            items={careGapNotifs.map((n) => ({
              id: n.id,
              content: (
                <Card className="p-4 h-full">
                  <Badge variant="warning" className="mb-2">Care Gap</Badge>
                  <h4 className="text-sm font-bold text-[var(--dxp-text)] mb-1">{n.title}</h4>
                  <p className="text-xs text-[var(--dxp-text-secondary)] leading-relaxed">{n.message}</p>
                </Card>
              ),
            }))}
          />

          <h2 className="text-xl font-bold text-[var(--dxp-text)] tracking-tight">Notifications</h2>
          <Card className="overflow-hidden">
            {notifications.slice(0, 5).map((n, i) => (
              <div key={n.id} className={`p-4 flex gap-3 cursor-pointer transition-colors hover:bg-[var(--dxp-border-light)] ${!n.read ? 'border-l-4 border-[var(--dxp-brand)] bg-[var(--dxp-brand-light)]' : ''} ${i < 4 ? 'border-b border-[var(--dxp-border-light)]' : ''}`}>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm ${!n.read ? 'font-bold' : 'font-medium'} text-[var(--dxp-text)]`}>{n.title}</p>
                    <span className="text-[9px] text-[var(--dxp-text-muted)] shrink-0 ml-2">{n.date}</span>
                  </div>
                  <p className="text-xs text-[var(--dxp-text-secondary)] leading-relaxed mt-1">{n.message}</p>
                </div>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}
