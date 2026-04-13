import React from 'react';
import { StatsDisplay, DataTable, StatusBadge, Chart, ProgressTracker } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { regions } from '../../data/mock-network';

interface AuditResult {
  storeId: string;
  storeName: string;
  region: string;
  auditDate: string;
  score: number;
  status: 'passed' | 'failed' | 'pending';
  openIssues: number;
}

const auditResults: AuditResult[] = [
  { storeId: 'S001', storeName: 'ACE — Naperville', region: 'Midwest', auditDate: '2026-03-15', score: 96, status: 'passed', openIssues: 0 },
  { storeId: 'S002', storeName: 'ACE — Austin Downtown', region: 'Southwest', auditDate: '2026-03-20', score: 91, status: 'passed', openIssues: 1 },
  { storeId: 'S003', storeName: 'ACE — Cherry Creek', region: 'West', auditDate: '2026-03-22', score: 88, status: 'passed', openIssues: 2 },
  { storeId: 'S004', storeName: 'ACE — Minneapolis', region: 'Midwest', auditDate: '2026-03-25', score: 94, status: 'passed', openIssues: 0 },
  { storeId: 'S005', storeName: 'ACE — Buckhead', region: 'Southeast', auditDate: '2026-03-28', score: 78, status: 'failed', openIssues: 5 },
  { storeId: 'S006', storeName: 'ACE — Nashville', region: 'Southeast', auditDate: '2026-04-01', score: 85, status: 'passed', openIssues: 3 },
  { storeId: 'S007', storeName: 'ACE — Raleigh', region: 'Southeast', auditDate: '2026-04-03', score: 92, status: 'passed', openIssues: 1 },
  { storeId: 'S008', storeName: 'ACE — La Jolla', region: 'West', auditDate: '2026-04-05', score: 90, status: 'passed', openIssues: 1 },
  { storeId: 'S009', storeName: 'ACE — Boulder', region: 'West', auditDate: '2026-04-08', score: 72, status: 'failed', openIssues: 7 },
  { storeId: 'S010', storeName: 'ACE — Bellevue', region: 'West', auditDate: '2026-04-10', score: 97, status: 'passed', openIssues: 0 },
  { storeId: 'S011', storeName: 'ACE — Portland', region: 'West', auditDate: '2026-04-12', score: 0, status: 'pending', openIssues: 0 },
  { storeId: 'S012', storeName: 'ACE — Scottsdale', region: 'Southwest', auditDate: '2026-04-14', score: 0, status: 'pending', openIssues: 0 },
];

const columns: Column<AuditResult>[] = [
  { key: 'storeName', header: 'Store', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'region', header: 'Region' },
  { key: 'auditDate', header: 'Audit Date' },
  { key: 'score', header: 'Score', render: (v: unknown, row: AuditResult) => row.status === 'pending' ? <span className="text-[var(--dxp-text-muted)]">—</span> : <span className={`font-bold ${(v as number) >= 85 ? 'text-emerald-600' : 'text-red-600'}`}>{String(v)}/100</span> },
  { key: 'openIssues', header: 'Open Issues', render: (v: unknown) => (v as number) > 0 ? <span className="text-red-600 font-semibold">{String(v)}</span> : <span className="text-emerald-600">0</span> },
  {
    key: 'status', header: 'Status',
    render: (v: unknown) => {
      const s = v as string;
      const map: Record<string, 'approved' | 'pending' | 'rejected'> = { passed: 'approved', failed: 'rejected', pending: 'pending' };
      return <StatusBadge status={map[s] || 'pending'} label={s.charAt(0).toUpperCase() + s.slice(1)} />;
    },
  },
];

const completedAudits = auditResults.filter((a) => a.status !== 'pending');
const passedAudits = auditResults.filter((a) => a.status === 'passed');
const avgScore = Math.round(completedAudits.reduce((s, a) => s + a.score, 0) / completedAudits.length);
const totalOpenIssues = auditResults.reduce((s, a) => s + a.openIssues, 0);

const complianceByRegion = regions.map((r) => ({
  region: r.name,
  rate: Math.round(75 + Math.random() * 20),
}));

const complianceSteps = [
  { label: 'Safety Inspection', status: 'completed' as const },
  { label: 'Hazardous Materials', status: 'completed' as const },
  { label: 'ADA Compliance', status: 'completed' as const },
  { label: 'Fire Safety', status: 'in-progress' as const },
  { label: 'EPA Requirements', status: 'pending' as const },
  { label: 'Annual Review', status: 'pending' as const },
];

export function QualityCompliance() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Quality & Compliance</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Store audits, compliance tracking, and quality standards</p>
      </div>

      <div className="mb-6">
        <StatsDisplay
          stats={[
            { label: 'Audit Pass Rate', value: Math.round(passedAudits.length / completedAudits.length * 100), format: 'percent' },
            { label: 'Avg Audit Score', value: avgScore, format: 'number' },
            { label: 'Open Issues', value: totalOpenIssues, format: 'number', delta: { value: -totalOpenIssues, label: 'to resolve' } },
            { label: 'Audits Completed', value: completedAudits.length, format: 'number' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Chart
          type="bar"
          title="Compliance Rate by Region"
          description="Percentage of stores passing audit (%)"
          data={complianceByRegion}
          xKey="region"
          yKeys={['rate']}
          height={280}
          colors={['#16A34A']}
        />

        <div>
          <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Compliance Checklist — Q2 2026</h2>
          <ProgressTracker steps={complianceSteps} />
        </div>
      </div>

      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Recent Audit Results</h2>
      <DataTable columns={columns} data={auditResults} />
    </div>
  );
}
