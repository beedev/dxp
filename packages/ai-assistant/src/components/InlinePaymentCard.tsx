/**
 * InlinePaymentCard — Stripe Elements card capture rendered inline in the
 * chat. Triggered when the backend emits `payment_required` (because the
 * UCP session reached `ready_for_complete`).
 *
 * All copy is persona-driven via the `data.checkout.inline_card` block in
 * the deployment's persona JSON. This component does not know about any
 * specific vertical; it only renders.
 */

import React, { useEffect, useState } from 'react';
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Card, CardContent } from '@dxp/ui';
import { Lock } from 'lucide-react';
import type {
  CheckoutCardConfig,
  PendingPayment,
} from '../lib/agent-types';

const DEFAULT_BFF_URL = 'http://localhost:4201/api/v1';

interface InlinePaymentCardProps {
  pending: PendingPayment;
  card?: CheckoutCardConfig;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
  /** Override the BFF base URL (used to fetch the Stripe publishable key
   * from /ucp/public-config). Defaults to localhost:4201/api/v1. */
  bffBaseUrl?: string;
}

const DEFAULTS: Required<CheckoutCardConfig> = {
  title: 'Complete your payment',
  subtitle: 'Your card is processed securely by Stripe.',
  submit_label: 'Pay {amount}',
  test_card_hint: 'Test card: 4242 4242 4242 4242',
  success_message: 'Payment confirmed.',
  cancel_label: 'Cancel',
};

function formatAmount(amount?: number, currency = 'USD'): string {
  if (amount == null) return '';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export function InlinePaymentCard({
  pending,
  card,
  onSuccess,
  onCancel,
  bffBaseUrl,
}: InlinePaymentCardProps) {
  const cfg = { ...DEFAULTS, ...(card ?? {}) };
  const url = bffBaseUrl || DEFAULT_BFF_URL;
  const [pk, setPk] = useState<string | null>(null);
  const [stripePromise, setStripePromise] =
    useState<Promise<StripeJs | null> | null>(null);

  useEffect(() => {
    fetch(`${url}/ucp/public-config`)
      .then((r) => r.json())
      .then((d) => setPk(d.stripe_publishable_key || null))
      .catch(() => setPk(null));
  }, [url]);

  useEffect(() => {
    if (pk) setStripePromise(loadStripe(pk));
  }, [pk]);

  const submitLabel = cfg.submit_label.replace(
    /\{amount\}/g,
    formatAmount(pending.amount, pending.currency) || 'now',
  );

  return (
    <Card className="border-2 border-[var(--dxp-brand-light)] shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--dxp-brand-light)] text-[var(--dxp-brand)]">
            <Lock size={14} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--dxp-text)]">{cfg.title}</h3>
            <p className="text-xs text-[var(--dxp-text-muted)]">{cfg.subtitle}</p>
          </div>
        </div>

        {!pk && (
          <div className="text-sm text-[var(--dxp-text-muted)]">Loading payment form…</div>
        )}

        {stripePromise && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: pending.client_secret, appearance: { theme: 'stripe' } }}
          >
            <PayInner
              submitLabel={submitLabel}
              testHint={cfg.test_card_hint}
              cancelLabel={cfg.cancel_label}
              onSuccess={onSuccess}
              onCancel={onCancel}
            />
          </Elements>
        )}
      </CardContent>
    </Card>
  );
}

function PayInner({
  submitLabel,
  testHint,
  cancelLabel,
  onSuccess,
  onCancel,
}: {
  submitLabel: string;
  testHint: string;
  cancelLabel: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {},
        redirect: 'if_required',
      });
      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        return;
      }
      if (
        paymentIntent &&
        (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')
      ) {
        onSuccess(paymentIntent.id);
      } else {
        setError(`Unexpected status: ${paymentIntent?.status ?? 'unknown'}`);
      }
    } catch (err) {
      setError((err as Error).message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <PaymentElement />
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePay}
          disabled={!stripe || submitting}
          className="flex-1 rounded-[var(--dxp-radius)] bg-[var(--dxp-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--dxp-brand-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Processing…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] px-3 py-2 text-xs text-[var(--dxp-text-secondary)] hover:bg-[var(--dxp-border-light)] transition-colors"
        >
          {cancelLabel}
        </button>
      </div>
      <p className="text-[10px] text-[var(--dxp-text-muted)] text-center">{testHint}</p>
    </div>
  );
}
