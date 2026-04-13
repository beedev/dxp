import React, { useState } from 'react';
import { Card, MultiStepForm, Input, Select, OptionList, OrderSummary, Button, Badge } from '@dxp/ui';
import { ShoppingCart, Truck, Store as StoreIcon, CreditCard, CheckCircle } from 'lucide-react';
import { stores } from '../../data/mock-stores';

const cartItems = [
  { id: 'T001', name: 'DeWalt 20V MAX Cordless Drill/Driver Kit', brand: 'DeWalt', qty: 1, price: 99.00 },
  { id: 'P002', name: 'Benjamin Moore Regal Select Interior — White', brand: 'Benjamin Moore', qty: 2, price: 62.99 },
  { id: 'T003', name: 'Stanley FatMax 25 ft Tape Measure', brand: 'Stanley', qty: 1, price: 24.98 },
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

export function CartCheckout({ onNavigate }: CartCheckoutProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(cartItems.map((i) => [i.id, i.qty]))
  );
  const [delivery, setDelivery] = useState<string>('pickup');
  const [selectedStore, setSelectedStore] = useState('S001');
  const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '' });
  const [payment, setPayment] = useState({ card: '', expiry: '', cvv: '' });
  const [orderPlaced, setOrderPlaced] = useState(false);

  const activeItems = cartItems.filter((i) => quantities[i.id] > 0);
  const subtotal = activeItems.reduce((sum, i) => sum + i.price * quantities[i.id], 0);
  const deliveryFee = delivery === 'delivery' ? 9.99 : 0;
  const tax = (subtotal + deliveryFee) * 0.075;
  const total = subtotal + deliveryFee + tax;

  const updateQty = (id: string, delta: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  };

  if (orderPlaced) {
    return (
      <div>
        <div className="max-w-lg mx-auto mt-12">
          <Card className="p-8 text-center">
            <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
            <h2 className="text-2xl font-extrabold text-[var(--dxp-text)] mb-2">Order Placed!</h2>
            <p className="text-[var(--dxp-text-secondary)] mb-4">Your order has been confirmed.</p>
            <div className="bg-[var(--dxp-border-light)] rounded-lg p-4 mb-6">
              <p className="text-sm text-[var(--dxp-text-muted)]">Order Number</p>
              <p className="text-xl font-bold text-[var(--dxp-text)]">ORD-4830</p>
              <p className="text-sm text-[var(--dxp-text-muted)] mt-2">Estimated {delivery === 'pickup' ? 'ready for pickup' : 'delivery'}</p>
              <p className="text-base font-semibold text-[var(--dxp-text)]">
                {delivery === 'pickup' ? 'Today by 5:00 PM' : 'April 14, 2026'}
              </p>
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
      title: 'Payment',
      content: (
        <div>
          <h3 className="text-base font-bold text-[var(--dxp-text)] mb-4">Payment Details</h3>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={20} className="text-[var(--dxp-brand)]" />
              <span className="text-sm font-semibold text-[var(--dxp-text)]">Credit / Debit Card</span>
            </div>
            <div className="space-y-3">
              <LabeledInput
                label="Card Number"
                value={payment.card}
                onChange={(e) => setPayment({ ...payment, card: e.target.value })}
                placeholder="•••• •••• •••• ••••"
              />
              <div className="grid grid-cols-2 gap-3">
                <LabeledInput
                  label="Expiry Date"
                  value={payment.expiry}
                  onChange={(e) => setPayment({ ...payment, expiry: e.target.value })}
                  placeholder="MM/YY"
                />
                <LabeledInput
                  label="CVV"
                  value={payment.cvv}
                  onChange={(e) => setPayment({ ...payment, cvv: e.target.value })}
                  placeholder="•••"
                />
              </div>
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

      <MultiStepForm
        steps={steps}
        onSubmit={() => setOrderPlaced(true)}
        submitLabel="Place Order"
      />
    </div>
  );
}
