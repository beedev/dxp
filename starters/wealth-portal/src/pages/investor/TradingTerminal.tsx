import React, { useState, useEffect, useRef } from 'react';
import { Card, Input } from '@dxp/ui';
import {
  useStockQuote,
  usePriceHistory,
  useSymbolSearch,
} from '@dxp/sdk-react';
import { PriceChart } from '../../components/PriceChart';
import { OrderPanel } from '../../components/OrderPanel';
import { useRegion, useRegionMock } from '../../contexts/RegionContext';

interface OrderData {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop-limit';
  qty: number;
  price: number;
  validity: 'DAY' | 'GTC';
  isPaper: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  filled: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-500',
  partial: 'bg-blue-100 text-blue-700',
};

// Map UI range labels to BFF range param
const RANGE_MAP: Record<string, string> = {
  '1M': '1m', '3M': '3m', '6M': '6m', '1Y': '1y',
};

export function TradingTerminal() {
  const { region, formatCurrency } = useRegion();
  const { holdings: regionHoldings, portfolioSummary, paperOrders: regionPaperOrders } = useRegionMock();
  const [selectedSymbol, setSelectedSymbol] = useState(region.defaultSymbol);
  const [chartRange, setChartRange] = useState('3M');
  const [isPaper, setIsPaper] = useState(true);
  const [submittedOrders, setSubmittedOrders] = useState<string[]>([]);

  // Free-text symbol search (any scrip across all exchanges)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const { data: searchResults = [], isLoading: searchLoading } = useSymbolSearch(searchQuery);

  // Close the results dropdown when clicking outside
  useEffect(() => {
    if (!searchOpen) return;
    const onClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [searchOpen]);

  const handlePickSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
    setSearchQuery('');
    setSearchOpen(false);
  };

  // When the user switches region, reset the picker to that region's default symbol
  useEffect(() => {
    setSelectedSymbol(region.defaultSymbol);
  }, [region.id, region.defaultSymbol]);

  // Live quote
  const { data: quote, isLoading: quoteLoading } = useStockQuote(selectedSymbol, { refetchInterval: 5 * 60 * 1000 });

  // Live price history for chart
  const { data: history } = usePriceHistory(selectedSymbol, RANGE_MAP[chartRange] ?? '3m');

  // Paper trading orders — fetch from BFF, merge with region mock data
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const fetchOrders = () => {
    fetch('/api/v1/paper/orders')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setLiveOrders(Array.isArray(data) ? data : data.orders || []))
      .catch(() => {});
  };
  useEffect(() => { fetchOrders(); }, []);

  const portfolio = portfolioSummary;
  const allOrders = [...liveOrders, ...regionPaperOrders];
  const pendingOrders = allOrders.filter((o) => o.status === 'pending');
  const recentOrders = allOrders.slice(0, 5);
  const handleCancel = (id: string) => {
    fetch(`/api/v1/paper/orders/${id}`, { method: 'DELETE' })
      .then(() => fetchOrders())
      .catch(() => {});
  };

  const handleSubmit = (order: OrderData) => {
    // Submit to BFF paper trading, then refresh order list
    fetch('/api/v1/paper/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: order.symbol,
        side: order.side,
        orderType: order.type,
        quantity: order.qty,
        price: order.price,
        validity: order.validity,
      }),
    })
      .then(() => fetchOrders())
      .catch(() => {});
    setSubmittedOrders((prev) => [
      `${order.side.toUpperCase()} ${order.qty} × ${order.symbol} @ ${order.type === 'market' ? 'MKT' : order.price}`,
      ...prev.slice(0, 4),
    ]);
  };

  // Derive display values — live when available, hardcoded mock only as last resort
  const price = quote?.price;
  const changePercent = quote?.changePercent;
  const change = quote?.change;
  const volume = quote?.volume;
  const high52w = quote?.high52w;
  const low52w = quote?.low52w;

  // Day high/low: approximate from history last bar if available
  const lastBar = history?.[history.length - 1];
  const dayHigh = lastBar?.high ?? (price ? price * 1.008 : null);
  const dayLow = lastBar?.low ?? (price ? price * 0.994 : null);

  // Spread: approximate ±0.05% of price
  const bid = price ? (price * 0.9995) : null;
  const ask = price ? (price * 1.0005) : null;

  const formatPrice = (p: number) =>
    p >= 1000 ? p.toLocaleString('en-US', { maximumFractionDigits: 2 }) : p.toFixed(2);

  const formatVolume = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v.toString();
  };

  const isPositive = (changePercent ?? 0) >= 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Trading Terminal</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">{region.flag} {region.name} equities · Paper trading enabled</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Chart + Info (60%) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Symbol selector: search any scrip + quick-pick from region holdings */}
          <Card className="p-4">
            {/* Row 1 — active symbol + chart range */}
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Active</p>
                <p className="text-sm font-mono font-bold text-[var(--dxp-text)]">{selectedSymbol}</p>
              </div>
              <div className="flex gap-1 ml-auto">
                {['1M', '3M', '6M', '1Y'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${chartRange === r ? 'bg-amber-600 text-white' : 'bg-[var(--dxp-border-light)] text-[var(--dxp-text-secondary)]'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {quoteLoading && (
                <span className="text-xs text-[var(--dxp-text-muted)] animate-pulse">Fetching live price…</span>
              )}
            </div>

            {/* Row 2 — search any scrip */}
            <div ref={searchBoxRef} className="relative mb-3">
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => searchQuery && setSearchOpen(true)}
                placeholder="Search any scrip — symbol or name (e.g. WIPRO, Reliance, 0700.HK, MSFT)"
              />
              {searchLoading && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-amber-600 animate-pulse">
                  Searching…
                </span>
              )}

              {/* Autocomplete dropdown */}
              {searchOpen && searchQuery.length > 0 && (
                <div className="absolute z-20 mt-1 w-full max-h-80 overflow-y-auto rounded-md border border-[var(--dxp-border)] bg-[var(--dxp-surface)] shadow-lg">
                  {searchResults.length === 0 && !searchLoading && (
                    <div className="px-4 py-3 text-xs text-[var(--dxp-text-muted)]">
                      No matches for "{searchQuery}". Try a different symbol or company name.
                    </div>
                  )}
                  {searchResults.map((result) => (
                    <button
                      key={result.symbol}
                      onClick={() => handlePickSymbol(result.symbol)}
                      className="flex w-full items-center justify-between gap-3 border-b border-[var(--dxp-border-light)] px-4 py-2.5 text-left last:border-b-0 hover:bg-amber-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-mono font-bold text-[var(--dxp-text)]">{result.symbol}</p>
                        <p className="truncate text-xs text-[var(--dxp-text-secondary)]">{result.name}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-[10px] font-semibold">
                        <span className="rounded-full bg-[var(--dxp-border-light)] px-2 py-0.5 text-[var(--dxp-text-secondary)]">
                          {result.exchange}
                        </span>
                        <span className="text-[var(--dxp-text-muted)]">{result.currency}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Row 3 — quick pick from region's blue-chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">
                {region.flag} Quick Pick
              </p>
              {regionHoldings.slice(0, 8).map((h) => (
                <button
                  key={h.symbol}
                  onClick={() => handlePickSymbol(h.symbol)}
                  aria-pressed={selectedSymbol === h.symbol}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold rounded border transition-colors ${
                    selectedSymbol === h.symbol
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-[var(--dxp-surface)] text-[var(--dxp-text-secondary)] border-[var(--dxp-border)] hover:border-amber-400 hover:text-amber-700'
                  }`}
                >
                  {h.symbol.split('.')[0]}
                </button>
              ))}
            </div>
          </Card>

          {/* Price + chart */}
          <Card className="p-4">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-3xl font-bold font-mono text-[var(--dxp-text)]">
                  {price != null ? formatPrice(price) : '—'}
                </p>
                {changePercent != null && change != null && (
                  <p className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%) today
                  </p>
                )}
                {quote && (
                  <p className="text-[10px] text-[var(--dxp-text-muted)] mt-0.5">
                    {quote.exchange} · {quote.currency} · {quote.isMarketOpen ? 'Market Open' : 'Market Closed'}
                    {' · '}Last updated {new Date(quote.lastUpdated).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="text-right text-xs text-[var(--dxp-text-muted)]">
                {bid != null && ask != null ? (
                  <>
                    <p>Bid <span className="font-mono font-semibold text-[var(--dxp-text)]">{formatPrice(bid)}</span></p>
                    <p>Ask <span className="font-mono font-semibold text-[var(--dxp-text)]">{formatPrice(ask)}</span></p>
                  </>
                ) : (
                  <p className="text-[var(--dxp-text-muted)]">Loading…</p>
                )}
              </div>
            </div>
            <PriceChart symbol={selectedSymbol} range={chartRange} height={250} data={history} />
          </Card>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Volume', value: volume != null ? formatVolume(volume) : '—' },
              { label: 'Day High', value: dayHigh != null ? formatPrice(dayHigh) : '—' },
              { label: 'Day Low', value: dayLow != null ? formatPrice(dayLow) : '—' },
              {
                label: '52w Range',
                value: high52w != null && low52w != null
                  ? `${formatPrice(low52w)}–${formatPrice(high52w)}`
                  : '—',
              },
            ].map((stat) => (
              <Card key={stat.label} className="p-3 text-center">
                <p className="text-xs text-[var(--dxp-text-muted)]">{stat.label}</p>
                <p className="text-sm font-bold font-mono text-[var(--dxp-text)]">{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* Recent executions this session */}
          {submittedOrders.length > 0 && (
            <Card className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--dxp-text-muted)] mb-3">Submitted this session</h3>
              <div className="space-y-1">
                {submittedOrders.map((o, i) => (
                  <p key={i} className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded font-mono">{o}</p>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Order panel + blotter (40%) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Paper toggle + balance */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-[var(--dxp-text-muted)]">Cash Available</p>
                <p className="text-base font-bold font-mono text-[var(--dxp-text)]">
                  {formatCurrency(portfolio.cashBalance)}
                </p>
                <p className={`text-xs font-semibold ${portfolio.totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  P&L {portfolio.totalPnl >= 0 ? '+' : ''}{formatCurrency(portfolio.totalPnl)}
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-semibold text-[var(--dxp-text-secondary)]">Paper Mode</span>
                <div
                  onClick={() => setIsPaper((p) => !p)}
                  className={`w-10 h-5 rounded-full transition-colors ${isPaper ? 'bg-amber-600' : 'bg-gray-300'} relative cursor-pointer`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPaper ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
            </div>
          </Card>

          <OrderPanel symbol={selectedSymbol} onSubmit={handleSubmit} isPaper={isPaper} />

          {/* Recent orders blotter */}
          <Card className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--dxp-text-muted)] mb-3">Recent Orders</h3>
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-xs">
                  <div>
                    <span className={`font-bold ${o.side === 'buy' ? 'text-emerald-600' : 'text-rose-600'}`}>{o.side.toUpperCase()}</span>
                    <span className="ml-2 font-mono text-[var(--dxp-text)]">{o.symbol}</span>
                    <span className="ml-1 text-[var(--dxp-text-muted)]">×{o.qty}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom: Pending open orders bar */}
      {pendingOrders.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-[var(--dxp-text)] mb-3">{pendingOrders.length} Open Order{pendingOrders.length > 1 ? 's' : ''}</h2>
          <div className="flex flex-wrap gap-3">
            {pendingOrders.map((o) => (
              <Card key={o.id} className="p-3 flex items-center gap-3">
                <div>
                  <p className="text-xs font-bold font-mono">{o.symbol}</p>
                  <p className={`text-[10px] font-semibold ${o.side === 'buy' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {o.side.toUpperCase()} {o.qty} @ {o.price} {o.validity}
                  </p>
                </div>
                <button
                  onClick={() => handleCancel(o.id)}
                  className="text-[10px] text-rose-600 border border-rose-200 px-2 py-0.5 rounded hover:bg-rose-50"
                >
                  Cancel
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
