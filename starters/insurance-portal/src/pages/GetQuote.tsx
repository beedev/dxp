import React, { useState } from 'react';
import { QuestionFlow, OrderSummary } from '@dxp/ui';
import { quoteQuestions } from '../data/mock';

export function GetQuote() {
  const [result, setResult] = useState<Record<string, string | string[]> | null>(null);

  if (result) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--dxp-text)]">Your Quote is Ready</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-2">Based on your selections, here's what we recommend.</p>

        <div className="max-w-md mt-6">
          <OrderSummary
            title="Quote Summary"
            items={[
              { label: 'Auto Insurance — Standard', detail: result['insurance-type'] as string, amount: '$165/mo' },
              { label: 'Coverage Level', detail: result['coverage-level'] as string, amount: '$32/mo' },
              ...(Array.isArray(result['priorities']) ? result['priorities'].map((p: string) => ({
                label: p.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                amount: '$0/mo',
              })) : []),
            ]}
            taxes={{ label: 'Taxes & Fees', amount: '$8.50/mo' }}
            total={{ label: 'Estimated Monthly', amount: '$205.50/mo' }}
            onConfirm={() => alert('Policy purchase initiated!')}
            onCancel={() => setResult(null)}
            confirmLabel="Purchase Policy"
            note="30-day money-back guarantee. Cancel anytime."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--dxp-text)]">Get a Quote</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-2">Answer a few questions and we'll find the right coverage for you.</p>
      </div>

      <div className="max-w-2xl">
        <QuestionFlow
          questions={quoteQuestions}
          onComplete={(answers) => setResult(answers)}
          submitLabel="Get My Quote"
        />
      </div>
    </div>
  );
}
