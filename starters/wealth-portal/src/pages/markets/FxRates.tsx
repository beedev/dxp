import React, { useState } from 'react';
import { Card, DataTable, Input, Select, type Column } from '@dxp/ui';
import { useFxRates, useSgdRates } from '@dxp/sdk-react';
import { APAC_CURRENCIES } from '../../data/apac-currencies';
import { FxWidget } from '../../components/FxWidget';
import { useRegion } from '../../contexts/RegionContext';

interface SgdRateRow {
  pair: string;
  buy: number;
  sell: number;
  mid: number;
}

export function FxRates() {
  const { region } = useRegion();
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState(region.fxBaseCurrency);
  const [amount, setAmount] = useState<number>(1000);

  // Live FX rates (USD base)
  const { data: fxSnapshot } = useFxRates('USD', { refetchInterval: 15 * 60 * 1000 });
  const { data: sgdRates } = useSgdRates({ refetchInterval: 15 * 60 * 1000 });

  // Build live currency list from rates snapshot
  const liveRates = fxSnapshot?.rates ?? {};

  // Merge live rates into APAC_CURRENCIES for FxWidget display
  const liveCurrencies = APAC_CURRENCIES.map((c) => {
    const rateVsUsd = liveRates[c.code] ?? c.rateVsUsd;
    return { ...c, rateVsUsd };
  });

  const allCurrencies = [
    { code: 'USD', name: 'US Dollar', rateVsUsd: 1 },
    ...liveCurrencies,
  ];

  const fromRate = liveRates[fromCurrency] ?? allCurrencies.find((c) => c.code === fromCurrency)?.rateVsUsd ?? 1;
  const toRate = liveRates[toCurrency] ?? allCurrencies.find((c) => c.code === toCurrency)?.rateVsUsd ?? 1;
  const converted = (amount / fromRate) * toRate;
  const rate = toRate / fromRate;

  const formatRate = (r: number) => {
    if (r < 0.001) return r.toFixed(8);
    if (r < 1) return r.toFixed(4);
    return r.toFixed(4);
  };

  const baseCcy = region.fxBaseCurrency;
  const referencePairs = region.fxReferencePairs;

  // Build reference-rate rows — prefer live data, fall back to computed
  const sgdRateRows: SgdRateRow[] = sgdRates
    ? sgdRates
        .filter((r) => referencePairs.some((p) => p.from === r.currency))
        .map((r) => {
          const mid = (r.buyRate + r.sellRate) / 2;
          return { pair: `${r.currency}/${baseCcy}`, buy: r.buyRate, sell: r.sellRate, mid };
        })
    : referencePairs.map((r) => {
        const usdToFrom = liveRates[r.from] ?? 1;
        const usdToBase = liveRates[baseCcy] ?? 1;
        const mid = usdToBase / usdToFrom;
        return { pair: r.pair, buy: mid * 0.9995, sell: mid * 1.0005, mid };
      });

  const sgdColumns: Column<SgdRateRow>[] = [
    {
      key: 'pair',
      header: 'Pair',
      render: (value) => (
        <span className="font-semibold text-[var(--dxp-text)]">{value as string}</span>
      ),
    },
    {
      key: 'buy',
      header: 'Buy',
      render: (value) => (
        <span className="font-mono text-[var(--dxp-text)]">{(value as number).toFixed(4)}</span>
      ),
    },
    {
      key: 'sell',
      header: 'Sell',
      render: (value) => (
        <span className="font-mono text-[var(--dxp-text)]">{(value as number).toFixed(4)}</span>
      ),
    },
    {
      key: 'mid',
      header: 'Mid',
      render: (value) => (
        <span className="font-mono text-emerald-700">{(value as number).toFixed(4)}</span>
      ),
    },
  ];

  const currencyOptions = allCurrencies.map((c) => ({ value: c.code, label: c.code }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">{region.flag} {region.name} Foreign Exchange</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">
          Live rates · All rates vs USD
          {fxSnapshot?.timestamp && (
            <span className="ml-2 text-xs text-[var(--dxp-text-muted)]">
              Updated {new Date(fxSnapshot.timestamp).toLocaleTimeString()}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {liveCurrencies.map((c) => (
          <FxWidget key={c.code} currency={c} />
        ))}
      </div>

      {/* Currency Converter */}
      <h2 className="text-xl font-bold text-[var(--dxp-text)] mb-4">Currency Converter</h2>
      <Card className="p-6 mb-8 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <Select
            options={currencyOptions}
            value={fromCurrency}
            onChange={setFromCurrency}
            label="From"
          />
          <Select
            options={currencyOptions}
            value={toCurrency}
            onChange={setToCurrency}
            label="To"
          />
          <Input
            type="number"
            value={String(amount)}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Amount"
          />
        </div>
        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-[var(--dxp-text-muted)] mb-1">Converted Amount</p>
          <p className="text-2xl font-bold font-mono text-[var(--dxp-text)]">
            {toCurrency} {converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </p>
          <p className="text-xs text-[var(--dxp-text-secondary)] mt-1">
            1 {fromCurrency} = {toCurrency} {formatRate(rate)}
          </p>
        </div>
      </Card>

      {/* Reference rates for active region base currency */}
      <h2 className="text-xl font-bold text-[var(--dxp-text)] mb-4">{baseCcy} Reference Rates</h2>
      <div className="max-w-2xl">
        <DataTable
          columns={sgdColumns}
          data={sgdRateRows}
          emptyMessage={`No ${baseCcy} rates available`}
        />
      </div>
    </div>
  );
}
