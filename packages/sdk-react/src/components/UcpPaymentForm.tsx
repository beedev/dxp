/**
 * UcpPaymentForm — embedded card capture via Stripe Elements.
 *
 * Drops into any portal cart/checkout page to collect card details *inside*
 * the merchant's site (the actual card input is rendered by Stripe in an
 * iframe, so PCI scope stays with Stripe). Confirms the PaymentIntent
 * client-side via Stripe.js.
 *
 * Usage:
 *   const create = useUcpCreateSession();
 *   const session = await create.mutateAsync({ ... });
 *   // session.payment.client_secret has the PI client_secret
 *
 *   <UcpPaymentForm
 *     clientSecret={session.payment!.client_secret!}
 *     onSuccess={(paymentIntentId) => completeUcp(paymentIntentId)}
 *   />
 */

import React, { useEffect, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { useUcpPublicConfig } from '../hooks/use-ucp-public-config';

export interface UcpPaymentFormProps {
  /** PaymentIntent client_secret returned in the UCP CheckoutSession. */
  clientSecret: string;
  /** Where Stripe should redirect on full-page authentication flows (3DS). */
  returnUrl?: string;
  /** Called after Stripe confirms the PaymentIntent successfully. */
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (message: string) => void;
  /** Override the publishable key (otherwise fetched from /ucp/public-config). */
  publishableKey?: string;
  /** Submit button label override. */
  submitLabel?: string;
}

export function UcpPaymentForm({
  clientSecret,
  returnUrl,
  onSuccess,
  onError,
  publishableKey,
  submitLabel = 'Pay now',
}: UcpPaymentFormProps) {
  const config = useUcpPublicConfig(!publishableKey);
  const pk = publishableKey ?? config.data?.stripe_publishable_key;
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    if (pk) setStripePromise(loadStripe(pk));
  }, [pk]);

  if (!pk) {
    return (
      <div className="text-sm text-[var(--dxp-text-muted)]">
        {config.isLoading ? 'Loading payment form…' : 'Stripe publishable key not configured.'}
      </div>
    );
  }
  if (!stripePromise) return null;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <InnerForm
        clientSecret={clientSecret}
        returnUrl={returnUrl}
        onSuccess={onSuccess}
        onError={onError}
        submitLabel={submitLabel}
      />
    </Elements>
  );
}

function InnerForm({
  clientSecret,
  returnUrl,
  onSuccess,
  onError,
  submitLabel,
}: Omit<UcpPaymentFormProps, 'publishableKey'> & { submitLabel: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    try {
      // `redirect: 'if_required'` keeps the user on our page when the card
      // doesn't need 3D Secure — the PaymentIntent succeeds inline. If 3DS
      // IS required, Stripe redirects to returnUrl.
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: returnUrl ? { return_url: returnUrl } : {},
        redirect: 'if_required',
      });
      if (confirmError) {
        const msg = confirmError.message || 'Payment failed';
        setError(msg);
        onError?.(msg);
        setSubmitting(false);
        return;
      }
      if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        onSuccess?.(paymentIntent.id);
      } else {
        const msg = `Unexpected payment status: ${paymentIntent?.status ?? 'unknown'}`;
        setError(msg);
        onError?.(msg);
      }
    } catch (err) {
      const msg = (err as Error).message || 'Payment failed';
      setError(msg);
      onError?.(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-[var(--dxp-radius)] bg-[var(--dxp-brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--dxp-brand-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Processing…' : submitLabel}
      </button>
      <p className="text-xs text-[var(--dxp-text-muted)] text-center">
        Test card: 4242 4242 4242 4242 · any future expiry · any 3-digit CVC
      </p>
    </form>
  );
}
