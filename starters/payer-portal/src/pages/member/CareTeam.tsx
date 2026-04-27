import React from 'react';
import { ProviderCard } from '@dxp/ui';
import { useCareTeam } from '@dxp/sdk-react';
import { careTeam as mockCareTeam } from '../../data/mock';

// Map FHIR role codes to display labels
const roleLabel: Record<string, string> = {
  pcp: 'Primary Care Physician',
  specialist: 'Specialist',
  'care-manager': 'Care Manager',
  nurse: 'Nurse',
  pharmacist: 'Pharmacist',
  'social-worker': 'Social Worker',
};

export function CareTeam() {
  const { data: teamData } = useCareTeam();
  const careTeam = ((teamData ?? mockCareTeam) as typeof mockCareTeam);

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">My Care Team</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Your coordinated care team members</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {careTeam.map((member) => {
          const role = (member as any).role as string;
          const label = roleLabel[role] || role;
          return (
            <ProviderCard
              key={member.id}
              name={member.name}
              specialty={member.specialty}
              role={label}
              facility={(member as any).facility}
              phone={(member as any).phone}
              email={(member as any).email}
              isPrimary={(member as any).isPrimary}
            />
          );
        })}
      </div>
    </div>
  );
}
