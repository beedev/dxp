import React, { useState } from 'react';
import { Card, Input } from '@dxp/ui';
import { useSymbolSearch, useStockQuotes } from '@dxp/sdk-react';
import { useRegion, useRegionMock } from '../../contexts/RegionContext';

const COUNTRY_FLAGS: Record<string, string> = {
  SGX: '🇸🇬', Singapore: '🇸🇬',
  HKEX: '🇭🇰', 'Hong Kong': '🇭🇰',
  TSE: '🇯🇵', Japan: '🇯🇵',
  ASX: '🇦🇺', Australia: '🇦🇺',
  NSE: '🇮🇳', BSE: '🇮🇳', India: '🇮🇳',
  KRX: '🇰🇷', 'South Korea': '🇰🇷',
  SSE: '🇨🇳', China: '🇨🇳',
  TWSE: '🇹🇼', Taiwan: '🇹🇼',
  NYSE: '🇺🇸', NASDAQ: '🇺🇸', 'United States': '🇺🇸',
  OTC: '🌏', 'OTC Markets': '🌏',
};

export function StockSearch() {
  const { region } = useRegion();
  const { holdings: regionHoldings, watchlist: regionWatchlist } = useRegionMock();
  const [query, setQuery] = useState('');
  const [watchlistAdded, setWatchlistAdded] = useState<Set<string>>(new Set());

  // Region-specific "popular" symbols — change when region switches
  const POPULAR_SYMBOLS = React.useMemo(
    () => [
      ...regionHoldings.map((h) => h.symbol),
      ...regionWatchlist.map((w) => w.symbol),
    ],
    [regionHoldings, regionWatchlist]
  );

  // Live symbol search (debounced by staleTime)
  const { data: searchResults, isLoading: searching } = useSymbolSearch(query);

  // Live quotes for popular symbols shown on empty state
  const { data: popularQuotes } = useStockQuotes(POPULAR_SYMBOLS, { refetchInterval: 5 * 60 * 1000 });

  const handleAddWatchlist = (symbol: string) => {
    setWatchlistAdded((prev) => new Set([...prev, symbol]));
  };

  const isSearching = query.length > 0;
  const results = isSearching ? (searchResults ?? []) : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Stock Search</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Search {region.flag} {region.name} and global equities across exchanges</p>
      </div>

      <div className="mb-6 relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${region.name} stocks by name or symbol (e.g. ${regionHoldings[0]?.symbol.split('.')[0] ?? 'TICKER'}, ${regionHoldings[1]?.name.split(' ')[0] ?? 'Name'})...`}
        />
        {searching && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-amber-600 animate-pulse">Searching…</span>
        )}
      </div>

      {/* Search results */}
      {isSearching && (
        <>
          {results.length === 0 && !searching && (
            <div className="text-center py-12 text-[var(--dxp-text-muted)]">
              <p className="text-lg">No stocks found for "{query}"</p>
              <p className="text-sm mt-1">Try a different symbol or company name</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((stock) => {
              const flag = COUNTRY_FLAGS[stock.exchange] ?? COUNTRY_FLAGS[stock.country] ?? '🌏';
              const added = watchlistAdded.has(stock.symbol);
              return (
                <Card key={stock.symbol} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{flag}</span>
                      <div>
                        <p className="text-sm font-bold text-[var(--dxp-text)] font-mono">{stock.symbol}</p>
                        <p className="text-xs text-[var(--dxp-text-muted)]">{stock.exchange} · {stock.type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddWatchlist(stock.symbol)}
                      disabled={added}
                      className={`text-xs px-2 py-1 rounded border font-semibold transition-colors ${
                        added
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                          : 'bg-[var(--dxp-surface)] text-amber-600 border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      {added ? '✓ Watching' : '+ Watchlist'}
                    </button>
                  </div>
                  <p className="text-sm text-[var(--dxp-text)] mb-1">{stock.name}</p>
                  <p className="text-xs text-[var(--dxp-text-muted)]">{stock.currency}</p>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Popular APAC stocks with live prices */}
      {!isSearching && (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-3">Popular in {region.name} · Live Prices</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(popularQuotes ?? []).map((stock) => {
              const flag = COUNTRY_FLAGS[stock.exchange] ?? '🌏';
              const isPos = stock.changePercent >= 0;
              const added = watchlistAdded.has(stock.symbol);
              return (
                <Card key={stock.symbol} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{flag}</span>
                      <div>
                        <p className="text-sm font-bold text-[var(--dxp-text)] font-mono">{stock.symbol}</p>
                        <p className="text-xs text-[var(--dxp-text-muted)]">{stock.exchange}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddWatchlist(stock.symbol)}
                      disabled={added}
                      className={`text-xs px-2 py-1 rounded border font-semibold transition-colors ${
                        added
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                          : 'bg-[var(--dxp-surface)] text-amber-600 border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      {added ? '✓ Watching' : '+ Watchlist'}
                    </button>
                  </div>
                  <p className="text-sm text-[var(--dxp-text)] mb-2">{stock.name}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold font-mono text-[var(--dxp-text)]">
                      {stock.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-xs text-[var(--dxp-text-muted)] font-normal ml-1">{stock.currency}</span>
                    </p>
                    <span className={`text-sm font-bold ${isPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
