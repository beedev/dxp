import React, { useState } from 'react';
import { Card, Input } from '@dxp/ui';
import { useApacNews } from '@dxp/sdk-react';
import { useRegion, useRegionMock } from '../../contexts/RegionContext';

const COUNTRY_FLAGS: Record<string, string> = { SG: '🇸🇬', HK: '🇭🇰', JP: '🇯🇵', AU: '🇦🇺', IN: '🇮🇳', CN: '🇨🇳', KR: '🇰🇷' };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SENTIMENT_STYLES: Record<string, string> = {
  positive: 'bg-emerald-100 text-emerald-700',
  negative: 'bg-rose-100 text-rose-700',
  neutral: 'bg-gray-100 text-gray-600',
};

const SECTORS = [
  'All',
  'Technology',
  'Financials',
  'Energy',
  'Materials',
  'Healthcare',
  'Consumer Discretionary',
  'Consumer Staples',
  'REITs',
  'Industrials',
  'Macro / FX',
];

const PAGE_SIZE = 6;

export function News() {
  const { region } = useRegion();
  const { news: regionNews } = useRegionMock();

  // Search is free text; country filter is what the region binds to
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState(region.newsDefaultCountry);
  const [sentimentFilter, setSentimentFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [symbolInput, setSymbolInput] = useState('');
  const [activeSymbol, setActiveSymbol] = useState('');
  const [page, setPage] = useState(1);

  // If the user switches region, reset the country filter to that region
  React.useEffect(() => {
    setCountryFilter(region.newsDefaultCountry);
    setPage(1);
  }, [region.id, region.newsDefaultCountry]);

  const countries = region.newsCountries;
  const sentiments = ['All', 'Positive', 'Negative', 'Neutral'];

  const handleFilterChange = () => setPage(1);

  const handleSymbolSearch = () => {
    setActiveSymbol(symbolInput.trim().toUpperCase());
    handleFilterChange();
  };

  const handleSymbolClear = () => {
    setSymbolInput('');
    setActiveSymbol('');
    handleFilterChange();
  };

  // Fetch from BFF — symbol takes priority over sector/country filters
  const { data: liveArticles, isLoading, dataUpdatedAt } = useApacNews({
    symbol: activeSymbol || undefined,
    country: !activeSymbol && countryFilter !== 'All' ? countryFilter : undefined,
    sector: !activeSymbol && sectorFilter !== 'All' ? sectorFilter : undefined,
    pageSize: 50,
    refetchInterval: 15 * 60 * 1000,
  });

  const source = liveArticles && liveArticles.length > 0 ? liveArticles : regionNews;
  const isLive = liveArticles && liveArticles.length > 0;

  // Local filtering: sentiment + text search + country tag (for mock fallback)
  const filtered = source.filter((n) => {
    const matchSearch = search === ''
      || n.title.toLowerCase().includes(search.toLowerCase())
      || n.summary.toLowerCase().includes(search.toLowerCase());
    const matchSentiment = sentimentFilter === 'All'
      || n.sentiment === sentimentFilter.toLowerCase();
    const matchCountry = countryFilter === 'All'
      || (n as any).country === countryFilter
      || !(n as any).country;
    return matchSearch && matchSentiment && matchCountry;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Active filter summary for the status line
  const activeFilters = [
    activeSymbol && `Symbol: ${activeSymbol}`,
    !activeSymbol && sectorFilter !== 'All' && `Sector: ${sectorFilter}`,
    !activeSymbol && countryFilter !== 'All' && `Country: ${countryFilter}`,
    sentimentFilter !== 'All' && `Sentiment: ${sentimentFilter}`,
  ].filter(Boolean).join(' · ');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">{region.flag} {region.name} Market News</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">
          {isLive ? 'Live news · auto-refreshes every 10 min' : 'Financial news from across the Asia-Pacific region'}
          {isLoading && <span className="ml-2 text-xs text-amber-600 animate-pulse">Refreshing…</span>}
          {isLive && dataUpdatedAt > 0 && !isLoading && (
            <span className="ml-2 text-xs text-[var(--dxp-text-muted)]">
              Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
            </span>
          )}
          {activeFilters && (
            <span className="ml-2 text-xs text-amber-700 font-medium">{activeFilters}</span>
          )}
        </p>
      </div>

      {/* Filter bar — row 1: symbol + text search */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex gap-2 flex-1 min-w-64">
          <Input
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSymbolSearch()}
            placeholder="Symbol (e.g. BABA, INFY, TM)…"
          />
          <button
            onClick={handleSymbolSearch}
            disabled={!symbolInput.trim()}
            className="px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-amber-700 transition-colors"
          >
            Search
          </button>
          {activeSymbol && (
            <button
              onClick={handleSymbolClear}
              className="px-3 py-2 rounded-lg border border-[var(--dxp-border)] text-sm text-[var(--dxp-text-muted)] hover:bg-[var(--dxp-border-light)] transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
          placeholder="Search headlines…"
        />
      </div>

      {/* Filter bar — row 2: dropdowns */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={sectorFilter}
          onChange={(e) => { setSectorFilter(e.target.value); handleFilterChange(); }}
          disabled={!!activeSymbol}
          className="px-3 py-2 rounded-lg border border-[var(--dxp-border)] bg-[var(--dxp-surface)] text-sm text-[var(--dxp-text)] focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-40"
        >
          {SECTORS.map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All Sectors' : s}</option>
          ))}
        </select>
        <select
          value={countryFilter}
          onChange={(e) => { setCountryFilter(e.target.value); handleFilterChange(); }}
          disabled={!!activeSymbol}
          className="px-3 py-2 rounded-lg border border-[var(--dxp-border)] bg-[var(--dxp-surface)] text-sm text-[var(--dxp-text)] focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-40"
        >
          {countries.map((c) => <option key={c} value={c}>{c === 'All' ? 'All Countries' : `${COUNTRY_FLAGS[c] ?? ''} ${c}`}</option>)}
        </select>
        <select
          value={sentimentFilter}
          onChange={(e) => { setSentimentFilter(e.target.value); handleFilterChange(); }}
          className="px-3 py-2 rounded-lg border border-[var(--dxp-border)] bg-[var(--dxp-surface)] text-sm text-[var(--dxp-text)] focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {sentiments.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Sentiment' : s}</option>)}
        </select>
        {(activeSymbol || sectorFilter !== 'All' || countryFilter !== 'All' || sentimentFilter !== 'All' || search) && (
          <button
            onClick={() => {
              setSearch(''); setCountryFilter('All'); setSentimentFilter('All');
              setSectorFilter('All'); setSymbolInput(''); setActiveSymbol('');
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-[var(--dxp-border)] text-sm text-[var(--dxp-text-muted)] hover:bg-[var(--dxp-border-light)] transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {paged.map((n) => (
          <Card key={n.id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{COUNTRY_FLAGS[(n as any).country ?? ''] ?? '🌏'}</span>
              <span className="text-xs text-[var(--dxp-text-muted)]">{n.source}</span>
              <span className="text-xs text-[var(--dxp-text-muted)]">·</span>
              <span className="text-xs text-[var(--dxp-text-muted)]">{timeAgo(n.publishedAt)}</span>
              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${SENTIMENT_STYLES[n.sentiment]}`}>
                {n.sentiment}
              </span>
            </div>
            <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-2 leading-snug">
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-700 hover:underline cursor-pointer"
              >
                {n.title}
              </a>
            </h3>
            <p className="text-xs text-[var(--dxp-text-secondary)] leading-relaxed mb-3">{n.summary}</p>
            {n.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {n.tags.map((tag) => (
                  <span key={tag} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">{tag}</span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-12 text-[var(--dxp-text-muted)]">
          <p>No articles match your filters.</p>
          {activeSymbol && <p className="text-sm mt-1">Try a different symbol or clear the filter.</p>}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded border border-[var(--dxp-border)] text-sm disabled:opacity-40 hover:bg-[var(--dxp-border-light)]"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1.5 rounded border text-sm ${p === page ? 'bg-amber-600 text-white border-amber-600' : 'border-[var(--dxp-border)] hover:bg-[var(--dxp-border-light)]'}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded border border-[var(--dxp-border)] text-sm disabled:opacity-40 hover:bg-[var(--dxp-border-light)]"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
