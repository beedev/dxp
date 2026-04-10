import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type { WatchlistItem } from '@dxp/contracts';

export function useWatchlist() {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: () => apiFetch<WatchlistItem[]>('/watchlist'),
  });
}

export function useAddToWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Pick<WatchlistItem, 'symbol'>) =>
      apiFetch<WatchlistItem>('/watchlist', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/watchlist/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}
