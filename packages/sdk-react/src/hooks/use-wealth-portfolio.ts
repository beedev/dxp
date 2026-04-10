import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type { PortfolioSummary, Holding, Transaction, PortfolioFilters } from '@dxp/contracts';

export function usePortfolio(baseCurrency = 'SGD') {
  return useQuery({
    queryKey: ['portfolio', baseCurrency],
    queryFn: () => {
      const qs = new URLSearchParams({ baseCurrency });
      return apiFetch<PortfolioSummary>(`/wealth/portfolio?${qs}`);
    },
  });
}

export function useHoldings(baseCurrency = 'SGD', filters?: PortfolioFilters) {
  return useQuery({
    queryKey: ['portfolio', 'holdings', baseCurrency, filters],
    queryFn: () => {
      const qs = new URLSearchParams({ baseCurrency });
      if (filters?.assetClass) qs.set('assetClass', filters.assetClass);
      if (filters?.region) qs.set('region', filters.region);
      if (filters?.sector) qs.set('sector', filters.sector);
      return apiFetch<Holding[]>(`/wealth/holdings?${qs}`);
    },
  });
}

export function useTransactions(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['portfolio', 'transactions', page, pageSize],
    queryFn: () => {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      return apiFetch<Transaction[]>(`/wealth/transactions?${qs}`);
    },
  });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Transaction, 'id'>) =>
      apiFetch<Transaction>('/wealth/transactions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}
