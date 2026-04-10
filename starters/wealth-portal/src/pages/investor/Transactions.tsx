import React, { useState } from 'react';
import { Card, DataTable, FilterBar, Badge, type Column, type FilterOption } from '@dxp/ui';
import type { Transaction } from '../../data/mock-portfolio';
import { useRegion, useRegionMock, useRegionUser } from '../../contexts/RegionContext';

const EXCHANGE_FLAGS: Record<string, string> = {
  SGX: '🇸🇬', HKEX: '🇭🇰', TSE: '🇯🇵', ASX: '🇦🇺', NSE: '🇮🇳', BSE: '🇮🇳',
  NYSE: '🇺🇸', NASDAQ: '🇺🇸', LSE: '🇬🇧', KRX: '🇰🇷', SSE: '🇨🇳',
};

const TYPE_FILTER_OPTIONS: FilterOption[] = [
  { key: 'buy', label: 'Buy', value: 'buy' },
  { key: 'sell', label: 'Sell', value: 'sell' },
  { key: 'dividend', label: 'Dividend', value: 'dividend' },
];

export function Transactions() {
  const { region, formatCurrency } = useRegion();
  const user = useRegionUser();
  // Region mock is the source of truth (BFF has no multi-region transactions)
  const { transactions } = useRegionMock();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const columns: Column<Transaction>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (val) => (
        <span className="text-sm text-[var(--dxp-text)]">
          {new Date(val as string).toLocaleDateString(region.currency.locale, { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'symbol',
      header: 'Symbol',
      render: (val) => <span className="font-mono font-bold text-[var(--dxp-text)]">{val as string}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (val) => <span className="text-[var(--dxp-text)]">{val as string}</span>,
    },
    {
      key: 'exchange',
      header: 'Exchange',
      render: (val) => (
        <div className="flex items-center gap-1">
          <span>{EXCHANGE_FLAGS[val as string] ?? '🌏'}</span>
          <span className="text-xs text-[var(--dxp-text-secondary)]">{val as string}</span>
        </div>
      ),
    },
    {
      key: 'side',
      header: 'Type',
      render: (val) => {
        const side = val as string;
        const variantMap: Record<string, 'success' | 'danger' | 'warning'> = {
          buy: 'success',
          sell: 'danger',
          dividend: 'warning',
        };
        return (
          <Badge variant={variantMap[side] ?? 'default'}>{side.toUpperCase()}</Badge>
        );
      },
    },
    {
      key: 'qty',
      header: 'Qty',
      render: (val) => <span className="font-mono text-[var(--dxp-text)]">{(val as number).toLocaleString(region.currency.locale)}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      render: (val) => (
        <span className="font-mono text-[var(--dxp-text)]">
          {(val as number).toLocaleString(region.currency.locale, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </span>
      ),
    },
    {
      key: 'currency',
      header: 'Currency',
      render: (val) => <span className="text-xs text-[var(--dxp-text-secondary)]">{val as string}</span>,
    },
    {
      key: 'baseCurrencyAmount',
      header: `${region.currency.code} Amount`,
      render: (val) => (
        <span className="font-mono font-semibold text-[var(--dxp-text)]">
          {formatCurrency(val as number)}
        </span>
      ),
    },
    {
      key: 'fee',
      header: 'Fee',
      render: (val) => {
        const fee = val as number;
        return (
          <span className="font-mono text-[var(--dxp-text-muted)] text-xs">
            {fee > 0 ? fee.toFixed(2) : '—'}
          </span>
        );
      },
    },
  ];

  const toggleFilter = (key: string) => {
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSearch('');
  };

  const filtered = transactions.filter((t) => {
    const matchesType = activeFilters.length === 0 || activeFilters.includes(t.side);
    const matchesSearch =
      !search ||
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const totalInvested  = transactions.filter((t) => t.side === 'buy').reduce((s, t) => s + t.baseCurrencyAmount, 0);
  const totalDividends = transactions.filter((t) => t.side === 'dividend').reduce((s, t) => s + t.baseCurrencyAmount, 0);
  const totalFees      = transactions.reduce((s, t) => s + t.fee, 0);

  const byYear: Record<string, number> = {};
  transactions.filter((t) => t.side === 'dividend').forEach((t) => {
    const y = t.date.slice(0, 4);
    byYear[y] = (byYear[y] ?? 0) + t.baseCurrencyAmount;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Transaction History</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">{user.name} · All trades and income events · {region.currency.code} base {region.flag}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-[var(--dxp-text-muted)]">Total Invested</p>
          <p className="text-xl font-bold font-mono text-[var(--dxp-text)]">{formatCurrency(totalInvested)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--dxp-text-muted)]">Dividend Income</p>
          <p className="text-xl font-bold font-mono text-emerald-600">{formatCurrency(totalDividends)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--dxp-text-muted)]">Total Fees Paid</p>
          <p className="text-xl font-bold font-mono text-[var(--dxp-text)]">{formatCurrency(totalFees)}</p>
        </Card>
      </div>

      <div className="mb-4">
        <FilterBar
          filters={TYPE_FILTER_OPTIONS}
          activeFilters={activeFilters}
          onToggle={toggleFilter}
          onClear={clearFilters}
          searchPlaceholder="Search symbol or name..."
          searchValue={search}
          onSearchChange={setSearch}
        />
      </div>

      <div className="mb-8">
        <DataTable<Transaction>
          columns={columns}
          data={sorted}
          emptyMessage="No transactions found"
        />
      </div>

      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-4">Dividend Income by Year</h2>
      <div className="flex gap-4">
        {Object.entries(byYear).sort().map(([yr, amt]) => (
          <Card key={yr} className="p-4 min-w-[120px]">
            <p className="text-xs text-[var(--dxp-text-muted)]">{yr}</p>
            <p className="text-lg font-bold font-mono text-emerald-600">{formatCurrency(amt)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
