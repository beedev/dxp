import React from 'react';
import { Card } from '@dxp/ui';
import { type CurrencyInfo } from '../data/apac-currencies';

interface FxWidgetProps {
  currency: CurrencyInfo;
}

export function FxWidget({ currency }: FxWidgetProps) {
  const isPositive = currency.changePct >= 0;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{currency.flag}</span>
        <div>
          <p className="text-sm font-bold text-[var(--dxp-text)]">{currency.code}</p>
          <p className="text-xs text-[var(--dxp-text-muted)]">{currency.country}</p>
        </div>
      </div>
      <p className="text-xs text-[var(--dxp-text-secondary)] mb-1">{currency.name}</p>
      <p className="text-lg font-bold font-mono text-[var(--dxp-text)]">
        {currency.rateVsUsd >= 1000
          ? currency.rateVsUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })
          : currency.rateVsUsd.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 4 })}
      </p>
      <p className="text-[10px] text-[var(--dxp-text-muted)]">per USD</p>
      <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
        <span>{isPositive ? '▲' : '▼'}</span>
        <span>{isPositive ? '+' : ''}{currency.changePct.toFixed(2)}%</span>
      </div>
    </Card>
  );
}
