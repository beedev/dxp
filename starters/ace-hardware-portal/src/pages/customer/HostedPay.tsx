/**
 * HostedPay — the deep-link target for external agents (ChatGPT, MCP clients,
 * email links). They direct the buyer to /customer/pay?session=<id>; this page
 * fetches the existing UCP session, renders Stripe Elements via UcpPaymentPage,
 * confirms the PaymentIntent client-side, and calls UCP `complete` on success.
 *
 * Embedded chat checkout (the inline Stripe Elements card in @dxp/ai-assistant)
 * never hits this page — that flow stays in-place. This is purely the public
 * hosted surface for callers that can't render iframes.
 */

import React, { useMemo } from 'react';
import { Card, CardContent, Button, Badge } from '@dxp/ui';
import { CheckCircle, Lock } from 'lucide-react';
import {
  useUcpGetSession,
  useUcpCompleteSession,
  UcpPaymentPage,
} from '@dxp/sdk-react';

interface HostedPayProps {
  onNavigate: (page: string) => void;
}

function readSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('session');
}

function formatTotalCents(cents: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export function HostedPay({ onNavigate }: HostedPayProps) {
  const sessionId = useMemo(readSessionId, []);
  const session = useUcpGetSession(sessionId);
  const completeSession = useUcpCompleteSession();
  const [completed, setCompleted] = React.useState<{ orderId: string; paymentId: string } | null>(null);
  const [completionError, setCompletionError] = React.useState<string | null>(null);

  if (!sessionId) {
    return (
      <Empty
        title="No checkout session"
        body="This page expects a UCP checkout session id in the URL: /customer/pay?session=<id>"
        onNavigate={onNavigate}
      />
    );
  }

  if (session.isLoading) {
    return <Empty title="Loading session…" body="Fetching your order details." onNavigate={onNavigate} />;
  }

  if (session.isError || !session.data) {
    return (
      <Empty
        title="Session not found"
        body={`We couldn't load checkout session ${sessionId}. It may have expired or already been completed.`}
        onNavigate={onNavigate}
      />
    );
  }

  const data = session.data;
  const total = data.totals?.find((t) => t.type === 'total')?.amount ?? 0;
  const clientSecret = data.payment?.client_secret;
  const items = data.line_items ?? [];

  if (data.status === 'completed' || completed) {
    return (
      <Success
        sessionId={sessionId}
        orderId={completed?.orderId}
        paymentId={completed?.paymentId}
        total={total}
        currency={data.currency}
        onNavigate={onNavigate}
      />
    );
  }

  if (!clientSecret) {
    return (
      <Empty
        title="Payment not configured"
        body="This UCP adapter did not return a Stripe client_secret. Check your BFF PAYMENTS_PROVIDER setting."
        onNavigate={onNavigate}
      />
    );
  }

  const handleStripeSuccess = async (paymentIntentId: string) => {
    setCompletionError(null);
    try {
      const result = await completeSession.mutateAsync({
        id: sessionId,
        body: {
          payment_data: {
            id: paymentIntentId,
            handler_id: 'com.stripe.pay',
            type: 'card',
            credential: { type: 'PAYMENT_GATEWAY', token: paymentIntentId },
          },
        },
      });
      setCompleted({
        orderId: result.order_id ?? '(no order id)',
        paymentId: result.payment_id ?? paymentIntentId,
      });
    } catch (err) {
      setCompletionError((err as Error).message || 'Failed to finalize order');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--dxp-text)]">Complete your payment</h1>
          <p className="text-sm text-[var(--dxp-text-muted)]">
            Powered by UCP · Session <code className="font-mono text-xs">{sessionId.slice(0, 24)}…</code>
          </p>
        </div>
        <Badge variant="info">{data.status}</Badge>
      </header>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Order summary</div>
          <ul className="space-y-1.5 text-sm">
            {items.map((li) => (
              <li key={li.id} className="flex justify-between">
                <span className="text-[var(--dxp-text)]">
                  {li.item.title} × {li.quantity}
                </span>
                <span className="font-mono text-[var(--dxp-text-secondary)]">
                  {formatTotalCents(li.item.price * li.quantity, data.currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-[var(--dxp-border-light)] pt-2 mt-2">
            <span className="font-bold text-[var(--dxp-text)]">Total</span>
            <span className="font-bold font-mono text-[var(--dxp-text)]">
              {formatTotalCents(total, data.currency)}
            </span>
          </div>
        </CardContent>
      </Card>

      <UcpPaymentPage
        clientSecret={clientSecret}
        totalCents={total}
        currency={data.currency}
        onSuccess={handleStripeSuccess}
        onCancel={() => onNavigate('/customer')}
      />

      {completionError && (
        <div className="rounded-[var(--dxp-radius)] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {completionError}
        </div>
      )}
    </div>
  );
}

function Empty({
  title,
  body,
  onNavigate,
}: {
  title: string;
  body: string;
  onNavigate: (page: string) => void;
}) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardContent className="p-6 space-y-3 text-center">
          <Lock size={28} className="mx-auto text-[var(--dxp-text-muted)]" />
          <h1 className="text-lg font-bold text-[var(--dxp-text)]">{title}</h1>
          <p className="text-sm text-[var(--dxp-text-muted)]">{body}</p>
          <Button onClick={() => onNavigate('/customer')}>Back to portal</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Success({
  sessionId,
  orderId,
  paymentId,
  total,
  currency,
  onNavigate,
}: {
  sessionId: string;
  orderId?: string;
  paymentId?: string;
  total: number;
  currency: string;
  onNavigate: (page: string) => void;
}) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardContent className="p-6 space-y-3 text-center">
          <CheckCircle size={36} className="mx-auto text-[var(--dxp-success)]" />
          <h1 className="text-lg font-bold text-[var(--dxp-text)]">Payment confirmed</h1>
          <p className="text-sm text-[var(--dxp-text-muted)]">
            Total {formatTotalCents(total, currency)} · Session{' '}
            <code className="font-mono text-xs">{sessionId.slice(0, 16)}…</code>
          </p>
          {orderId && (
            <p className="text-sm text-[var(--dxp-text)]">
              Order <code className="font-mono">{orderId}</code>
            </p>
          )}
          {paymentId && (
            <p className="text-xs text-[var(--dxp-text-muted)]">
              Payment <code className="font-mono">{paymentId}</code>
            </p>
          )}
          <Button onClick={() => onNavigate('/customer')}>Back to portal</Button>
        </CardContent>
      </Card>
    </div>
  );
}
