import React, { useState } from 'react';
import { FilterBar, ProviderCard, type FilterOption } from '@dxp/ui';
import { useProviderSearch } from '@dxp/sdk-react';
import { providers as mockProviders } from '../../data/mock';

const mockSpecialties = [...new Set(mockProviders.map((p) => p.specialty))];

const defaultFilters: FilterOption[] = [
  ...mockSpecialties.map((s) => ({ key: s, label: s, value: s })),
  { key: 'in-network', label: 'In-Network Only', value: 'in-network' },
];

export function FindProvider() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const { data: searchResult } = useProviderSearch({ name: search || undefined, pageSize: 50 });
  // Normalize FHIR provider shape (specialty as object, networkStatus field)
  const rawProviders = searchResult?.data ?? mockProviders;
  const providers = (rawProviders as any[]).map((p) => ({
    ...p,
    id: p.id || p.npi,
    specialty: typeof p.specialty === 'object' ? (p.specialty?.display || '') : (p.specialty || ''),
    network: p.network || p.networkStatus || 'unknown',
    languages: p.languages || [],
    distance: p.distance || null,
    rating: p.rating || null,
    reviewCount: p.reviewCount || null,
    phone: p.phone || null,
    address: typeof p.address === 'string' ? p.address : (p.address?.line?.join(', ') ? `${p.address.line.join(', ')}, ${p.address.city || ''} ${p.address.state || ''}`.trim() : null),
  }));
  const specialties = [...new Set(providers.map((p) => p.specialty).filter(Boolean))];
  const filters: FilterOption[] = [
    ...specialties.map((s) => ({ key: s, label: s, value: s })),
    { key: 'in-network', label: 'In-Network Only', value: 'in-network' },
  ];

  const filtered = providers.filter((p) => {
    const specFilters = activeFilters.filter((f) => f !== 'in-network');
    const networkFilter = activeFilters.includes('in-network');
    if (specFilters.length > 0 && !specFilters.includes(p.specialty)) return false;
    if (networkFilter && p.network !== 'in-network') return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.specialty.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Find a Provider</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Search our directory of {providers.length} providers in the Meridian network</p>
      </div>

      <div className="mb-6">
        <FilterBar
          filters={filters}
          activeFilters={activeFilters}
          onToggle={(key) => setActiveFilters((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key])}
          onClear={() => setActiveFilters([])}
          searchPlaceholder="Search by name or specialty..."
          searchValue={search}
          onSearchChange={setSearch}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((provider) => (
          <ProviderCard
            key={provider.id}
            name={provider.name}
            specialty={provider.specialty}
            address={provider.address || undefined}
            phone={provider.phone || undefined}
            networkStatus={provider.network === 'in-network' ? 'in-network' : provider.network === 'out-of-network' ? 'out-of-network' : 'unknown'}
            acceptingNewPatients={provider.acceptingNewPatients}
            rating={provider.rating ?? undefined}
            reviewCount={provider.reviewCount ?? undefined}
            distance={provider.distance ?? undefined}
            languages={provider.languages}
          />
        ))}
      </div>
    </div>
  );
}
