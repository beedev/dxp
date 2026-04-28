import React, { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardContent, Badge } from '@dxp/ui';
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

// Self-contained Stripe payment simulator — Create Intent → Stripe Elements
// → Confirm. Avoids pulling @dxp/sdk-react + TanStack Query into the playground
// bundle just to demo a payment.

const BFF_URL = 'http://localhost:4201/api/v1';

type Step = 'create' | 'pay' | 'success' | 'error';

interface SimulatorState {
  step: Step;
  amountDollars: string;
  currency: string;
  description: string;
  intentId: string | null;
  clientSecret: string | null;
  error: string | null;
  successPaymentId: string | null;
}

const initial: SimulatorState = {
  step: 'create',
  amountDollars: '49.99',
  currency: 'usd',
  description: 'Playground simulator',
  intentId: null,
  clientSecret: null,
  error: null,
  successPaymentId: null,
};

export function StripeSimulator({ accessToken }: { accessToken?: string }) {
  const [state, setState] = useState<SimulatorState>(initial);
  const [creating, setCreating] = useState(false);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<StripeJs | null> | null>(null);

  // Fetch the publishable key once on mount.
  useEffect(() => {
    fetch(`${BFF_URL}/ucp/public-config`)
      .then((r) => r.json())
      .then((d) => setPublishableKey(d.stripe_publishable_key || null))
      .catch(() => setPublishableKey(null));
  }, []);

  useEffect(() => {
    if (publishableKey) setStripePromise(loadStripe(publishableKey));
  }, [publishableKey]);

  const createIntent = async () => {
    setCreating(true);
    setState((s) => ({ ...s, error: null }));
    try {
      const cents = Math.round(Number(state.amountDollars) * 100);
      if (!Number.isFinite(cents) || cents <= 0) throw new Error('Enter a valid amount');
      const res = await fetch(`${BFF_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          amount: cents,
          currency: state.currency,
          description: state.description,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`);
      if (!body.clientSecret) throw new Error('No client_secret returned — adapter may not be Stripe');
      setState((s) => ({
        ...s,
        step: 'pay',
        intentId: body.id,
        clientSecret: body.clientSecret,
      }));
    } catch (err) {
      setState((s) => ({ ...s, error: (err as Error).message }));
    } finally {
      setCreating(false);
    }
  };

  const reset = () => setState(initial);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Stripe Payment Simulator</span>
            <div className="flex gap-2">
              <Badge variant={state.step === 'create' ? 'brand' : 'info'}>1. Create Intent</Badge>
              <Badge variant={state.step === 'pay' ? 'brand' : 'info'}>2. Pay</Badge>
              <Badge variant={state.step === 'success' ? 'success' : 'info'}>3. Result</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-[var(--dxp-text-muted)] mb-4">
            End-to-end Stripe lifecycle in the browser. Step 1 calls{' '}
            <code className="font-mono">POST /payments</code> on the BFF — same as any portal would.
            Step 2 mounts <code className="font-mono">{'<PaymentElement>'}</code> with the returned{' '}
            <code className="font-mono">client_secret</code> (PCI scope stays with Stripe). Test card:{' '}
            <code className="font-mono">4242 4242 4242 4242</code>, any future expiry, any CVC.
          </p>

          {state.step === 'create' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Amount</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.50"
                    value={state.amountDollars}
                    onChange={(e) => setState((s) => ({ ...s, amountDollars: e.target.value }))}
                    className="mt-1 w-full rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] px-3 py-2 text-sm font-mono"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Currency</span>
                  <select
                    value={state.currency}
                    onChange={(e) => setState((s) => ({ ...s, currency: e.target.value }))}
                    className="mt-1 w-full rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] px-3 py-2 text-sm"
                  >
                    <option value="usd">USD</option>
                    <option value="eur">EUR</option>
                    <option value="gbp">GBP</option>
                    <option value="inr">INR</option>
                    <option value="sgd">SGD</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Description</span>
                  <input
                    type="text"
                    value={state.description}
                    onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
                    className="mt-1 w-full rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] px-3 py-2 text-sm"
                  />
                </label>
              </div>
              {state.error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {state.error}
                </div>
              )}
              <Button onClick={createIntent} disabled={creating}>
                {creating ? 'Creating PaymentIntent…' : 'Create PaymentIntent'}
              </Button>
            </div>
          )}

          {state.step === 'pay' && state.clientSecret && stripePromise && (
            <div className="space-y-3">
              <div className="text-xs text-[var(--dxp-text-muted)] font-mono bg-[var(--dxp-border-light)] rounded px-3 py-2">
                <div>PaymentIntent: <span className="text-[var(--dxp-brand)]">{state.intentId}</span></div>
                <div>client_secret: <span className="text-[var(--dxp-success)]">{state.clientSecret.slice(0, 24)}…</span></div>
              </div>
              <Elements
                stripe={stripePromise}
                options={{ clientSecret: state.clientSecret, appearance: { theme: 'stripe' } }}
              >
                <PayInner
                  onSuccess={(pid) => setState((s) => ({ ...s, step: 'success', successPaymentId: pid }))}
                  onError={(msg) => setState((s) => ({ ...s, error: msg }))}
                />
              </Elements>
              {state.error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {state.error}
                </div>
              )}
              <button onClick={reset} className="text-xs text-[var(--dxp-text-muted)] underline">
                Cancel & start over
              </button>
            </div>
          )}

          {state.step === 'pay' && (!stripePromise || !publishableKey) && (
            <div className="text-sm text-[var(--dxp-text-muted)]">Loading Stripe…</div>
          )}

          {state.step === 'success' && (
            <div className="space-y-3">
              <div className="rounded-[var(--dxp-radius)] border border-green-200 bg-green-50 p-4 text-sm">
                <div className="font-bold text-green-800">Payment succeeded</div>
                <div className="font-mono text-xs text-green-700 mt-1">
                  PaymentIntent: {state.successPaymentId}
                </div>
                <div className="text-xs text-green-700 mt-2">
                  View it in the{' '}
                  <a
                    href={`https://dashboard.stripe.com/test/payments/${state.successPaymentId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Stripe test dashboard →
                  </a>
                </div>
              </div>
              <Button onClick={reset} variant="secondary">Run another</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PayInner({
  onSuccess,
  onError,
}: {
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {},
        redirect: 'if_required',
      });
      if (error) {
        onError(error.message || 'Payment failed');
        return;
      }
      if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        onSuccess(paymentIntent.id);
      } else {
        onError(`Unexpected status: ${paymentIntent?.status ?? 'unknown'}`);
      }
    } catch (err) {
      onError((err as Error).message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <PaymentElement />
      <Button onClick={handlePay} disabled={!stripe || submitting}>
        {submitting ? 'Processing…' : 'Pay now'}
      </Button>
    </div>
  );
}
