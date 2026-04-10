import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '@dxp/ui';
import { usePlaceOrder, useStockQuote } from '@dxp/sdk-react';
import { useRegion } from '../contexts/RegionContext';

interface OrderData {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop-limit';
  qty: number;
  price: number;
  validity: 'DAY' | 'GTC';
  isPaper: boolean;
}

interface OrderPanelProps {
  symbol?: string;
  onSubmit: (order: OrderData) => void;
  isPaper: boolean;
}

const VALIDITY_OPTIONS = [
  { value: 'DAY', label: 'Day Order' },
  { value: 'GTC', label: 'Good Till Cancelled' },
];

export function OrderPanel({ symbol: defaultSymbol, onSubmit, isPaper }: OrderPanelProps) {
  const { region } = useRegion();
  const [symbol, setSymbol] = useState(defaultSymbol ?? region.defaultSymbol);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [type, setType] = useState<'market' | 'limit' | 'stop' | 'stop-limit'>('limit');
  const [qty, setQty] = useState<number>(100);
  const [price, setPrice] = useState<number>(38.45);
  const [validity, setValidity] = useState<'DAY' | 'GTC'>('GTC');
  const [lastError, setLastError] = useState<string | null>(null);

  // Sync internal symbol state when parent changes the active scrip
  useEffect(() => {
    if (defaultSymbol) setSymbol(defaultSymbol);
  }, [defaultSymbol]);

  // Pre-fill limit price with the live quote whenever the symbol changes
  const { data: liveQuote } = useStockQuote(symbol, { refetchInterval: 5 * 60 * 1000 });
  useEffect(() => {
    if (liveQuote?.price) setPrice(liveQuote.price);
  }, [liveQuote?.price]);

  const { mutate: placeOrder, isPending } = usePlaceOrder();

  const showPrice = type !== 'market';
  const estimatedValue = qty * price;

  const handleSubmit = () => {
    setLastError(null);
    placeOrder(
      { symbol, side, type, qty, price: showPrice ? price : undefined, validity, exchange: region.defaultOrderExchange },
      {
        onSuccess: () => onSubmit({ symbol, side, type, qty, price, validity, isPaper }),
        onError: (err: any) => setLastError(err?.message ?? 'Order failed'),
      },
    );
  };

  return (
    <div className="border border-[var(--dxp-border)] rounded-lg p-4 bg-[var(--dxp-surface)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--dxp-text)]">Place Order</h3>
        {isPaper && (
          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-300">
            PAPER MODE
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-[var(--dxp-text-secondary)] block mb-1">Symbol</label>
          <Input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--dxp-text-secondary)] block mb-1">Side</label>
          <div className="flex rounded-md overflow-hidden border border-[var(--dxp-border)]">
            <button
              onClick={() => setSide('buy')}
              className={`flex-1 py-2 text-sm font-bold transition-colors ${side === 'buy' ? 'bg-emerald-600 text-white' : 'bg-[var(--dxp-surface)] text-[var(--dxp-text-secondary)] hover:bg-emerald-50'}`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide('sell')}
              className={`flex-1 py-2 text-sm font-bold transition-colors ${side === 'sell' ? 'bg-rose-600 text-white' : 'bg-[var(--dxp-surface)] text-[var(--dxp-text-secondary)] hover:bg-rose-50'}`}
            >
              Sell
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--dxp-text-secondary)] block mb-1">Order Type</label>
          <div className="flex gap-1">
            {(['market', 'limit', 'stop', 'stop-limit'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded border transition-colors ${
                  type === t
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-[var(--dxp-surface)] text-[var(--dxp-text-secondary)] border-[var(--dxp-border)] hover:border-amber-300'
                }`}
              >
                {t === 'stop-limit' ? 'STP-LMT' : t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--dxp-text-secondary)] block mb-1">Quantity</label>
          <Input
            type="number"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            min={1}
          />
        </div>

        {showPrice && (
          <div>
            <label className="text-xs font-semibold text-[var(--dxp-text-secondary)] block mb-1">Limit Price</label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              step="0.01"
            />
          </div>
        )}

        <Select
          options={VALIDITY_OPTIONS}
          value={validity}
          onChange={setValidity as any}
          label="Validity"
        />

        {showPrice && (
          <div className="bg-[var(--dxp-border-light)] rounded-md p-3">
            <p className="text-xs text-[var(--dxp-text-secondary)]">Estimated Value</p>
            <p className="text-base font-bold font-mono text-[var(--dxp-text)]">
              {estimatedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {lastError && (
          <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded border border-rose-200">{lastError}</p>
        )}

        <Button
          variant="primary"
          disabled={isPending || qty <= 0}
          onClick={handleSubmit}
          className={side === 'buy' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
        >
          {isPending ? 'Placing…' : (side === 'buy' ? 'Place Buy Order' : 'Place Sell Order')}
          {!isPending && isPaper && ' (Paper)'}
        </Button>
      </div>
    </div>
  );
}
