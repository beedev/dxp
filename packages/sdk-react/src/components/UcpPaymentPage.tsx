/**
 * UcpPaymentPage — drop-in composite for the secure-payment screen.
 *
 * Bundles the title block, security disclosure, Stripe Elements form, error
 * surface, and back link into a single composed component any DXP portal
 * can drop in. Use this when you want the full UX with no ceremony; if you
 * need a custom layout, use the lower-level <UcpPaymentForm /> instead.
 *
 * Typical usage in a portal cart page:
 *   const [stage, setStage] = useState<{sessionId, clientSecret, totalCents}|null>(null);
 *   ...after createSession + updateSession:
 *     setStage({ sessionId, clientSecret, totalCents });
 *
 *   {stage && (
 *     <UcpPaymentPage
 *       clientSecret={stage.clientSecret}
 *       totalCents={stage.totalCents}
 *       onSuccess={(pi) => completeOrder(stage.sessionId, pi)}
 *       onBack={() => setStage(null)}
 *     />
 *   )}
 */

import React, { useState } from 'react';
import { Card } from '@dxp/ui';
import { Lock } from 'lucide-react';
import { UcpPaymentForm } from './UcpPaymentForm';

export interface UcpPaymentPageProps {
  /** PaymentIntent client_secret (from session.payment.client_secret). */
  clientSecret: string;
  /** Total to display in the heading and submit button. Smallest currency unit (cents). */
  totalCents: number;
  /** ISO 4217 currency code; used only for display formatting. Defaults to USD. */
  currency?: string;
  /** Called after Stripe successfully confirms the PaymentIntent. */
  onSuccess: (paymentIntentId: string) => void;
  /** Optional back button — link rendered below the form when provided. */
  onBack?: () => void;
  /** Override the page heading. */
  title?: string;
  /** Override the security disclosure subtitle. */
  subtitle?: string;
  /** Override the publishable key (otherwise fetched from /ucp/public-config). */
  publishableKey?: string;
  /** Stripe will redirect here if 3-D Secure requires a full-page challenge. */
  returnUrl?: string;
}

export function UcpPaymentPage({
  clientSecret,
  totalCents,
  currency = 'USD',
  onSuccess,
  onBack,
  title = 'Secure payment',
  subtitle,
  publishableKey,
  returnUrl,
}: UcpPaymentPageProps) {
  const [error, setError] = useState<string | null>(null);

  const totalDisplay = formatMoney(totalCents, currency);
  const computedSubtitle =
    subtitle ?? `${totalDisplay} • Card details captured by Stripe; we never see your number.`;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Lock size={20} className="text-[var(--dxp-brand)]" />
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--dxp-text)]">{title}</h1>
        </div>
        <p className="text-[var(--dxp-text-secondary)] text-sm">{computedSubtitle}</p>
      </div>
      <Card className="p-6">
        <UcpPaymentForm
          clientSecret={clientSecret}
          publishableKey={publishableKey}
          returnUrl={returnUrl}
          submitLabel={`Pay ${totalDisplay}`}
          onSuccess={(pi) => {
            setError(null);
            onSuccess(pi);
          }}
          onError={(msg) => setError(msg)}
        />
        {error && (
          <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 text-xs text-[var(--dxp-text-muted)] hover:text-[var(--dxp-text)]"
          >
            ← Back
          </button>
        )}
      </Card>
    </div>
  );
}

function formatMoney(minorUnits: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(minorUnits / 100);
  } catch {
    return `${(minorUnits / 100).toFixed(2)} ${currency}`;
  }
}
