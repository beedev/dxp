import React from 'react';
import { useApacIndices } from '@dxp/sdk-react';
import { APAC_INDICES } from '../data/apac-markets';
import { useRegion } from '../contexts/RegionContext';

export function LiveTicker() {
  // Poll every 5 min — Alpha Vantage free tier is 25 req/day; 12 index calls per poll
  const { data: liveIndices } = useApacIndices({ refetchInterval: 5 * 60 * 1000 });
  const { region } = useRegion();
  const allIndices = liveIndices ?? APAC_INDICES;

  // Region-first: pulse symbols ordered first, then the rest for context
  const pulseSet = new Set(region.pulseIndices);
  const regionFirst = [
    ...region.pulseIndices
      .map((sym) => allIndices.find((idx) => idx.symbol === sym))
      .filter((idx): idx is NonNullable<typeof idx> => Boolean(idx)),
    ...allIndices.filter((idx) => !pulseSet.has(idx.symbol)),
  ];
  const items = [...regionFirst, ...regionFirst]; // duplicate for seamless loop

  return (
    <div className="bg-amber-700 text-white overflow-hidden relative h-9 flex items-center">
      <div style={{ animation: 'ticker 60s linear infinite', display: 'flex', whiteSpace: 'nowrap' }}>
        {items.map((idx, i) => (
          <span key={`${idx.symbol}-${i}`} className="inline-flex items-center gap-2 px-6 border-r border-amber-600">
            <span className="text-sm">{idx.flag}</span>
            <span className="text-xs font-semibold tracking-wide">{idx.name}</span>
            <span className="text-xs font-mono">{idx.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className={`text-xs font-bold ${idx.changePercent >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {idx.changePercent >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
