import React, { useState } from 'react';
import { Card, DataTable, FilterBar, Select, Input, type Column, type FilterOption } from '@dxp/ui';
import { useRegion } from '../../contexts/RegionContext';

interface ScreenerStock {
  symbol: string;
  name: string;
  exchange: string;
  flag: string;
  sector: string;
  price: number;
  currency: string;
  changePct: number;
  pe: number;
  dividendYield: number;
  marketCap: number; // in USD billions
}

const SCREENER_STOCKS: ScreenerStock[] = [
  { symbol: 'D05.SI', name: 'DBS Group Holdings', exchange: 'SGX', flag: '🇸🇬', sector: 'Financials', price: 38.45, currency: 'SGD', changePct: 0.54, pe: 9.2, dividendYield: 5.8, marketCap: 96.4 },
  { symbol: 'O39.SI', name: 'OCBC Bank', exchange: 'SGX', flag: '🇸🇬', sector: 'Financials', price: 14.82, currency: 'SGD', changePct: 0.82, pe: 8.7, dividendYield: 6.2, marketCap: 52.8 },
  { symbol: 'U11.SI', name: 'United Overseas Bank', exchange: 'SGX', flag: '🇸🇬', sector: 'Financials', price: 33.20, currency: 'SGD', changePct: -0.21, pe: 8.9, dividendYield: 6.0, marketCap: 54.1 },
  { symbol: '0700.HK', name: 'Tencent Holdings', exchange: 'HKEX', flag: '🇭🇰', sector: 'Technology', price: 425.60, currency: 'HKD', changePct: 1.23, pe: 22.4, dividendYield: 0.4, marketCap: 416.2 },
  { symbol: '9988.HK', name: 'Alibaba Group', exchange: 'HKEX', flag: '🇭🇰', sector: 'Technology', price: 97.40, currency: 'HKD', changePct: 2.15, pe: 14.6, dividendYield: 0, marketCap: 198.3 },
  { symbol: '1299.HK', name: 'AIA Group', exchange: 'HKEX', flag: '🇭🇰', sector: 'Financials', price: 68.45, currency: 'HKD', changePct: -0.80, pe: 17.2, dividendYield: 2.8, marketCap: 78.4 },
  { symbol: '7203.T', name: 'Toyota Motor Corp', exchange: 'TSE', flag: '🇯🇵', sector: 'Consumer Disc.', price: 3124, currency: 'JPY', changePct: 0.43, pe: 12.1, dividendYield: 2.8, marketCap: 292.1 },
  { symbol: '6758.T', name: 'Sony Group Corp', exchange: 'TSE', flag: '🇯🇵', sector: 'Technology', price: 12450, currency: 'JPY', changePct: 1.92, pe: 19.8, dividendYield: 0.7, marketCap: 148.2 },
  { symbol: '9984.T', name: 'SoftBank Group Corp', exchange: 'TSE', flag: '🇯🇵', sector: 'Technology', price: 9280, currency: 'JPY', changePct: 0.94, pe: 28.3, dividendYield: 0.5, marketCap: 139.7 },
  { symbol: 'BHP.AX', name: 'BHP Group Ltd', exchange: 'ASX', flag: '🇦🇺', sector: 'Materials', price: 49.50, currency: 'AUD', changePct: 0.23, pe: 11.4, dividendYield: 4.2, marketCap: 142.8 },
  { symbol: 'CBA.AX', name: 'Commonwealth Bank', exchange: 'ASX', flag: '🇦🇺', sector: 'Financials', price: 138.50, currency: 'AUD', changePct: -0.86, pe: 21.3, dividendYield: 3.8, marketCap: 178.2 },
  { symbol: 'RIO.AX', name: 'Rio Tinto Group', exchange: 'ASX', flag: '🇦🇺', sector: 'Materials', price: 124.30, currency: 'AUD', changePct: 0.68, pe: 9.8, dividendYield: 5.4, marketCap: 102.4 },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', exchange: 'NSE', flag: '🇮🇳', sector: 'Financials', price: 1965, currency: 'INR', changePct: -0.38, pe: 18.4, dividendYield: 1.2, marketCap: 148.3 },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', flag: '🇮🇳', sector: 'Technology', price: 3820, currency: 'INR', changePct: 0.56, pe: 26.7, dividendYield: 1.8, marketCap: 138.4 },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'BSE', flag: '🇮🇳', sector: 'Energy', price: 2945, currency: 'INR', changePct: -0.24, pe: 21.2, dividendYield: 0.4, marketCap: 198.7 },
  { symbol: 'Z74.SI', name: 'Singtel', exchange: 'SGX', flag: '🇸🇬', sector: 'Technology', price: 2.84, currency: 'SGD', changePct: 2.16, pe: 18.3, dividendYield: 4.8, marketCap: 46.2 },
  { symbol: 'M44U.SI', name: 'Mapletree Logistics Trust', exchange: 'SGX', flag: '🇸🇬', sector: 'REITs', price: 1.58, currency: 'SGD', changePct: -0.63, pe: 14.2, dividendYield: 6.8, marketCap: 4.8 },
  { symbol: 'A17U.SI', name: 'CapitaLand Ascendas REIT', exchange: 'SGX', flag: '🇸🇬', sector: 'REITs', price: 2.89, currency: 'SGD', changePct: 0.35, pe: 18.4, dividendYield: 5.9, marketCap: 12.4 },
  { symbol: '000001.SS', name: 'SAIC Motor Corp', exchange: 'SSE', flag: '🇨🇳', sector: 'Consumer Disc.', price: 13.45, currency: 'CNY', changePct: -1.24, pe: 8.4, dividendYield: 7.2, marketCap: 14.2 },
  { symbol: '005930.KS', name: 'Samsung Electronics', exchange: 'KRX', flag: '🇰🇷', sector: 'Technology', price: 78400, currency: 'KRW', changePct: 0.78, pe: 21.4, dividendYield: 2.2, marketCap: 421.8 },
];

