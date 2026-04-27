import React from 'react';
import { ProviderCard } from '@dxp/ui';
import { useCareTeam } from '@dxp/sdk-react';
import { careTeam as mockCareTeam, memberProfile } from '../../data/mock';

interface PcpAssignment {
  memberName: string;
  memberRole: 'subscriber' | 'dependent';
  provider: {
    name: string;
    specialty: string;
    facility?: string;
    address?: string;
    phone?: string;
    networkStatus?: 'in-network' | 'out-of-network';
  };
}

export function PrimaryCare() {
  const { data: teamData } = useCareTeam();
  const team = (teamData ?? mockCareTeam) as typeof mockCareTeam;

  // Find PCP for the subscriber from the care team. Real implementation would have
  // PCP-by-member assignments from the BFF — this demo uses one PCP for the
  // subscriber and a synthetic pediatric PCP for a dependent.
  const subscriberPcp = team.find((m) => m.isPrimary || m.role === 'Primary Care Physician') ?? team[0];

  const assignments: PcpAssignment[] = [
    {
      memberName: memberProfile.name,
      memberRole: 'subscriber',
      provider: {
        name: subscriberPcp.name,
        specialty: subscriberPcp.specialty,
        facility: (subscriberPcp as any).facility,
        address: (subscriberPcp as any).facility,
        phone: (subscriberPcp as any).phone,
        networkStatus: 'in-network',
      },
    },
    {
      memberName: 'Sophia Thompson',
      memberRole: 'dependent',
      provider: {
        name: 'Dr. Baher E. Esmali, DO',
        specialty: 'Pediatrics',
        facility: 'Lincoln Comm Health Center',
        address: '1301 Fayetteville St., Durham, NC 27707',
        phone: '(919) 956-4000',
        networkStatus: 'in-network',
      },
    },
  ];

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Primary care provider</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">
          Your primary care provider is the health professional responsible for your general treatment needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((a) => (
          <div key={a.memberName} className="flex flex-col gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">
                {a.memberRole === 'subscriber' ? 'Subscriber' : 'Dependent'}
              </span>
              <p className="text-base font-bold text-[var(--dxp-text)] mt-0.5">{a.memberName}</p>
            </div>
            <ProviderCard
              variant="pcp"
              name={a.provider.name}
              specialty={a.provider.specialty}
              facility={a.provider.facility}
              address={a.provider.address}
              phone={a.provider.phone}
              networkStatus={a.provider.networkStatus}
              primaryAction={{ label: 'Change provider', onClick: () => undefined }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
