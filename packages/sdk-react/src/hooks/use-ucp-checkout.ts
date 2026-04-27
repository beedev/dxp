/**
 * UCP Checkout hooks — drive the BFF's Universal Commerce Protocol endpoints
 * from React. Backed by `apiFetch` so portal code stays compliant with the
 * "no direct BFF calls" rule.
 *
 * Lifecycle: useUcpCreateSession → useUcpUpdateSession → useUcpCompleteSession
 * (or useUcpCancelSession). Each hook returns a TanStack Query mutation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, getDxpConfig } from '../client/api-client';
import type {
  CheckoutSession,
  CheckoutResult,
  CreateSessionRequest,
  UpdateSessionRequest,
  CompleteSessionRequest,
  UcpProfile,
} from '@dxp/contracts';

const HEADERS = {
  'UCP-Agent': 'profile="https://dxp.local/agent-profiles/shopping-v1"',
};

/**
 * Resolve the unprefixed `/.well-known/ucp` URL by stripping the `/api/v1`
 * suffix from the configured BFF base. The discovery doc must be at the
 * server root per UCP spec, so we can't reuse `apiFetch` (which prepends the
 * versioned API path).
 */
function wellKnownUrl(): string {
  const base = getDxpConfig().bffUrl.replace(/\/api\/v\d+\/?$/, '');
  return `${base}/.well-known/ucp`;
}

/** Discovery doc — useful for portal "Powered by UCP" badges or capability checks. */
export function useUcpProfile(enabled = true) {
  return useQuery<UcpProfile>({
    queryKey: ['ucp', 'profile'],
    queryFn: async () => {
      const res = await fetch(wellKnownUrl(), { headers: { 'UCP-Agent': HEADERS['UCP-Agent'] } });
      if (!res.ok) throw new Error(`UCP profile ${res.status}`);
      return res.json() as Promise<UcpProfile>;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUcpCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateSessionRequest) =>
      apiFetch<CheckoutSession>('/ucp/checkout-sessions', {
        method: 'POST',
        body: JSON.stringify(req),
        headers: HEADERS,
      }),
    onSuccess: (session) => {
      qc.setQueryData(['ucp', 'checkout-session', session.id], session);
    },
  });
}

export function useUcpGetSession(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: ['ucp', 'checkout-session', sessionId],
    queryFn: () =>
      apiFetch<CheckoutSession>(`/ucp/checkout-sessions/${sessionId}`, { headers: HEADERS }),
    enabled: !!sessionId,
  });
}

export function useUcpUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateSessionRequest }) =>
      apiFetch<CheckoutSession>(`/ucp/checkout-sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
        headers: HEADERS,
      }),
    onSuccess: (session) => {
      qc.setQueryData(['ucp', 'checkout-session', session.id], session);
    },
  });
}

export function useUcpCompleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CompleteSessionRequest }) =>
      apiFetch<CheckoutResult>(`/ucp/checkout-sessions/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: HEADERS,
      }),
    onSuccess: (result) => {
      qc.setQueryData(['ucp', 'checkout-session', result.session.id], result.session);
    },
  });
}

export function useUcpCancelSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CheckoutSession>(`/ucp/checkout-sessions/${id}/cancel`, {
        method: 'POST',
        headers: HEADERS,
      }),
    onSuccess: (session) => {
      qc.setQueryData(['ucp', 'checkout-session', session.id], session);
    },
  });
}
