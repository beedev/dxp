import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';

export function useDailySales(storeId: string, date?: string) {
  return useQuery({
    queryKey: ['pos', 'daily', storeId, date],
    queryFn: () => {
      const qs = date ? `?date=${date}` : '';
      return apiFetch(`/pos/sales/daily/${storeId}${qs}`);
    },
    enabled: !!storeId,
  });
}

export function useSalesRange(storeId: string, from: string, to: string) {
  return useQuery({
    queryKey: ['pos', 'range', storeId, from, to],
    queryFn: () => apiFetch(`/pos/sales/range/${storeId}?from=${from}&to=${to}`),
    enabled: !!storeId && !!from && !!to,
  });
}

export function useCategoryBreakdown(storeId: string) {
  return useQuery({
    queryKey: ['pos', 'categories', storeId],
    queryFn: () => apiFetch(`/pos/categories/${storeId}`),
    enabled: !!storeId,
  });
}

export function useTopSellers(storeId: string) {
  return useQuery({
    queryKey: ['pos', 'top-sellers', storeId],
    queryFn: () => apiFetch(`/pos/top-sellers/${storeId}`),
    enabled: !!storeId,
  });
}
