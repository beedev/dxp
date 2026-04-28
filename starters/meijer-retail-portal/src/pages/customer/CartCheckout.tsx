import React, { useState } from 'react';
import { Card, MultiStepForm, Input, Select, OptionList, OrderSummary, Button, Badge } from '@dxp/ui';
import { ShoppingCart, Truck, Store as StoreIcon, CreditCard, CheckCircle, Zap, Lock } from 'lucide-react';
import {
  useUcpCreateSession,
  useUcpUpdateSession,
  useUcpCompleteSession,
  useUcpProfile,
  UcpPaymentPage,
} from '@dxp/sdk-react';
import { stores } from '../../data/mock-stores';

const cartItems = [
  { id: 'MEAT-002', name: '80/20 Ground Beef Family Pack, 3 lb', brand: 'Meijer',       qty: 1, price: 16.99 },
  { id: 'BAKE-001', name: 'Hamburger Buns, 8 ct',                brand: 'Meijer Bakery', qty: 2, price:  2.49 },
  { id: 'BEV-005',  name: 'Bud Light, 12-pack 12 oz Cans',       brand: 'Bud Light',     qty: 1, price: 14.99 },
  { id: 'SNK-002',  name: 'Doritos Nacho Cheese, Family Size',   brand: 'Doritos',       qty: 1, price:  4.99 },
];

const storeOptions = stores.slice(0, 8).map((s) => ({
  value: s.id,
  label: `${s.name} — ${s.city}, ${s.state}`,
}));

function LabeledInput({ label, ...props }: { label: string } & React.ComponentPropsWithoutRef<typeof Input>) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--dxp-text)] mb-1.5">{label}</label>
      <Input {...props} />
    </div>
  );
}

interface CartCheckoutProps {
  onNavigate: (page: string) => void;
}

interface UcpReceipt {
  sessionId: string;
  orderId: string;
  paymentId: string;
  totalCents: number;
  adapter: string;
}

interface PaymentStage {
  sessionId: string;
  clientSecret: string;
  totalCents: number;
}

