import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type { MacroIndicator, CountryProfile } from '@dxp/contracts';

export function useCountryProfiles() {
  return useQuery({
    queryKey: ['macro', 'countries'],
    queryFn: () => apiFetch<CountryProfile[]>('/macro/countries'),
    staleTime: 3_600_000,
  });
}

export function useMacroIndicators(countryCode: string, years = 5) {
  return useQuery({
    queryKey: ['macro', countryCode, years],
    queryFn: () => {
      const qs = new URLSearchParams({ years: String(years) });
      return apiFetch<MacroIndicator[]>(`/macro/${countryCode}?${qs}`);
    },
    enabled: !!countryCode,
    staleTime: 3_600_000,
  });
}
