import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type { Order, PlaceOrderRequest } from '@dxp/contracts';

export function useBrokerAccount() {
  return useQuery({
    queryKey: ['broker', 'account'],
    queryFn: () => apiFetch<Record<string, unknown>>('/broker/account'),
  });
}

export function useBrokerOrders() {
  return useQuery({
    queryKey: ['broker', 'orders'],
    queryFn: () => apiFetch<Order[]>('/broker/orders'),
  });
}

export function usePlaceBrokerOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PlaceOrderRequest) =>
      apiFetch<Order>('/broker/orders', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broker', 'orders'] });
      qc.invalidateQueries({ queryKey: ['broker', 'account'] });
    },
  });
}

export function useCancelBrokerOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/broker/orders/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broker', 'orders'] });
    },
  });
}
