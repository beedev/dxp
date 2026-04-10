import React from 'react';
import { Card } from '@dxp/ui';
import { useApacIndices } from '@dxp/sdk-react';
import { APAC_INDICES, isMarketOpen } from '../../data/apac-markets';
import { LiveTicker } from '../../components/LiveTicker';
import { IndexCard } from '../../components/IndexCard';
import { useRegion } from '../../contexts/RegionContext';

export function MarketOverview() {
  const { region } = useRegion();
  const now = new Date();
  const utcTime = now.toUTCString().replace('GMT', 'UTC');

  const { data: liveIndices } = useApacIndices({ refetchInterval: 5 * 60 * 1000 });
  const indices = liveIndices ?? APAC_INDICES;

  const openCount = indices.filter((idx) => 'isMarketOpen' in idx ? idx.isMarketOpen : false).length;
  const closedCount = indices.length - openCount;

  const sortedByChange = [...indices].sort((a, b) => b.changePercent - a.changePercent);
  const best = sortedByChange[0];
  const worst = sortedByChange[sortedByChange.length - 1];
  const biggestMover = [...indices].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))[0];

  return (
    <div>
      <LiveTicker />

      <div className="mb-8 mt-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">{region.flag} {region.marketHeadline}</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">{utcTime}</p>
      </div>

      {/* Market session summary */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-[var(--dxp-border-light)] rounded-lg">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span className="text-sm font-semibold text-[var(--dxp-text)]">{openCount} Markets Open</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block"></span>
          <span className="text-sm font-semibold text-[var(--dxp-text-secondary)]">{closedCount} Closed</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[var(--dxp-text-muted)]">
            {new Set(indices.map((i) => i.exchange)).size} exchanges across {new Set(indices.map((i) => i.country)).size} countries
          </span>
        </div>
      </div>

      {/* Index grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {indices.map((idx) => (
          <IndexCard key={idx.symbol} index={idx} />
        ))}
      </div>

      {/* Today's Highlights */}
      <h2 className="text-xl font-bold text-[var(--dxp-text)] mb-4">Today's Highlights</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-emerald-400">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Best Performer</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{best.flag}</span>
            <p className="text-sm font-bold text-[var(--dxp-text)]">{best.name}</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">+{best.changePercent.toFixed(2)}%</p>
          <p className="text-xs text-[var(--dxp-text-muted)] mt-1">{best.exchange}</p>
        </Card>
        <Card className="p-5 border-l-4 border-rose-400">
          <p className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-1">Worst Performer</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{worst.flag}</span>
            <p className="text-sm font-bold text-[var(--dxp-text)]">{worst.name}</p>
          </div>
          <p className="text-2xl font-bold text-rose-600">{worst.changePercent.toFixed(2)}%</p>
          <p className="text-xs text-[var(--dxp-text-muted)] mt-1">{worst.exchange}</p>
        </Card>
        <Card className="p-5 border-l-4 border-amber-400">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Biggest Mover</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{biggestMover.flag}</span>
            <p className="text-sm font-bold text-[var(--dxp-text)]">{biggestMover.name}</p>
          </div>
          <p className={`text-2xl font-bold font-mono ${biggestMover.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {biggestMover.changePercent >= 0 ? '+' : ''}{biggestMover.changePercent.toFixed(2)}%
          </p>
          <p className="text-xs text-[var(--dxp-text-muted)] mt-1">{biggestMover.exchange} · Largest absolute move today</p>
        </Card>
      </div>
    </div>
  );
}
