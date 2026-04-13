import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';

export function useLoyaltyMember(memberId: string) {
  return useQuery({
    queryKey: ['loyalty', 'member', memberId],
    queryFn: () => apiFetch(`/loyalty/members/${memberId}`),
    enabled: !!memberId,
  });
}

export function usePointsBalance(memberId: string) {
  return useQuery({
    queryKey: ['loyalty', 'points', memberId],
    queryFn: () => apiFetch(`/loyalty/members/${memberId}/points`),
    enabled: !!memberId,
  });
}

export function usePointsHistory(memberId: string) {
  return useQuery({
    queryKey: ['loyalty', 'transactions', memberId],
    queryFn: () => apiFetch(`/loyalty/members/${memberId}/transactions`),
    enabled: !!memberId,
  });
}

export function useRewardsCatalog() {
  return useQuery({
    queryKey: ['loyalty', 'rewards'],
    queryFn: () => apiFetch('/loyalty/rewards'),
  });
}
