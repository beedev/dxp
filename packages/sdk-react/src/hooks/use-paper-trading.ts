import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type { PaperPortfolio, Order, PlaceOrderRequest, Alert, CreateAlertRequest, OrderStatus } from '@dxp/contracts';

export function usePaperPortfolio() {
  return useQuery({
    queryKey: ['paper', 'portfolio'],
    queryFn: () => apiFetch<PaperPortfolio>('/paper/portfolio'),
  });
}

export function usePaperOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: ['paper', 'orders', status],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (status) qs.set('status', status);
      const query = qs.toString();
      return apiFetch<Order[]>(query ? `/paper/orders?${qs}` : '/paper/orders');
    },
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PlaceOrderRequest) =>
      apiFetch<Order>('/paper/orders', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paper', 'orders'] });
      qc.invalidateQueries({ queryKey: ['paper', 'portfolio'] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/paper/orders/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paper', 'orders'] });
    },
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ['paper', 'alerts'],
    queryFn: () => apiFetch<Alert[]>('/paper/alerts'),
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAlertRequest) =>
      apiFetch<Alert>('/paper/alerts', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paper', 'alerts'] });
    },
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/paper/alerts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paper', 'alerts'] });
    },
  });
}
