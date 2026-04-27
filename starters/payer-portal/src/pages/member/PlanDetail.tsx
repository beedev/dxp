import React from 'react';
import { Card, DocumentCard, Gauge, DataTable, Badge, type Column } from '@dxp/ui';
import { useAccumulators, useIdCard, useBenefits } from '@dxp/sdk-react';
import { coverage as mockCoverage, accumulators as mockAccumulators, digitalIdCard as mockIdCard } from '../../data/mock';

interface CoverageRateRow {
  service: string;
  inNetwork: string;
  outOfNetwork: string;
}

const coverageRateRows: CoverageRateRow[] = [
  { service: 'Primary care visit',     inNetwork: '$25 copay',  outOfNetwork: '50% after deductible' },
  { service: 'Specialist visit',       inNetwork: '$50 copay',  outOfNetwork: '50% after deductible' },
  { service: 'Urgent care',            inNetwork: '$75 copay',  outOfNetwork: '50% after deductible' },
  { service: 'Emergency room',         inNetwork: '$300 copay', outOfNetwork: '$300 copay' },
  { service: 'Preventive screening',   inNetwork: 'No charge',  outOfNetwork: '50% after deductible' },
  { service: 'Outpatient surgery',     inNetwork: '20% after deductible', outOfNetwork: '50% after deductible' },
];

const coverageRateColumns: Column<CoverageRateRow>[] = [
  { key: 'service',       header: 'Service',         sortable: true },
  { key: 'inNetwork',     header: 'In-Network',      width: '220px' },
  { key: 'outOfNetwork',  header: 'Out-of-Network',  width: '220px' },
];

export function PlanDetail() {
  const { data: cardData } = useIdCard();
  const { data: accumulatorsData } = useAccumulators();
  const { data: benefitsData } = useBenefits();

  const idCard = (cardData ?? mockIdCard) as typeof mockIdCard;
  const planName = idCard.planName ?? mockCoverage.planName;
  const planType = idCard.planType ?? mockCoverage.planType;
  const groupNumber = idCard.groupNumber ?? mockCoverage.groupNumber;
  const effectiveDate = idCard.effectiveDate ?? mockCoverage.period.start;

  // Normalize accumulators (live data has nested .value, mock has number).
  const accs = (accumulatorsData ?? mockAccumulators) as any[];
  const findAcc = (type: string, network: string) => {
    const a = accs.find((x) => x.type === type && x.network === network);
    if (!a) return null;
    const used = typeof a.used === 'object' ? a.used.value : a.used;
    const limit = typeof a.limit === 'object' ? a.limit.value : a.limit;
    return { used, limit };
  };
  const deductibleIn = findAcc('deductible', 'in-network') ?? { used: 687, limit: 1500 };
  const oopMaxIn = findAcc('out-of-pocket-max', 'in-network') ?? { used: 1247, limit: 6000 };

  // Derive in-network rate column from live benefits when present.
  const liveBenefits = benefitsData as Array<{ category: string; copay?: { value: number } }> | undefined;
  const liveRateRows: CoverageRateRow[] | null = liveBenefits
    ? liveBenefits.map((b) => ({
        service: b.category,
        inNetwork: b.copay ? `$${b.copay.value} copay` : 'See plan',
        outOfNetwork: '50% after deductible',
      }))
    : null;

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Health plan</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">{planName} — {planType}</p>
      </div>

      {/* Plan hero */}
      <Card className="p-6 mb-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-[var(--dxp-text)]">{planName}</h2>
              <Badge variant="success">ACTIVE</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 mt-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Type</span>
                <p className="text-sm font-bold text-[var(--dxp-text)]">{planType}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Group</span>
                <p className="text-sm font-bold text-[var(--dxp-text)]">{groupNumber}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Effective</span>
                <p className="text-sm font-bold text-[var(--dxp-text)]">{effectiveDate}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Plan year</span>
                <p className="text-sm font-bold text-[var(--dxp-text)]">{mockCoverage.period.start} – {mockCoverage.period.end}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Document tiles */}
      <h2 className="text-xl font-bold text-[var(--dxp-text)] tracking-tight mb-4">Plan documents</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <DocumentCard
          name="Benefit booklet"
          category="policy"
          reference="2026"
          date={effectiveDate}
          size="2.4 MB"
          fileType="pdf"
          onDownload={() => undefined}
        />
        <DocumentCard
          name="Summary of benefits and coverage"
          category="policy"
          reference="SBC"
          date={effectiveDate}
          size="380 KB"
          fileType="pdf"
          onDownload={() => undefined}
        />
        <DocumentCard
          name="Certificate of coverage"
          category="policy"
          reference="COC"
          date={effectiveDate}
          size="1.1 MB"
          fileType="pdf"
          onDownload={() => undefined}
        />
      </div>

      {/* Cost gauges */}
      <h2 className="text-xl font-bold text-[var(--dxp-text)] tracking-tight mb-4">Your costs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Card className="p-6 flex justify-center">
          <Gauge
            value={deductibleIn.used}
            max={deductibleIn.limit}
            label="Deductible"
            caption="In-network plan year"
            format="currency"
            size="md"
          />
        </Card>
        <Card className="p-6 flex justify-center">
          <Gauge
            value={oopMaxIn.used}
            max={oopMaxIn.limit}
            label="Out-of-pocket max"
            caption="In-network plan year"
            format="currency"
            size="md"
          />
        </Card>
      </div>

      {/* Coverage summary */}
      <h2 className="text-xl font-bold text-[var(--dxp-text)] tracking-tight mb-4">Coverage summary</h2>
      <DataTable columns={coverageRateColumns} data={liveRateRows ?? coverageRateRows} />
    </div>
  );
}
