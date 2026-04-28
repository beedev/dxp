import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type { UcpPublicConfig } from '@dxp/contracts';

/**
 * Fetch the UCP public config (UCP version + Stripe publishable key) — what
 * a browser needs to wire up Stripe Elements for embedded card capture.
 */
export function useUcpPublicConfig(enabled = true) {
  return useQuery<UcpPublicConfig>({
    queryKey: ['ucp', 'public-config'],
    queryFn: () => apiFetch<UcpPublicConfig>('/ucp/public-config'),
    enabled,
    staleTime: 60 * 60 * 1000,
  });
}
