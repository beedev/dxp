import React from 'react';
import type { PriceBar } from '@dxp/contracts';

interface PriceChartProps {
  symbol: string;
  range: string;
  color?: string;
  height?: number;
  data?: PriceBar[];   // live OHLCV from BFF — falls back to seeded mock when absent
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateMockPrices(symbol: string, range: string, basePrice: number): { date: string; price: number }[] {
  const rangeMap: Record<string, number> = {
    '1M': 22, '3M': 65, '6M': 130, '1Y': 252,
  };
  const days = rangeMap[range] ?? 22;
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRandom(seed);
  const prices: { date: string; price: number }[] = [];
  let price = basePrice * 0.85;

  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    price = price * (1 + (rand() - 0.48) * 0.02);
    prices.push({ date: date.toISOString().slice(0, 10), price: Math.max(price, basePrice * 0.5) });
  }
  prices[prices.length - 1].price = basePrice;
  return prices;
}

const BASE_PRICE_MAP: Record<string, number> = {
  'D05.SI': 38.45, '0700.HK': 425.60, '7203.T': 3124, 'BHP.AX': 49.50,
  'HDFCBANK.NS': 1965, '9988.HK': 97.40, 'M44U.SI': 1.58, '9984.T': 9280,
};

export function PriceChart({ symbol, range, height = 180, data }: PriceChartProps) {
  // Use live data if provided, otherwise fall back to seeded mock
  const chartPoints: { date: string; price: number }[] = data && data.length > 0
    ? data.map((bar) => ({ date: bar.date, price: bar.close }))
    : generateMockPrices(symbol, range, BASE_PRICE_MAP[symbol] ?? 100);

  const prices = chartPoints.map((d) => d.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const priceRange = maxP - minP || 1;

  const w = 600;
  const h = height;
  const pad = { top: 16, right: 16, bottom: 24, left: 0 };

  const points = chartPoints.map((d, i) => {
    const x = pad.left + (i / (chartPoints.length - 1)) * (w - pad.left - pad.right);
    const y = pad.top + ((maxP - d.price) / priceRange) * (h - pad.top - pad.bottom);
    return `${x},${y}`;
  });

  const isUp = chartPoints[chartPoints.length - 1].price >= chartPoints[0].price;
  const lineColor = isUp ? '#059669' : '#E11D48';
  const fillColor = isUp ? 'rgba(5,150,105,0.08)' : 'rgba(225,29,72,0.08)';

  const lastX = pad.left + (w - pad.left - pad.right);
  const firstX = pad.left;
  const bottomY = h - pad.bottom;
  const areaPoints = `${firstX},${bottomY} ${points.join(' ')} ${lastX},${bottomY}`;

  const formatPrice = (p: number) =>
    p >= 1000 ? p.toLocaleString('en-US', { maximumFractionDigits: 0 }) : p.toFixed(2);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
        <polygon points={areaPoints} fill={fillColor} />
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <text x={w - pad.right} y={pad.top + 4} textAnchor="end" fontSize="9" fill={lineColor} opacity="0.8">
          {formatPrice(maxP)}
        </text>
        <text x={w - pad.right} y={pad.top + ((maxP - minP) / priceRange) * (h - pad.top - pad.bottom) - 4} textAnchor="end" fontSize="9" fill={lineColor} opacity="0.8">
          {formatPrice(minP)}
        </text>
      </svg>
    </div>
  );
}