type SortKey = 'symbol' | 'changePct' | 'pe' | 'dividendYield' | 'marketCap';

export function Screener() {
  const { region } = useRegion();
  const [activeExchanges, setActiveExchanges] = useState<string[]>(region.defaultExchanges);
  const [sector, setSector] = useState('All');
  const [minDivYield, setMinDivYield] = useState(0);

  const allExchanges = region.allExchanges;
  const allSectors = ['All', ...Array.from(new Set(SCREENER_STOCKS.map((s) => s.sector)))];

  const toggleExchange = (key: string) => {
    setActiveExchanges((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
    );
  };

  const exchangeFilters: FilterOption[] = allExchanges.map((ex) => ({
    key: ex,
    label: ex,
    value: ex,
  }));

  const sectorOptions = allSectors.map((s) => ({ value: s, label: s }));

  const filtered = SCREENER_STOCKS.filter((s) => {
    const matchEx = activeExchanges.length === 0 || activeExchanges.includes(s.exchange);
    const matchSector = sector === 'All' || s.sector === sector;
    const matchDiv = s.dividendYield >= minDivYield;
    return matchEx && matchSector && matchDiv;
  });

  const columns: Column<ScreenerStock>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      sortable: true,
      render: (_value, row) => (
        <div>
          <div className="flex items-center gap-1">
            <span>{row.flag}</span>
            <span className="font-mono font-bold text-[var(--dxp-text)]">{row.symbol}</span>
          </div>
          <p className="text-[10px] text-[var(--dxp-text-muted)]">{row.exchange}</p>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
    },
    {
      key: 'sector',
      header: 'Sector',
      render: (value) => (
        <span className="text-xs bg-[var(--dxp-border-light)] text-[var(--dxp-text-secondary)] px-2 py-0.5 rounded-full">
          {value as string}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (value, row) => (
        <span className="font-mono text-[var(--dxp-text)]">
          {(value as number).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          <span className="text-[10px] text-[var(--dxp-text-muted)]">{row.currency}</span>
        </span>
      ),
    },
    {
      key: 'changePct',
      header: 'Change %',
      sortable: true,
      render: (value) => {
        const v = value as number;
        return (
          <span className={`font-semibold ${v >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {v >= 0 ? '+' : ''}{v.toFixed(2)}%
          </span>
        );
      },
    },
    {
      key: 'pe',
      header: 'P/E',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-[var(--dxp-text)]">{(value as number).toFixed(1)}x</span>
      ),
    },
    {
      key: 'dividendYield',
      header: 'Div %',
      sortable: true,
      render: (value) => {
        const v = value as number;
        const cls = v >= 5 ? 'text-emerald-600' : v >= 2 ? 'text-amber-600' : 'text-[var(--dxp-text-muted)]';
        return (
          <span className={`font-semibold ${cls}`}>
            {v > 0 ? `${v.toFixed(1)}%` : '—'}
          </span>
        );
      },
    },
    {
      key: 'marketCap',
      header: 'Mkt Cap $B',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-[var(--dxp-text)]">${(value as number).toFixed(1)}B</span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Stock Screener</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Filter APAC equities by exchange, sector, and fundamentals</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <FilterBar
          filters={exchangeFilters}
          activeFilters={activeExchanges}
          onToggle={toggleExchange}
          onClear={() => setActiveExchanges([])}
        />
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            options={sectorOptions}
            value={sector}
            onChange={setSector}
            label="Sector"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--dxp-text-muted)] mb-1">Min Div Yield %</p>
            <Input
              type="number"
              value={String(minDivYield)}
              onChange={(e) => setMinDivYield(Number(e.target.value))}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-[var(--dxp-text-muted)] mb-3">{filtered.length} stocks match your criteria</p>

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No stocks match your criteria"
      />
    </div>
  );
}