export function CartCheckout({ onNavigate }: CartCheckoutProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(cartItems.map((i) => [i.id, i.qty]))
  );
  const [delivery, setDelivery] = useState<string>('pickup');
  const [selectedStore, setSelectedStore] = useState('S001');
  const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '' });
  const [submitting, setSubmitting] = useState(false);
  const [ucpError, setUcpError] = useState<string | null>(null);
  const [paymentStage, setPaymentStage] = useState<PaymentStage | null>(null);
  const [receipt, setReceipt] = useState<UcpReceipt | null>(null);

  // UCP wiring — every checkout submit drives a real /api/v1/ucp/checkout-sessions flow.
  const createSession = useUcpCreateSession();
  const updateSession = useUcpUpdateSession();
  const completeSession = useUcpCompleteSession();
  const ucpProfile = useUcpProfile();

  const activeItems = cartItems.filter((i) => quantities[i.id] > 0);
  const subtotal = activeItems.reduce((sum, i) => sum + i.price * quantities[i.id], 0);
  const deliveryFee = delivery === 'delivery' ? 9.99 : 0;
  const tax = (subtotal + deliveryFee) * 0.075;
  const total = subtotal + deliveryFee + tax;

  const updateQty = (id: string, delta: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  };

  const placeOrderViaUcp = async () => {
    setUcpError(null);
    setSubmitting(true);
    try {
      // 1. Create — line items priced in minor units (cents). Server creates
      //    a Stripe PaymentIntent and returns its client_secret in
      //    session.payment.client_secret for the embedded card form.
      const session = await createSession.mutateAsync({
        currency: 'USD',
        line_items: activeItems.map((i, idx) => ({
          id: `li_${idx + 1}`,
          item: { id: i.id, title: i.name, price: Math.round(i.price * 100) },
          quantity: quantities[i.id],
        })),
      });

      // 2. Update — buyer + fulfillment selection.
      const fulfillmentMethod = {
        id: 'fm_1',
        type: delivery === 'delivery' ? ('shipping' as const) : ('pickup' as const),
        line_item_ids: activeItems.map((_, idx) => `li_${idx + 1}`),
        ...(delivery === 'delivery'
          ? {
              destinations: [
                {
                  id: 'dest_home',
                  street_address: address.street,
                  address_locality: address.city,
                  address_region: address.state,
                  postal_code: address.zip,
                  address_country: 'US',
                },
              ],
              selected_destination_id: 'dest_home',
            }
          : {}),
      };
      const updated = await updateSession.mutateAsync({
        id: session.id,
        patch: {
          buyer: { email: 'jane@example.com', first_name: 'Jane', last_name: 'Doe' },
          fulfillment: { methods: [fulfillmentMethod] },
        },
      });

      const clientSecret = updated.payment?.client_secret ?? session.payment?.client_secret;
      if (!clientSecret) {
        throw new Error('Adapter did not return a payment client_secret. Stripe Elements requires it.');
      }
      const totalCents = updated.totals.find((t) => t.type === 'total')?.amount ?? 0;

      // 3. Hand off to Stripe Elements for embedded card capture. We DO NOT
      //    call completeSession here — that fires after the customer submits
      //    the card form and Stripe confirms the PaymentIntent.
      setPaymentStage({ sessionId: session.id, clientSecret, totalCents });
    } catch (err) {
      setUcpError((err as Error).message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  const onStripeSuccess = async (paymentIntentId: string) => {
    if (!paymentStage) return;
    setUcpError(null);
    try {
      const result = await completeSession.mutateAsync({
        id: paymentStage.sessionId,
        body: {
          payment_data: {
            // The PI is already confirmed by Stripe Elements client-side.
            // The adapter retrieves it server-side and verifies status.
            id: paymentIntentId,
            handler_id: 'com.stripe.elements',
            type: 'card',
            credential: { type: 'PAYMENT_GATEWAY', token: paymentIntentId },
          },
        },
      });
      const totalCents = result.session.totals.find((t) => t.type === 'total')?.amount ?? paymentStage.totalCents;
      const adapter = paymentStage.sessionId.startsWith('pi_') ? 'stripe' : 'mock';
      setReceipt({
        sessionId: paymentStage.sessionId,
        orderId: result.order_id ?? '—',
        paymentId: result.payment_id ?? paymentIntentId,
        totalCents,
        adapter,
      });
      setPaymentStage(null);
    } catch (err) {
      setUcpError((err as Error).message || 'Failed to finalize order');
    }
  };

  // Stage 2: payment-capture screen — drops in the @dxp/sdk-react composite.
  if (paymentStage) {
    return (
      <UcpPaymentPage
        clientSecret={paymentStage.clientSecret}
        totalCents={paymentStage.totalCents}
        onSuccess={onStripeSuccess}
        onBack={() => setPaymentStage(null)}
      />
    );
  }

  if (receipt) {
    return (
      <div>
        <div className="max-w-xl mx-auto mt-12">
          <Card className="p-8 text-center">
            <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
            <h2 className="text-2xl font-extrabold text-[var(--dxp-text)] mb-1">Order Placed</h2>
            <p className="text-[var(--dxp-text-secondary)] mb-4">
              Settled via the UCP <span className="font-semibold uppercase">{receipt.adapter}</span> adapter.
            </p>
            <div className="bg-[var(--dxp-border-light)] rounded-lg p-4 mb-6 text-left space-y-1.5">
              <KV label="Order ID" value={receipt.orderId} />
              <KV label="Payment ID" value={receipt.paymentId} />
              <KV label="UCP Session" value={receipt.sessionId} />
              <KV label="Total Charged" value={`$${(receipt.totalCents / 100).toFixed(2)}`} />
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" onClick={() => onNavigate('/customer/orders')}>
                View Orders
              </Button>
              <Button variant="secondary" onClick={() => onNavigate('/customer/catalog')}>
                Continue Shopping
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const steps = [
    {
      title: 'Review Cart',
      content: (
        <div>
          <div className="space-y-3 mb-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-[var(--dxp-border-light)]">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--dxp-text)]">{item.name}</p>
                  <p className="text-xs text-[var(--dxp-text-muted)]">{item.brand}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-7 h-7 rounded-full border border-[var(--dxp-border)] flex items-center justify-center text-sm font-bold hover:bg-[var(--dxp-border-light)]"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">{quantities[item.id]}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-7 h-7 rounded-full border border-[var(--dxp-border)] flex items-center justify-center text-sm font-bold hover:bg-[var(--dxp-border-light)]"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-bold text-[var(--dxp-text)] w-20 text-right">
                    ${(item.price * quantities[item.id]).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <OrderSummary
            items={activeItems.map((i) => ({
              label: i.name,
              detail: `Qty: ${quantities[i.id]} × $${i.price.toFixed(2)}`,
              amount: `$${(i.price * quantities[i.id]).toFixed(2)}`,
            }))}
            taxes={{ label: 'Estimated Tax (7.5%)', amount: `$${tax.toFixed(2)}` }}
            total={{ label: 'Estimated Total', amount: `$${total.toFixed(2)}` }}
          />
        </div>
      ),
    },
    {
      title: 'Delivery',
      content: (
        <div>
          <h3 className="text-base font-bold text-[var(--dxp-text)] mb-4">Choose delivery method</h3>
          <OptionList
            options={[
              { id: 'pickup', label: 'Store Pickup', description: 'Free — Ready in 2 hours', icon: <StoreIcon size={20} className="text-[var(--dxp-brand)]" /> },
              { id: 'delivery', label: 'Home Delivery', description: '$9.99 — 3-5 business days', icon: <Truck size={20} className="text-[var(--dxp-brand)]" /> },
            ]}
            value={delivery}
            onChange={(v) => setDelivery(v as string)}
            columns={2}
          />

          {delivery === 'pickup' && (
            <div className="mt-6">
              <Select
                label="Select pickup store"
                options={storeOptions}
                value={selectedStore}
                onChange={(v) => setSelectedStore(v)}
              />
              <Card className="mt-3 p-4">
                <p className="text-sm font-semibold text-[var(--dxp-text)]">
                  {storeOptions.find((s) => s.value === selectedStore)?.label}
                </p>
                <p className="text-xs text-[var(--dxp-text-muted)] mt-1">Ready for pickup in approximately 2 hours</p>
                <Badge variant="success" className="mt-2">Free Pickup</Badge>
              </Card>
            </div>
          )}

          {delivery === 'delivery' && (
            <div className="mt-6 space-y-3">
              <LabeledInput
                label="Street Address"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                placeholder="123 Main St"
              />
              <div className="grid grid-cols-3 gap-3">
                <LabeledInput
                  label="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="Naperville"
                />
                <LabeledInput
                  label="State"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  placeholder="IL"
                />
                <LabeledInput
                  label="ZIP Code"
                  value={address.zip}
                  onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                  placeholder="60540"
                />
              </div>
              <Card className="p-3 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--dxp-text)]">Delivery Fee</span>
                  <span className="text-sm font-bold text-[var(--dxp-text)]">$9.99</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Review & Pay',
      content: (
        <div>
          <h3 className="text-base font-bold text-[var(--dxp-text)] mb-4">Confirm your order</h3>
          <Card className="p-5 mb-4 flex items-start gap-3 bg-[var(--dxp-brand-light)]">
            <Lock size={20} className="text-[var(--dxp-brand)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[var(--dxp-text)]">Secure card capture via Stripe</p>
              <p className="text-xs text-[var(--dxp-text-secondary)] mt-0.5">
                On the next screen, enter your card details on a Stripe-managed form. Your card never
                touches our servers — Stripe handles tokenization and PCI compliance.
              </p>
            </div>
          </Card>

          <Card className="p-4 mt-4 bg-[var(--dxp-border-light)]">
            <h4 className="text-sm font-bold text-[var(--dxp-text)] mb-2">Order Summary</h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--dxp-text-secondary)]">Subtotal ({activeItems.length} items)</span>
                <span className="text-[var(--dxp-text)]">${subtotal.toFixed(2)}</span>
              </div>
              {delivery === 'delivery' && (
                <div className="flex justify-between">
                  <span className="text-[var(--dxp-text-secondary)]">Delivery</span>
                  <span className="text-[var(--dxp-text)]">$9.99</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--dxp-text-secondary)]">Tax</span>
                <span className="text-[var(--dxp-text)]">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[var(--dxp-border)]">
                <span className="font-bold text-[var(--dxp-text)]">Total</span>
                <span className="font-bold text-[var(--dxp-text)]">${total.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart size={24} className="text-[var(--dxp-brand)]" />
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Checkout</h1>
        </div>
        <p className="text-[var(--dxp-text-secondary)]">{activeItems.length} items in your cart</p>
      </div>

      {ucpProfile.data && (
        <Card className="mb-4 p-3 flex items-center gap-2 bg-[var(--dxp-border-light)]">
          <Zap size={16} className="text-[var(--dxp-brand)]" />
          <span className="text-xs text-[var(--dxp-text-secondary)]">
            Checkout powered by{' '}
            <span className="font-semibold text-[var(--dxp-text)]">UCP {ucpProfile.data.ucp.version}</span>
            {' · capabilities: '}
            {ucpProfile.data.ucp.capabilities.map((c) => c.name).join(', ')}
          </span>
        </Card>
      )}

      {ucpError && (
        <Card className="mb-4 p-3 border-l-4 border-red-500">
          <p className="text-sm text-red-700">UCP checkout failed: {ucpError}</p>
        </Card>
      )}

      <MultiStepForm
        steps={steps}
        onSubmit={placeOrderViaUcp}
        submitLabel={submitting ? 'Placing order…' : 'Place Order'}
      />
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <span className="text-xs text-[var(--dxp-text-muted)] uppercase tracking-wider">{label}</span>
      <span className="text-sm font-mono text-[var(--dxp-text)] truncate">{value}</span>
    </div>
  );
}
