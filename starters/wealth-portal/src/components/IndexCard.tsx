import React from 'react';
import { Card } from '@dxp/ui';
import { type ApacIndex as StaticIndex, isMarketOpen } from '../data/apac-markets';
import type { ApacIndex as LiveIndex } from '@dxp/contracts';

type AnyIndex = StaticIndex | LiveIndex;

interface IndexCardProps {
  index: AnyIndex;
}

export function IndexCard({ index }: IndexCardProps) {
  const open = 'isMarketOpen' in index
    ? index.isMarketOpen
    : isMarketOpen((index as StaticIndex).open, (index as StaticIndex).close);
  const isPositive = index.changePercent >= 0;

  return (
    <Card className={`p-4 ${open ? 'border-amber-400 border-2' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{index.flag}</span>
          <div>
            <p className="text-xs font-bold text-[var(--dxp-text-secondary)] uppercase tracking-wide">{index.exchange}</p>
            <p className="text-xs text-[var(--dxp-text-muted)]">{index.country}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${open ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {open ? 'OPEN' : 'CLOSED'}
        </span>
      </div>
      <p className="text-sm font-semibold text-[var(--dxp-text)] mb-2 leading-tight">{index.name}</p>
      <p className="text-xl font-bold font-mono text-[var(--dxp-text)]">
        {index.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <div className={`flex items-center gap-2 mt-1 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
        <span className="text-sm font-bold">
          {isPositive ? '+' : ''}{index.change.toFixed(2)}
        </span>
        <span className="text-sm font-bold">
          ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)
        </span>
      </div>
    </Card>
  );
}
