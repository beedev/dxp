import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type { FxRatesSnapshot, FxConvertResult, SgdRate } from '@dxp/contracts';

export function useFxRates(base = 'USD', opts?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['fx', 'rates', base],
    queryFn: () => {
      const qs = new URLSearchParams({ base });
      return apiFetch<FxRatesSnapshot>(`/fx/rates?${qs}`);
    },
    staleTime: 60_000,
    refetchInterval: opts?.refetchInterval,
  });
}

export function useApacFxRates(opts?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['fx', 'apac'],
    queryFn: () => apiFetch<FxRatesSnapshot>('/fx/apac'),
    staleTime: 60_000,
    refetchInterval: opts?.refetchInterval,
  });
}

export function useFxConvert(from: string, to: string, amount: number) {
  return useQuery({
    queryKey: ['fx', 'convert', from, to, amount],
    queryFn: () => {
      const qs = new URLSearchParams({ from, to, amount: String(amount) });
      return apiFetch<FxConvertResult>(`/fx/convert?${qs}`);
    },
    enabled: !!from && !!to && amount > 0,
    staleTime: 60_000,
  });
}

export function useSgdRates(opts?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['fx', 'sgd'],
    queryFn: () => apiFetch<SgdRate[]>('/fx/sgd'),
    staleTime: 300_000,
    refetchInterval: opts?.refetchInterval,
  });
}
