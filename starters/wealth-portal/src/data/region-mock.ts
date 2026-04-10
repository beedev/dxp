// ─────────────────────────────────────────────────────────────────────────────
// Region-Scoped Mock Data
//
// Complete, parallel datasets per region. Every investor/advisor/market page
// reads from REGION_MOCK[regionId] via `useRegionMock()`. Adding a new geo
// (US, UK, AU…) requires a new entry here and in src/config/regions.ts —
// zero page edits.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Holding,
  NewsItem,
  Transaction,
  Goal,
  PaperOrder,
  Alert,
  WatchlistItem,
  AdvisorClient,
} from './mock-portfolio';
import type { RegionId } from '../config/regions';

// ─────────────────────────────────────────────────────────────────────────────
// Shared supporting types (same shape for every region)
// ─────────────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  date: string;
  company: string;
  symbol: string;
  flag: string;
  exchange: string;
  type: 'Earnings' | 'Ex-Dividend' | 'Results';
  note?: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPct: number;
  fxPnl: number;
  cashBalance: number;
  baseCurrency: string;
  dayChange: number;
  dayChangePct: number;
  byCountry: { country: string; value: number; pct: number }[];
  bySector:  { sector: string;  value: number; pct: number }[];
  byCurrency:{ currency: string; value: number; pct: number }[];
}

export interface RetirementBalances {
  oa: number;
  sa: number;
  ma: number;
  ra: number;
}

export interface AllocationTarget {
  country: string;
  flag: string;
  target: number;  // pct
  current: number; // pct
}

export interface YtdPerformancePoint {
  month: string;
  portfolio: number;
  benchmark: number;
}

export interface User {
  name: string;
  initials: string;
  age: number;
  targetRetirementAge: number;
  occupation: string;
  location: string;
  /** One-line profile subtitle shown in page headers */
  profileLine: string;
  riskProfile: string;
  /** Net monthly income in base currency — used for retirement projections */
  monthlyIncome: number;
  /** Tax residency country code matching news/macro country code */
  taxResidency: string;
}

export interface RegionMock {
  user: User;
  holdings: Holding[];
  events: CalendarEvent[];
  news: NewsItem[];
  portfolioSummary: PortfolioSummary;
  transactions: Transaction[];
  paperOrders: PaperOrder[];
  goals: Goal[];
  alerts: Alert[];
  watchlist: WatchlistItem[];
  retirementBalances: RetirementBalances;
  advisorClients: AdvisorClient[];
  allocationTargets: AllocationTarget[];
  ytdPerformance: YtdPerformancePoint[];
}

// ═════════════════════════════════════════════════════════════════════════════
// 🇸🇬 SINGAPORE
// ═════════════════════════════════════════════════════════════════════════════

const SG_USER: User = {
  name: 'Wei Liang Tan',
  initials: 'WLT',
  age: 32,
  targetRetirementAge: 60,
  occupation: 'Product Manager · Tech',
  location: 'Singapore',
  profileLine: 'Wei Liang Tan · 32 · Singapore · Moderate Growth',
  riskProfile: 'Moderate Growth',
  monthlyIncome: 12000, // SGD
  taxResidency: 'SG',
};

const SG_HOLDINGS: Holding[] = [
  { id: 'sgh1', symbol: 'D05.SI', name: 'DBS Group Holdings', exchange: 'SGX', currency: 'SGD', qty: 500, avgCost: 32.40, currentPrice: 38.45, localValue: 19225, localPnl: 3025, localPnlPct: 18.67, baseCurrencyValue: 19225, baseCurrencyPnl: 3025, fxPnl: 0, totalPnlPct: 18.67, sector: 'Financials', country: 'Singapore', withholdingTaxRate: 0, dividendYield: 5.8 },
  { id: 'sgh2', symbol: '0700.HK', name: 'Tencent Holdings', exchange: 'HKEX', currency: 'HKD', qty: 200, avgCost: 315, currentPrice: 425.60, localValue: 85120, localPnl: 22120, localPnlPct: 35.11, baseCurrencyValue: 14641, baseCurrencyPnl: 3804, fxPnl: -180, totalPnlPct: 33.2, sector: 'Technology', country: 'Hong Kong', withholdingTaxRate: 0, dividendYield: 0.4 },
  { id: 'sgh3', symbol: '7203.T', name: 'Toyota Motor Corp', exchange: 'TSE', currency: 'JPY', qty: 100, avgCost: 2850, currentPrice: 3124, localValue: 312400, localPnl: 27400, localPnlPct: 9.61, baseCurrencyValue: 2812, baseCurrencyPnl: 246, fxPnl: -120, totalPnlPct: 7.85, sector: 'Consumer Discretionary', country: 'Japan', withholdingTaxRate: 15.315, dividendYield: 2.8 },
  { id: 'sgh4', symbol: 'BHP.AX', name: 'BHP Group Ltd', exchange: 'ASX', currency: 'AUD', qty: 300, avgCost: 43.20, currentPrice: 49.50, localValue: 14850, localPnl: 1890, localPnlPct: 14.58, baseCurrencyValue: 12920, baseCurrencyPnl: 1645, fxPnl: -210, totalPnlPct: 12.34, sector: 'Materials', country: 'Australia', withholdingTaxRate: 15, dividendYield: 4.2 },
  { id: 'sgh5', symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', exchange: 'NSE', currency: 'INR', qty: 100, avgCost: 1720, currentPrice: 1965, localValue: 196500, localPnl: 24500, localPnlPct: 14.24, baseCurrencyValue: 3144, baseCurrencyPnl: 392, fxPnl: -45, totalPnlPct: 11.6, sector: 'Financials', country: 'India', withholdingTaxRate: 20, dividendYield: 1.2 },
  { id: 'sgh6', symbol: '9988.HK', name: 'Alibaba Group', exchange: 'HKEX', currency: 'HKD', qty: 150, avgCost: 79.20, currentPrice: 97.40, localValue: 14610, localPnl: 2730, localPnlPct: 22.98, baseCurrencyValue: 2513, baseCurrencyPnl: 470, fxPnl: -28, totalPnlPct: 21.4, sector: 'Technology', country: 'Hong Kong', withholdingTaxRate: 0, dividendYield: 0 },
  { id: 'sgh7', symbol: 'M44U.SI', name: 'Mapletree Logistics Trust', exchange: 'SGX', currency: 'SGD', qty: 5000, avgCost: 1.72, currentPrice: 1.58, localValue: 7900, localPnl: -700, localPnlPct: -8.14, baseCurrencyValue: 7900, baseCurrencyPnl: -700, fxPnl: 0, totalPnlPct: -8.14, sector: 'REITs', country: 'Singapore', withholdingTaxRate: 0, dividendYield: 6.8 },
  { id: 'sgh8', symbol: '9984.T', name: 'SoftBank Group Corp', exchange: 'TSE', currency: 'JPY', qty: 50, avgCost: 8450, currentPrice: 9280, localValue: 464000, localPnl: 41500, localPnlPct: 9.82, baseCurrencyValue: 4176, baseCurrencyPnl: 373, fxPnl: -89, totalPnlPct: 7.9, sector: 'Technology', country: 'Japan', withholdingTaxRate: 15.315, dividendYield: 0.5 },
];

const SG_PORTFOLIO_SUMMARY: PortfolioSummary = {
  totalValue: 67331,
  totalCost: 57490,
  totalPnl: 9841,
  totalPnlPct: 17.12,
  fxPnl: -672,
  cashBalance: 50000,
  baseCurrency: 'SGD',
  dayChange: 312.45,
  dayChangePct: 0.46,
  byCountry: [
    { country: 'Singapore',   value: 27125, pct: 40.3 },
    { country: 'Hong Kong',   value: 17154, pct: 25.5 },
    { country: 'Japan',       value: 6988,  pct: 10.4 },
    { country: 'Australia',   value: 12920, pct: 19.2 },
    { country: 'India',       value: 3144,  pct: 4.7  },
  ],
  bySector: [
    { sector: 'Financials',             value: 22369, pct: 33.2 },
    { sector: 'Technology',             value: 21330, pct: 31.7 },
    { sector: 'Materials',              value: 12920, pct: 19.2 },
    { sector: 'REITs',                  value: 7900,  pct: 11.7 },
    { sector: 'Consumer Discretionary', value: 2812,  pct: 4.2  },
  ],
  byCurrency: [
    { currency: 'SGD', value: 27125, pct: 40.3 },
    { currency: 'HKD', value: 17154, pct: 25.5 },
    { currency: 'AUD', value: 12920, pct: 19.2 },
    { currency: 'JPY', value: 6988,  pct: 10.4 },
    { currency: 'INR', value: 3144,  pct: 4.7  },
  ],
};

const SG_TRANSACTIONS: Transaction[] = [
  { id: 'sgt1',  symbol: 'D05.SI',      name: 'DBS Group',                 exchange: 'SGX',  side: 'buy',      qty: 500,  price: 32.40,   currency: 'SGD', fxRate: 1,      baseCurrencyAmount: 16200, fee: 12.50, date: '2024-06-15' },
  { id: 'sgt2',  symbol: '0700.HK',     name: 'Tencent',                   exchange: 'HKEX', side: 'buy',      qty: 200,  price: 315.00,  currency: 'HKD', fxRate: 0.171,  baseCurrencyAmount: 10773, fee: 18.50, date: '2024-07-22' },
  { id: 'sgt3',  symbol: 'BHP.AX',      name: 'BHP Group',                 exchange: 'ASX',  side: 'buy',      qty: 300,  price: 43.20,   currency: 'AUD', fxRate: 0.862,  baseCurrencyAmount: 11192, fee: 15.00, date: '2024-08-10' },
  { id: 'sgt4',  symbol: 'D05.SI',      name: 'DBS Group',                 exchange: 'SGX',  side: 'dividend', qty: 500,  price: 1.92,    currency: 'SGD', fxRate: 1,      baseCurrencyAmount: 960,   fee: 0,     date: '2024-09-03', note: 'Q3 2024 dividend' },
  { id: 'sgt5',  symbol: '7203.T',      name: 'Toyota Motor',              exchange: 'TSE',  side: 'buy',      qty: 100,  price: 2850,    currency: 'JPY', fxRate: 0.0089, baseCurrencyAmount: 2537,  fee: 8.00,  date: '2024-10-18' },
  { id: 'sgt6',  symbol: 'HDFCBANK.NS', name: 'HDFC Bank',                 exchange: 'NSE',  side: 'buy',      qty: 100,  price: 1720,    currency: 'INR', fxRate: 0.0161, baseCurrencyAmount: 2769,  fee: 5.00,  date: '2024-11-05' },
  { id: 'sgt7',  symbol: 'M44U.SI',     name: 'Mapletree Logistics Trust', exchange: 'SGX',  side: 'buy',      qty: 5000, price: 1.72,    currency: 'SGD', fxRate: 1,      baseCurrencyAmount: 8600,  fee: 20.00, date: '2024-12-12' },
  { id: 'sgt8',  symbol: 'M44U.SI',     name: 'Mapletree Logistics Trust', exchange: 'SGX',  side: 'dividend', qty: 5000, price: 0.0268,  currency: 'SGD', fxRate: 1,      baseCurrencyAmount: 134,   fee: 0,     date: '2025-01-15', note: 'Q4 2024 DPU' },
  { id: 'sgt9',  symbol: '9988.HK',     name: 'Alibaba Group',             exchange: 'HKEX', side: 'buy',      qty: 150,  price: 79.20,   currency: 'HKD', fxRate: 0.172,  baseCurrencyAmount: 2044,  fee: 12.00, date: '2025-02-28' },
  { id: 'sgt10', symbol: '9984.T',      name: 'SoftBank Group',            exchange: 'TSE',  side: 'buy',      qty: 50,   price: 8450,    currency: 'JPY', fxRate: 0.0089, baseCurrencyAmount: 3760,  fee: 8.00,  date: '2025-03-15' },
];

const SG_PAPER_ORDERS: PaperOrder[] = [
  { id: 'sgpo1', symbol: 'D05.SI',      name: 'DBS Group Holdings',   exchange: 'SGX',  currency: 'SGD', side: 'buy',  type: 'limit',  qty: 100,  price: 37.80, filledQty: 0,    status: 'pending', validity: 'GTC', createdAt: '2026-04-05T09:15:00Z', updatedAt: '2026-04-05T09:15:00Z', estimatedValue: 3780,   commission: 4.50,  isPaper: true },
  { id: 'sgpo2', symbol: '0700.HK',     name: 'Tencent Holdings',     exchange: 'HKEX', currency: 'HKD', side: 'buy',  type: 'limit',  qty: 50,   price: 410.0, filledQty: 0,    status: 'pending', validity: 'GTC', createdAt: '2026-04-06T10:30:00Z', updatedAt: '2026-04-06T10:30:00Z', estimatedValue: 20500,  commission: 18.50, isPaper: true },
  { id: 'sgpo3', symbol: 'BHP.AX',      name: 'BHP Group',            exchange: 'ASX',  currency: 'AUD', side: 'sell', type: 'limit',  qty: 100,  price: 52.00, filledQty: 0,    status: 'pending', validity: 'DAY', createdAt: '2026-04-07T02:00:00Z', updatedAt: '2026-04-07T02:00:00Z', estimatedValue: 5200,   commission: 15.00, isPaper: true },
  { id: 'sgpo4', symbol: 'HDFCBANK.NS', name: 'HDFC Bank',            exchange: 'NSE',  currency: 'INR', side: 'buy',  type: 'market', qty: 50,   price: 1892,  filledQty: 50,   avgFillPrice: 1894.50, status: 'filled', validity: 'DAY', createdAt: '2026-03-20T04:00:00Z', updatedAt: '2026-03-20T04:01:00Z', estimatedValue: 94725, commission: 5,    pnl: 145, isPaper: true },
  { id: 'sgpo5', symbol: '9984.T',      name: 'SoftBank Group',       exchange: 'TSE',  currency: 'JPY', side: 'buy',  type: 'market', qty: 20,   price: 8920,  filledQty: 20,   avgFillPrice: 8923,    status: 'filled', validity: 'DAY', createdAt: '2026-03-25T01:00:00Z', updatedAt: '2026-03-25T01:01:00Z', estimatedValue: 178460, commission: 8,    pnl: 712, isPaper: true },
  { id: 'sgpo6', symbol: 'M44U.SI',     name: 'Mapletree Logistics',  exchange: 'SGX',  currency: 'SGD', side: 'sell', type: 'limit',  qty: 2000, price: 1.60,  filledQty: 2000, avgFillPrice: 1.60,    status: 'filled', validity: 'GTC', createdAt: '2026-04-01T02:15:00Z', updatedAt: '2026-04-01T02:20:00Z', estimatedValue: 3200,   commission: 4.50, pnl: -240, isPaper: true },
  { id: 'sgpo7', symbol: 'BHP.AX',      name: 'BHP Group',            exchange: 'ASX',  currency: 'AUD', side: 'buy',  type: 'market', qty: 200,  price: 48.20, filledQty: 200,  avgFillPrice: 48.25,   status: 'filled', validity: 'DAY', createdAt: '2026-04-03T00:00:00Z', updatedAt: '2026-04-03T00:01:00Z', estimatedValue: 9650,   commission: 15,   pnl: 250, isPaper: true },
  { id: 'sgpo8', symbol: 'D05.SI',      name: 'DBS Group',            exchange: 'SGX',  currency: 'SGD', side: 'buy',  type: 'limit',  qty: 200,  price: 37.50, filledQty: 200,  avgFillPrice: 37.52,   status: 'filled', validity: 'GTC', createdAt: '2026-03-28T01:30:00Z', updatedAt: '2026-03-28T09:00:00Z', estimatedValue: 7504,   commission: 12.50, pnl: 186, isPaper: true },
];

const SG_GOALS: Goal[] = [
  { id: 'sgg1', name: 'Retirement at 60',     target: 2000000, current: 117331, currency: 'SGD', targetDate: '2045-01-01', color: 'amber'   },
  { id: 'sgg2', name: 'Property Downpayment', target: 200000,  current: 67331,  currency: 'SGD', targetDate: '2027-06-01', color: 'blue'    },
  { id: 'sgg3', name: "Children's Education", target: 150000,  current: 25000,  currency: 'SGD', targetDate: '2032-01-01', color: 'emerald' },
];

const SG_ALERTS: Alert[] = [
  { id: 'sga1', symbol: 'D05.SI',  name: 'DBS Group', exchange: 'SGX',  type: 'price-below', threshold: 36.00,  isActive: true,  createdAt: '2026-04-01T00:00:00Z' },
  { id: 'sga2', symbol: '0700.HK', name: 'Tencent',   exchange: 'HKEX', type: 'price-above', threshold: 450.00, isActive: true,  createdAt: '2026-04-02T00:00:00Z' },
  { id: 'sga3', symbol: 'BHP.AX',  name: 'BHP Group', exchange: 'ASX',  type: 'price-above', threshold: 52.00,  isActive: false, createdAt: '2026-03-15T00:00:00Z', triggeredAt: '2026-04-07T01:30:00Z' },
];

const SG_WATCHLIST: WatchlistItem[] = [
  { id: 'sgw1', symbol: 'OCBC.SI', name: 'OCBC Bank',          exchange: 'SGX',  currency: 'SGD', addedAt: '2026-03-10T00:00:00Z', currentPrice: 14.82,  change: 0.12,  changePercent: 0.82  },
  { id: 'sgw2', symbol: '1299.HK', name: 'AIA Group',          exchange: 'HKEX', currency: 'HKD', addedAt: '2026-03-15T00:00:00Z', currentPrice: 68.45,  change: -0.55, changePercent: -0.80 },
  { id: 'sgw3', symbol: '6758.T',  name: 'Sony Group Corp',    exchange: 'TSE',  currency: 'JPY', addedAt: '2026-03-20T00:00:00Z', currentPrice: 12450,  change: 234,   changePercent: 1.92  },
  { id: 'sgw4', symbol: 'CBA.AX',  name: 'Commonwealth Bank',  exchange: 'ASX',  currency: 'AUD', addedAt: '2026-03-22T00:00:00Z', currentPrice: 138.50, change: -1.20, changePercent: -0.86 },
  { id: 'sgw5', symbol: 'Z74.SI',  name: 'Singtel',            exchange: 'SGX',  currency: 'SGD', addedAt: '2026-04-01T00:00:00Z', currentPrice: 2.84,   change: 0.06,  changePercent: 2.16  },
];

const SG_ADVISOR_CLIENTS: AdvisorClient[] = [
  { id: 'sgc1', name: 'Wei Liang Tan',    baseCurrency: 'SGD', aum: 524780,  dayChange: 312.45, dayChangePct: 0.06,  ytdReturn: 8.34,  riskProfile: 'Moderate Growth',   lastReview: '2026-03-01' },
  { id: 'sgc2', name: 'Priya Sharma',     baseCurrency: 'SGD', aum: 1240000, dayChange: -2340,  dayChangePct: -0.19, ytdReturn: 12.45, riskProfile: 'Aggressive Growth', lastReview: '2026-02-15' },
  { id: 'sgc3', name: 'James Woo',        baseCurrency: 'HKD', aum: 8500000, dayChange: 34500,  dayChangePct: 0.41,  ytdReturn: 6.78,  riskProfile: 'Conservative',      lastReview: '2026-03-20' },
  { id: 'sgc4', name: 'Ananya Krishnan',  baseCurrency: 'SGD', aum: 320000,  dayChange: 780,    dayChangePct: 0.24,  ytdReturn: 15.23, riskProfile: 'Moderate Growth',   lastReview: '2026-01-30' },
  { id: 'sgc5', name: 'Robert Chen',      baseCurrency: 'AUD', aum: 2100000, dayChange: -8900,  dayChangePct: -0.42, ytdReturn: 4.12,  riskProfile: 'Balanced',          lastReview: '2026-03-10' },
];

const SG_ALLOCATION_TARGETS: AllocationTarget[] = [
  { country: 'Singapore', flag: '🇸🇬', target: 45, current: 40.3 },
  { country: 'Hong Kong', flag: '🇭🇰', target: 20, current: 25.5 },
  { country: 'Japan',     flag: '🇯🇵', target: 10, current: 10.4 },
  { country: 'Australia', flag: '🇦🇺', target: 15, current: 19.2 },
  { country: 'India',     flag: '🇮🇳', target: 10, current: 4.7  },
];

const SG_YTD_PERFORMANCE: YtdPerformancePoint[] = [
  { month: 'Jan', portfolio: 2.8, benchmark: 1.4 },
  { month: 'Feb', portfolio: 4.2, benchmark: 2.8 },
  { month: 'Mar', portfolio: 6.5, benchmark: 4.1 },
  { month: 'Apr', portfolio: 5.8, benchmark: 3.9 },
  { month: 'May', portfolio: 8.2, benchmark: 5.4 },
  { month: 'Jun', portfolio: 9.6, benchmark: 6.2 },
  { month: 'Jul', portfolio: 11.4, benchmark: 7.1 },
  { month: 'Aug', portfolio: 10.8, benchmark: 6.8 },
  { month: 'Sep', portfolio: 13.2, benchmark: 7.9 },
  { month: 'Oct', portfolio: 14.5, benchmark: 8.4 },
  { month: 'Nov', portfolio: 16.1, benchmark: 9.1 },
  { month: 'Dec', portfolio: 17.12, benchmark: 9.8 },
];

const SG_EVENTS: CalendarEvent[] = [
  { date: '2026-04-08', company: 'DBS Group Holdings',         symbol: 'D05.SI',      flag: '🇸🇬', exchange: 'SGX',  type: 'Earnings',    note: 'Q1 2026 results' },
  { date: '2026-04-09', company: 'Tencent Holdings',           symbol: '0700.HK',     flag: '🇭🇰', exchange: 'HKEX', type: 'Results',     note: 'Q1 2026 results' },
  { date: '2026-04-10', company: 'Mapletree Logistics Trust',  symbol: 'M44U.SI',     flag: '🇸🇬', exchange: 'SGX',  type: 'Ex-Dividend', note: 'Q1 DPU S$0.0268' },
  { date: '2026-04-11', company: 'BHP Group Ltd',              symbol: 'BHP.AX',      flag: '🇦🇺', exchange: 'ASX',  type: 'Results',     note: 'Q3 FY2026 production report' },
  { date: '2026-04-14', company: 'OCBC Bank',                  symbol: 'O39.SI',      flag: '🇸🇬', exchange: 'SGX',  type: 'Earnings',    note: 'Q1 2026 results' },
  { date: '2026-04-15', company: 'Toyota Motor Corp',          symbol: '7203.T',      flag: '🇯🇵', exchange: 'TSE',  type: 'Earnings',    note: 'FY2026 Q4 results' },
  { date: '2026-04-17', company: 'AIA Group',                  symbol: '1299.HK',     flag: '🇭🇰', exchange: 'HKEX', type: 'Earnings',    note: 'Q1 2026 results' },
  { date: '2026-04-18', company: 'Samsung Electronics',        symbol: '005930.KS',   flag: '🇰🇷', exchange: 'KRX',  type: 'Earnings',    note: 'Q1 2026 results' },
  { date: '2026-04-21', company: 'DBS Group Holdings',         symbol: 'D05.SI',      flag: '🇸🇬', exchange: 'SGX',  type: 'Ex-Dividend', note: 'Q1 2026 interim dividend S$0.54' },
  { date: '2026-04-22', company: 'Alibaba Group',              symbol: '9988.HK',     flag: '🇭🇰', exchange: 'HKEX', type: 'Results',     note: 'Q4 FY2026 results' },
  { date: '2026-04-23', company: 'Commonwealth Bank',          symbol: 'CBA.AX',      flag: '🇦🇺', exchange: 'ASX',  type: 'Earnings',    note: 'Q3 FY2026 results' },
  { date: '2026-04-24', company: 'SoftBank Group Corp',        symbol: '9984.T',      flag: '🇯🇵', exchange: 'TSE',  type: 'Earnings',    note: 'FY2026 full-year results' },
  { date: '2026-04-25', company: 'Keppel Corp',                symbol: 'BN4.SI',      flag: '🇸🇬', exchange: 'SGX',  type: 'Earnings',    note: 'Q1 2026 results' },
  { date: '2026-04-28', company: 'CapitaLand Ascendas REIT',   symbol: 'A17U.SI',     flag: '🇸🇬', exchange: 'SGX',  type: 'Ex-Dividend', note: 'Q1 2026 DPU S$0.0389' },
  { date: '2026-04-29', company: 'Sony Group Corp',            symbol: '6758.T',      flag: '🇯🇵', exchange: 'TSE',  type: 'Earnings',    note: 'FY2026 full-year results' },
  { date: '2026-05-05', company: 'BHP Group Ltd',              symbol: 'BHP.AX',      flag: '🇦🇺', exchange: 'ASX',  type: 'Ex-Dividend', note: 'Interim dividend A$0.72' },
  { date: '2026-05-08', company: 'United Overseas Bank',       symbol: 'U11.SI',      flag: '🇸🇬', exchange: 'SGX',  type: 'Earnings',    note: 'Q1 2026 results' },
];

const SG_NEWS: NewsItem[] = [
  { id: 'sgn1',  title: 'DBS Group Reports Record Q1 2026 Profits Amid Strong Regional Lending', source: 'The Business Times',     url: 'https://finance.yahoo.com/quote/D05.SI/news/',   publishedAt: '2026-04-07T02:00:00Z', summary: 'DBS Group Holdings reported a 15% year-on-year increase in net profit for Q1 2026, driven by strong net interest income and wealth management fee growth across Southeast Asia.', sentiment: 'positive', tags: ['DBS', 'Financials', 'Singapore'], country: 'SG' },
  { id: 'sgn2',  title: 'Hang Seng Index Rallies 2.3% as China Unveils New Stimulus Package',    source: 'South China Morning Post',url: 'https://finance.yahoo.com/quote/%5EHSI/news/',  publishedAt: '2026-04-07T01:30:00Z', summary: 'Hong Kong markets surged as Beijing announced a CNY 2 trillion infrastructure spending package targeting green energy and semiconductor supply chains.', sentiment: 'positive', tags: ['HSI', 'China', 'Stimulus'], country: 'HK' },
  { id: 'sgn3',  title: 'Bank of Japan Maintains Ultra-Low Rates, Signals Gradual Normalisation', source: 'Nikkei Asia',            url: 'https://finance.yahoo.com/quote/%5EN225/news/', publishedAt: '2026-04-06T08:00:00Z', summary: 'The Bank of Japan kept its policy rate unchanged at 0.1% but indicated that conditions for further tightening may emerge if inflation sustainably reaches the 2% target.', sentiment: 'neutral', tags: ['BOJ', 'Japan', 'Rates'], country: 'JP' },
  { id: 'sgn4',  title: 'RBA Holds Cash Rate at 4.10% as Australian Inflation Eases to 3.2%',     source: 'Australian Financial Review', url: 'https://finance.yahoo.com/quote/%5EAXJO/news/', publishedAt: '2026-04-06T05:30:00Z', summary: 'The Reserve Bank of Australia left its benchmark rate unchanged, citing encouraging progress on inflation while flagging risks from weakening Chinese demand for iron ore.', sentiment: 'neutral', tags: ['RBA', 'Australia', 'Rates'], country: 'AU' },
  { id: 'sgn5',  title: 'Tencent Beats Q1 Revenue Forecasts on Gaming and AI Cloud Recovery',     source: 'Reuters',                url: 'https://finance.yahoo.com/quote/TCEHY/news/',   publishedAt: '2026-04-05T12:00:00Z', summary: 'Tencent reported Q1 revenues up 18% year-on-year, with domestic gaming revenue surging 24% on the back of blockbuster mobile titles and expanding international game portfolio.', sentiment: 'positive', tags: ['Tencent', 'Technology', 'Hong Kong'], country: 'HK' },
  { id: 'sgn6',  title: 'Singapore REITs Face Pressure as Office Vacancies Rise in CBD',          source: 'The Straits Times',      url: 'https://finance.yahoo.com/quote/SE/news/',       publishedAt: '2026-04-05T04:00:00Z', summary: 'S-REIT managers flagged challenges in the office sub-sector as Central Business District vacancy rates reached 7.2%, the highest since 2021, driven by hybrid work adoption.', sentiment: 'negative', tags: ['REITs', 'Singapore', 'Real Estate'], country: 'SG' },
  { id: 'sgn7',  title: 'India Nifty Hits Record High on Foreign Institutional Investor Inflows', source: 'Economic Times',         url: 'https://finance.yahoo.com/quote/INFY/news/',     publishedAt: '2026-04-04T10:00:00Z', summary: 'The NSE Nifty 50 Index surpassed 22,500 for the first time as foreign investors poured $4.2 billion into Indian equities in March, attracted by strong GDP growth forecasts.', sentiment: 'positive', tags: ['Nifty', 'India', 'FII'], country: 'IN' },
  { id: 'sgn8',  title: 'BHP Ships Record Iron Ore Volume to China Ahead of Stimulus Rollout',    source: 'Bloomberg',              url: 'https://finance.yahoo.com/quote/BHP/news/',      publishedAt: '2026-04-04T02:00:00Z', summary: "BHP Group reported record quarterly iron ore shipments of 68.9 million tonnes from its Pilbara operations, positioning the miner to benefit from China's infrastructure push.", sentiment: 'positive', tags: ['BHP', 'Mining', 'Australia'], country: 'AU' },
  { id: 'sgn9',  title: 'MAS Maintains SGD NEER Policy Band, Cites Contained Inflation Outlook',  source: 'Channel NewsAsia',       url: 'https://finance.yahoo.com/quote/GRAB/news/',     publishedAt: '2026-04-03T08:00:00Z', summary: 'The Monetary Authority of Singapore kept its Singapore Dollar Nominal Effective Exchange Rate policy unchanged at its April meeting, projecting core inflation to ease to 1.5-2.5% for 2026.', sentiment: 'neutral', tags: ['MAS', 'SGD', 'Monetary Policy'], country: 'SG' },
  { id: 'sgn10', title: 'ASEAN Fintech Funding Rebounds 34% in Q1 2026 Despite Global Headwinds', source: 'Tech in Asia',           url: 'https://finance.yahoo.com/quote/SE/news/',       publishedAt: '2026-04-02T06:00:00Z', summary: 'Venture capital investment in Southeast Asian fintech startups reached $1.8 billion in Q1 2026, led by Singapore-based wealth management and payments platforms capturing cross-border flows.', sentiment: 'positive', tags: ['Fintech', 'ASEAN', 'Venture Capital'], country: 'SG' },
];

// ═════════════════════════════════════════════════════════════════════════════
// 🇮🇳 INDIA
// ═════════════════════════════════════════════════════════════════════════════

const IN_USER: User = {
  name: 'Arjun Mehta',
  initials: 'AM',
  age: 35,
  targetRetirementAge: 58,
  occupation: 'Senior Software Architect',
  location: 'Bangalore',
  profileLine: 'Arjun Mehta · 35 · Bangalore · Aggressive Growth',
  riskProfile: 'Aggressive Growth',
  monthlyIncome: 285000, // INR (~₹34 LPA cost-to-company)
  taxResidency: 'IN',
};

const IN_HOLDINGS: Holding[] = [
  { id: 'inh1', symbol: 'RELIANCE.NS',   name: 'Reliance Industries',       exchange: 'NSE', currency: 'INR', qty: 50,  avgCost: 2650, currentPrice: 2945, localValue: 147250, localPnl: 14750, localPnlPct: 11.13, baseCurrencyValue: 147250, baseCurrencyPnl: 14750, fxPnl: 0, totalPnlPct: 11.13, sector: 'Energy',           country: 'India', withholdingTaxRate: 0, dividendYield: 0.4 },
  { id: 'inh2', symbol: 'TCS.NS',        name: 'Tata Consultancy Services', exchange: 'NSE', currency: 'INR', qty: 40,  avgCost: 3450, currentPrice: 3820, localValue: 152800, localPnl: 14800, localPnlPct: 10.72, baseCurrencyValue: 152800, baseCurrencyPnl: 14800, fxPnl: 0, totalPnlPct: 10.72, sector: 'Technology',       country: 'India', withholdingTaxRate: 0, dividendYield: 1.8 },
  { id: 'inh3', symbol: 'HDFCBANK.NS',   name: 'HDFC Bank Ltd',             exchange: 'NSE', currency: 'INR', qty: 100, avgCost: 1720, currentPrice: 1965, localValue: 196500, localPnl: 24500, localPnlPct: 14.24, baseCurrencyValue: 196500, baseCurrencyPnl: 24500, fxPnl: 0, totalPnlPct: 14.24, sector: 'Financials',       country: 'India', withholdingTaxRate: 0, dividendYield: 1.2 },
  { id: 'inh4', symbol: 'INFY.NS',       name: 'Infosys Ltd',               exchange: 'NSE', currency: 'INR', qty: 80,  avgCost: 1480, currentPrice: 1642, localValue: 131360, localPnl: 12960, localPnlPct: 10.95, baseCurrencyValue: 131360, baseCurrencyPnl: 12960, fxPnl: 0, totalPnlPct: 10.95, sector: 'Technology',       country: 'India', withholdingTaxRate: 0, dividendYield: 2.1 },
  { id: 'inh5', symbol: 'ICICIBANK.NS',  name: 'ICICI Bank Ltd',            exchange: 'NSE', currency: 'INR', qty: 150, avgCost: 965,  currentPrice: 1087, localValue: 163050, localPnl: 18300, localPnlPct: 12.64, baseCurrencyValue: 163050, baseCurrencyPnl: 18300, fxPnl: 0, totalPnlPct: 12.64, sector: 'Financials',       country: 'India', withholdingTaxRate: 0, dividendYield: 0.9 },
  { id: 'inh6', symbol: 'ITC.NS',        name: 'ITC Ltd',                   exchange: 'NSE', currency: 'INR', qty: 200, avgCost: 418,  currentPrice: 463,  localValue: 92600,  localPnl: 9000,  localPnlPct: 10.77, baseCurrencyValue: 92600,  baseCurrencyPnl: 9000,  fxPnl: 0, totalPnlPct: 10.77, sector: 'Consumer Staples', country: 'India', withholdingTaxRate: 0, dividendYield: 3.4 },
  { id: 'inh7', symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd',         exchange: 'NSE', currency: 'INR', qty: 90,  avgCost: 1245, currentPrice: 1389, localValue: 125010, localPnl: 12960, localPnlPct: 11.57, baseCurrencyValue: 125010, baseCurrencyPnl: 12960, fxPnl: 0, totalPnlPct: 11.57, sector: 'Telecoms',         country: 'India', withholdingTaxRate: 0, dividendYield: 0.6 },
  { id: 'inh8', symbol: 'LT.NS',         name: 'Larsen & Toubro Ltd',       exchange: 'NSE', currency: 'INR', qty: 40,  avgCost: 3280, currentPrice: 3567, localValue: 142680, localPnl: 11480, localPnlPct: 8.75,  baseCurrencyValue: 142680, baseCurrencyPnl: 11480, fxPnl: 0, totalPnlPct: 8.75,  sector: 'Industrials',      country: 'India', withholdingTaxRate: 0, dividendYield: 1.1 },
];

// Sum of IN holdings baseCurrencyValue = 1,151,250
const IN_PORTFOLIO_SUMMARY: PortfolioSummary = {
  totalValue: 1151250,
  totalCost: 1045500,
  totalPnl: 105750,
  totalPnlPct: 10.11,
  fxPnl: 0,
  cashBalance: 275000,
  baseCurrency: 'INR',
  dayChange: 4820,
  dayChangePct: 0.42,
  byCountry: [
    { country: 'India', value: 1151250, pct: 100 },
  ],
  bySector: [
    { sector: 'Financials',       value: 359550, pct: 31.2 },
    { sector: 'Technology',       value: 284160, pct: 24.7 },
    { sector: 'Industrials',      value: 142680, pct: 12.4 },
    { sector: 'Energy',           value: 147250, pct: 12.8 },
    { sector: 'Telecoms',         value: 125010, pct: 10.9 },
    { sector: 'Consumer Staples', value: 92600,  pct: 8.0  },
  ],
  byCurrency: [
    { currency: 'INR', value: 1151250, pct: 100 },
  ],
};

const IN_TRANSACTIONS: Transaction[] = [
  { id: 'int1',  symbol: 'RELIANCE.NS',   name: 'Reliance Industries',  exchange: 'NSE', side: 'buy',      qty: 50,  price: 2650,   currency: 'INR', fxRate: 1, baseCurrencyAmount: 132500, fee: 45,  date: '2024-06-12' },
  { id: 'int2',  symbol: 'TCS.NS',        name: 'Tata Consultancy',     exchange: 'NSE', side: 'buy',      qty: 40,  price: 3450,   currency: 'INR', fxRate: 1, baseCurrencyAmount: 138000, fee: 48,  date: '2024-07-08' },
  { id: 'int3',  symbol: 'HDFCBANK.NS',   name: 'HDFC Bank',            exchange: 'NSE', side: 'buy',      qty: 100, price: 1720,   currency: 'INR', fxRate: 1, baseCurrencyAmount: 172000, fee: 60,  date: '2024-08-20' },
  { id: 'int4',  symbol: 'TCS.NS',        name: 'Tata Consultancy',     exchange: 'NSE', side: 'dividend', qty: 40,  price: 73,     currency: 'INR', fxRate: 1, baseCurrencyAmount: 2920,   fee: 0,   date: '2024-09-15', note: 'Interim dividend FY25' },
  { id: 'int5',  symbol: 'INFY.NS',       name: 'Infosys',              exchange: 'NSE', side: 'buy',      qty: 80,  price: 1480,   currency: 'INR', fxRate: 1, baseCurrencyAmount: 118400, fee: 42,  date: '2024-10-05' },
  { id: 'int6',  symbol: 'ICICIBANK.NS',  name: 'ICICI Bank',           exchange: 'NSE', side: 'buy',      qty: 150, price: 965,    currency: 'INR', fxRate: 1, baseCurrencyAmount: 144750, fee: 52,  date: '2024-10-28' },
  { id: 'int7',  symbol: 'ITC.NS',        name: 'ITC',                  exchange: 'NSE', side: 'buy',      qty: 200, price: 418,    currency: 'INR', fxRate: 1, baseCurrencyAmount: 83600,  fee: 32,  date: '2024-11-18' },
  { id: 'int8',  symbol: 'ITC.NS',        name: 'ITC',                  exchange: 'NSE', side: 'dividend', qty: 200, price: 6.25,   currency: 'INR', fxRate: 1, baseCurrencyAmount: 1250,   fee: 0,   date: '2024-12-10', note: 'Final dividend FY24' },
  { id: 'int9',  symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel',        exchange: 'NSE', side: 'buy',      qty: 90,  price: 1245,   currency: 'INR', fxRate: 1, baseCurrencyAmount: 112050, fee: 40,  date: '2025-01-22' },
  { id: 'int10', symbol: 'LT.NS',         name: 'Larsen & Toubro',      exchange: 'NSE', side: 'buy',      qty: 40,  price: 3280,   currency: 'INR', fxRate: 1, baseCurrencyAmount: 131200, fee: 47,  date: '2025-02-14' },
];

const IN_PAPER_ORDERS: PaperOrder[] = [
  { id: 'inpo1', symbol: 'RELIANCE.NS',   name: 'Reliance Industries', exchange: 'NSE', currency: 'INR', side: 'buy',  type: 'limit',  qty: 25,  price: 2920,  filledQty: 0,   status: 'pending', validity: 'GTC', createdAt: '2026-04-05T04:15:00Z', updatedAt: '2026-04-05T04:15:00Z', estimatedValue: 73000,  commission: 25,  isPaper: true },
  { id: 'inpo2', symbol: 'TCS.NS',        name: 'Tata Consultancy',    exchange: 'NSE', currency: 'INR', side: 'buy',  type: 'limit',  qty: 20,  price: 3780,  filledQty: 0,   status: 'pending', validity: 'GTC', createdAt: '2026-04-06T04:30:00Z', updatedAt: '2026-04-06T04:30:00Z', estimatedValue: 75600,  commission: 25,  isPaper: true },
  { id: 'inpo3', symbol: 'INFY.NS',       name: 'Infosys',             exchange: 'NSE', currency: 'INR', side: 'sell', type: 'limit',  qty: 40,  price: 1680,  filledQty: 0,   status: 'pending', validity: 'DAY', createdAt: '2026-04-07T03:00:00Z', updatedAt: '2026-04-07T03:00:00Z', estimatedValue: 67200,  commission: 25,  isPaper: true },
  { id: 'inpo4', symbol: 'HDFCBANK.NS',   name: 'HDFC Bank',           exchange: 'NSE', currency: 'INR', side: 'buy',  type: 'market', qty: 50,  price: 1942,  filledQty: 50,  avgFillPrice: 1944, status: 'filled', validity: 'DAY', createdAt: '2026-03-20T04:00:00Z', updatedAt: '2026-03-20T04:01:00Z', estimatedValue: 97200,  commission: 25,  pnl: 1050,  isPaper: true },
  { id: 'inpo5', symbol: 'ICICIBANK.NS',  name: 'ICICI Bank',          exchange: 'NSE', currency: 'INR', side: 'buy',  type: 'market', qty: 100, price: 1072,  filledQty: 100, avgFillPrice: 1074, status: 'filled', validity: 'DAY', createdAt: '2026-03-25T04:00:00Z', updatedAt: '2026-03-25T04:01:00Z', estimatedValue: 107400, commission: 25,  pnl: 1300,  isPaper: true },
  { id: 'inpo6', symbol: 'ITC.NS',        name: 'ITC',                 exchange: 'NSE', currency: 'INR', side: 'sell', type: 'limit',  qty: 100, price: 465,   filledQty: 100, avgFillPrice: 465,  status: 'filled', validity: 'GTC', createdAt: '2026-04-01T04:15:00Z', updatedAt: '2026-04-01T04:20:00Z', estimatedValue: 46500,  commission: 25,  pnl: -200,  isPaper: true },
  { id: 'inpo7', symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel',       exchange: 'NSE', currency: 'INR', side: 'buy',  type: 'market', qty: 30,  price: 1372,  filledQty: 30,  avgFillPrice: 1374, status: 'filled', validity: 'DAY', createdAt: '2026-04-03T03:45:00Z', updatedAt: '2026-04-03T03:46:00Z', estimatedValue: 41220,  commission: 25,  pnl: 450,   isPaper: true },
  { id: 'inpo8', symbol: 'LT.NS',         name: 'Larsen & Toubro',     exchange: 'NSE', currency: 'INR', side: 'buy',  type: 'limit',  qty: 15,  price: 3540,  filledQty: 15,  avgFillPrice: 3542, status: 'filled', validity: 'GTC', createdAt: '2026-03-28T04:30:00Z', updatedAt: '2026-03-28T06:00:00Z', estimatedValue: 53130,  commission: 25,  pnl: 375,   isPaper: true },
];

const IN_GOALS: Goal[] = [
  { id: 'ing1', name: 'Retirement Corpus (60)',       target: 50000000, current: 1426250, currency: 'INR', targetDate: '2048-04-01', color: 'amber'   },
  { id: 'ing2', name: 'Home Down Payment — Mumbai',   target: 8000000,  current: 1151250, currency: 'INR', targetDate: '2028-06-01', color: 'blue'    },
  { id: 'ing3', name: "Children's Education Fund",    target: 15000000, current: 325000,  currency: 'INR', targetDate: '2035-04-01', color: 'emerald' },
];

const IN_ALERTS: Alert[] = [
  { id: 'ina1', symbol: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE', type: 'price-below', threshold: 2800, isActive: true,  createdAt: '2026-04-01T00:00:00Z' },
  { id: 'ina2', symbol: 'TCS.NS',      name: 'Tata Consultancy',    exchange: 'NSE', type: 'price-above', threshold: 4000, isActive: true,  createdAt: '2026-04-02T00:00:00Z' },
  { id: 'ina3', symbol: 'HDFCBANK.NS', name: 'HDFC Bank',           exchange: 'NSE', type: 'price-above', threshold: 2050, isActive: false, createdAt: '2026-03-15T00:00:00Z', triggeredAt: '2026-04-07T05:30:00Z' },
];

const IN_WATCHLIST: WatchlistItem[] = [
  { id: 'inw1', symbol: 'AXISBANK.NS',   name: 'Axis Bank',          exchange: 'NSE', currency: 'INR', addedAt: '2026-03-10T00:00:00Z', currentPrice: 1124, change: 12.80, changePercent: 1.15  },
  { id: 'inw2', symbol: 'WIPRO.NS',      name: 'Wipro Ltd',          exchange: 'NSE', currency: 'INR', addedAt: '2026-03-15T00:00:00Z', currentPrice: 485,  change: -3.20, changePercent: -0.66 },
  { id: 'inw3', symbol: 'MARUTI.NS',     name: 'Maruti Suzuki',      exchange: 'NSE', currency: 'INR', addedAt: '2026-03-20T00:00:00Z', currentPrice: 12640, change: 185,  changePercent: 1.48  },
  { id: 'inw4', symbol: 'ASIANPAINT.NS', name: 'Asian Paints',       exchange: 'NSE', currency: 'INR', addedAt: '2026-03-22T00:00:00Z', currentPrice: 2890, change: -18,   changePercent: -0.62 },
  { id: 'inw5', symbol: 'SBIN.NS',       name: 'State Bank of India', exchange: 'NSE', currency: 'INR', addedAt: '2026-04-01T00:00:00Z', currentPrice: 785,  change: 9.40,  changePercent: 1.21  },
];

const IN_ADVISOR_CLIENTS: AdvisorClient[] = [
  { id: 'inc1', name: 'Arjun Mehta',     baseCurrency: 'INR', aum: 24500000, dayChange: 42500,  dayChangePct: 0.17,  ytdReturn: 11.85, riskProfile: 'Moderate Growth',   lastReview: '2026-03-02' },
  { id: 'inc2', name: 'Divya Iyer',      baseCurrency: 'INR', aum: 8750000,  dayChange: -12800, dayChangePct: -0.15, ytdReturn: 14.32, riskProfile: 'Aggressive Growth', lastReview: '2026-02-18' },
  { id: 'inc3', name: 'Rohit Agarwal',   baseCurrency: 'INR', aum: 62000000, dayChange: 215000, dayChangePct: 0.35,  ytdReturn: 9.45,  riskProfile: 'Balanced',          lastReview: '2026-03-22' },
  { id: 'inc4', name: 'Kavya Reddy',     baseCurrency: 'INR', aum: 3200000,  dayChange: 8400,   dayChangePct: 0.26,  ytdReturn: 16.78, riskProfile: 'Moderate Growth',   lastReview: '2026-01-28' },
  { id: 'inc5', name: 'Vikram Shah',     baseCurrency: 'INR', aum: 18900000, dayChange: -35000, dayChangePct: -0.19, ytdReturn: 7.92,  riskProfile: 'Conservative',      lastReview: '2026-03-12' },
];

const IN_ALLOCATION_TARGETS: AllocationTarget[] = [
  { country: 'Large Cap',  flag: '🇮🇳', target: 55, current: 51.2 },
  { country: 'Mid Cap',    flag: '🇮🇳', target: 20, current: 24.5 },
  { country: 'Small Cap',  flag: '🇮🇳', target: 10, current: 8.3  },
  { country: 'Int\'l',     flag: '🌏', target: 10, current: 12.1 },
  { country: 'Debt/Gold',  flag: '🪙', target: 5,  current: 3.9  },
];

const IN_YTD_PERFORMANCE: YtdPerformancePoint[] = [
  { month: 'Jan', portfolio: 1.8, benchmark: 1.2 },
  { month: 'Feb', portfolio: 3.4, benchmark: 2.5 },
  { month: 'Mar', portfolio: 4.8, benchmark: 3.7 },
  { month: 'Apr', portfolio: 5.9, benchmark: 4.2 },
  { month: 'May', portfolio: 6.3, benchmark: 4.8 },
  { month: 'Jun', portfolio: 7.1, benchmark: 5.3 },
  { month: 'Jul', portfolio: 7.8, benchmark: 5.9 },
  { month: 'Aug', portfolio: 8.4, benchmark: 6.2 },
  { month: 'Sep', portfolio: 8.9, benchmark: 6.7 },
  { month: 'Oct', portfolio: 9.3, benchmark: 7.1 },
  { month: 'Nov', portfolio: 9.7, benchmark: 7.4 },
  { month: 'Dec', portfolio: 10.11, benchmark: 7.9 },
];

const IN_EVENTS: CalendarEvent[] = [
  { date: '2026-04-08', company: 'Tata Consultancy Services', symbol: 'TCS.NS',        flag: '🇮🇳', exchange: 'NSE', type: 'Earnings',    note: 'Q4 FY2026 results — kicks off IT earnings season' },
  { date: '2026-04-09', company: 'HDFC Bank Ltd',             symbol: 'HDFCBANK.NS',   flag: '🇮🇳', exchange: 'NSE', type: 'Results',     note: 'Q4 FY2026 · provisional loan book update' },
  { date: '2026-04-10', company: 'Infosys Ltd',               symbol: 'INFY.NS',       flag: '🇮🇳', exchange: 'NSE', type: 'Earnings',    note: 'Q4 FY2026 · FY27 guidance' },
  { date: '2026-04-11', company: 'Wipro Ltd',                 symbol: 'WIPRO.NS',      flag: '🇮🇳', exchange: 'NSE', type: 'Earnings',    note: 'Q4 FY2026 results' },
  { date: '2026-04-14', company: 'ICICI Bank Ltd',            symbol: 'ICICIBANK.NS',  flag: '🇮🇳', exchange: 'NSE', type: 'Results',     note: 'Q4 FY2026 results' },
  { date: '2026-04-15', company: 'Reliance Industries',       symbol: 'RELIANCE.NS',   flag: '🇮🇳', exchange: 'NSE', type: 'Earnings',    note: 'Q4 FY2026 · Jio ARPU + Retail margins in focus' },
  { date: '2026-04-16', company: 'Axis Bank Ltd',             symbol: 'AXISBANK.NS',   flag: '🇮🇳', exchange: 'NSE', type: 'Earnings',    note: 'Q4 FY2026 results' },
  { date: '2026-04-17', company: 'HCL Technologies',          symbol: 'HCLTECH.NS',    flag: '🇮🇳', exchange: 'NSE', type: 'Earnings',    note: 'Q4 FY2026 results' },
  { date: '2026-04-18', company: 'Kotak Mahindra Bank',       symbol: 'KOTAKBANK.NS',  flag: '🇮🇳', exchange: 'NSE', type: 'Results',     note: 'Q4 FY2026 results' },
  { date: '2026-04-21', company: 'Bajaj Finance Ltd',         symbol: 'BAJFINANCE.NS', flag: '🇮🇳', exchange: 'NSE', type: 'Earnings',    note: 'Q4 FY2026 · AUM growth trajectory' },
  { date: '2026-04-22', company: 'Asian Paints Ltd',          symbol: 'ASIANPAINT.NS', flag: '🇮🇳', exchange: 'NSE', type: 'Earnings',    note: 'Q4 FY2026 results' },
  { date: '2026-04-23', company: 'Nestle India Ltd',          symbol: 'NESTLEIND.NS',  flag: '🇮🇳', exchange: 'NSE', type: 'Earnings',    note: 'Q4 FY2026 results' },
  { date: '2026-04-24', company: 'ITC Ltd',                   symbol: 'ITC.NS',        flag: '🇮🇳', exchange: 'NSE', type: 'Ex-Dividend', note: 'Final dividend ₹6.25 · record date 25 Apr' },
  { date: '2026-04-25', company: 'Larsen & Toubro Ltd',       symbol: 'LT.NS',         flag: '🇮🇳', exchange: 'NSE', type: 'Earnings',    note: 'Q4 FY2026 · order book + infra guidance' },
  { date: '2026-04-28', company: 'Bharti Airtel Ltd',         symbol: 'BHARTIARTL.NS', flag: '🇮🇳', exchange: 'NSE', type: 'Results',     note: 'Q4 FY2026 · 5G rollout economics' },
  { date: '2026-04-29', company: 'Maruti Suzuki India',       symbol: 'MARUTI.NS',     flag: '🇮🇳', exchange: 'NSE', type: 'Earnings',    note: 'Q4 FY2026 · volumes + ASP' },
  { date: '2026-04-30', company: 'Tata Motors Ltd',           symbol: 'TATAMOTORS.NS', flag: '🇮🇳', exchange: 'NSE', type: 'Earnings',    note: 'Q4 FY2026 · JLR margins' },
  { date: '2026-05-05', company: 'State Bank of India',       symbol: 'SBIN.NS',       flag: '🇮🇳', exchange: 'NSE', type: 'Results',     note: 'Q4 FY2026 · NIM + slippages' },
  { date: '2026-05-08', company: 'HDFC Bank Ltd',             symbol: 'HDFCBANK.NS',   flag: '🇮🇳', exchange: 'NSE', type: 'Ex-Dividend', note: 'Final dividend ₹19.50' },
];

const IN_NEWS: NewsItem[] = [
  { id: 'inn1',  title: 'Sensex Scales Fresh Peak as Foreign Inflows Hit ₹42,000 Crore in March',       source: 'Economic Times',        url: 'https://finance.yahoo.com/quote/%5EBSESN/news/',    publishedAt: '2026-04-07T09:30:00Z', summary: 'The BSE Sensex closed above 73,000 for the first time as FII inflows crossed ₹42,000 crore in March 2026, the highest monthly figure in 18 months. Banking and IT stocks led the rally.', sentiment: 'positive', tags: ['Sensex', 'India', 'FII'], country: 'IN' },
  { id: 'inn2',  title: 'RBI Holds Repo Rate at 6.50% for Ninth Consecutive Meeting',                   source: 'Mint',                  url: 'https://finance.yahoo.com/quote/%5ENSEI/news/',    publishedAt: '2026-04-07T05:30:00Z', summary: 'The Reserve Bank of India left the repo rate unchanged, citing CPI inflation at 4.8% still above the 4% target. Governor signalled rate cuts could begin in the second half of 2026.', sentiment: 'neutral', tags: ['RBI', 'India', 'Rates'], country: 'IN' },
  { id: 'inn3',  title: 'TCS Q4 Profit Beats Estimates, Announces ₹18,000 Crore Buyback',               source: 'Business Standard',     url: 'https://finance.yahoo.com/quote/TCS.NS/news/',     publishedAt: '2026-04-07T04:00:00Z', summary: 'Tata Consultancy Services reported Q4 FY2026 net profit of ₹12,450 crore, up 9.2% YoY, and announced its largest ever share buyback at ₹4,500 per share.', sentiment: 'positive', tags: ['TCS', 'Technology', 'India'], country: 'IN' },
  { id: 'inn4',  title: 'Reliance Jio Platforms Adds 3.8 Million Subscribers in March',                 source: 'Livemint',              url: 'https://finance.yahoo.com/quote/RELIANCE.NS/news/',publishedAt: '2026-04-06T10:00:00Z', summary: 'Reliance Jio reported net subscriber additions of 3.8 million in March 2026, taking its subscriber base past 485 million. ARPU rose to ₹191.5 from ₹182.3 in Q3.', sentiment: 'positive', tags: ['Reliance', 'Jio', 'Telecoms'], country: 'IN' },
  { id: 'inn5',  title: 'HDFC Bank Advances ₹27.5 Lakh Crore Loan Book Ahead of Q4 Results',            source: 'The Hindu BusinessLine',url: 'https://finance.yahoo.com/quote/HDFCBANK.NS/news/',publishedAt: '2026-04-06T07:15:00Z', summary: "HDFC Bank's provisional numbers showed gross advances at ₹27.5 lakh crore as of March-end, a 15.8% YoY rise, easing investor concerns over post-merger loan growth.", sentiment: 'positive', tags: ['HDFC', 'Banking', 'India'], country: 'IN' },
  { id: 'inn6',  title: 'SEBI Introduces T+0 Settlement for Top 500 Stocks Starting May',               source: 'Moneycontrol',          url: 'https://finance.yahoo.com/quote/%5ENSEI/news/',    publishedAt: '2026-04-05T11:00:00Z', summary: 'The Securities and Exchange Board of India announced full rollout of same-day (T+0) settlement for the top 500 listed companies from May 15, 2026, making India one of the fastest markets globally.', sentiment: 'positive', tags: ['SEBI', 'Markets', 'Settlement'], country: 'IN' },
  { id: 'inn7',  title: 'Nifty IT Index Slumps 2.4% on Fears of US Visa Fee Hike',                      source: 'CNBC-TV18',             url: 'https://finance.yahoo.com/quote/INFY.NS/news/',    publishedAt: '2026-04-05T08:00:00Z', summary: 'Indian IT services stocks fell sharply after reports that the US administration is considering tripling H-1B visa fees. Infosys, Wipro and HCL Tech all declined over 3%.', sentiment: 'negative', tags: ['Nifty IT', 'IT Services', 'US Policy'], country: 'IN' },
  { id: 'inn8',  title: 'Indian Rupee Strengthens to 82.40 vs USD on Strong Capital Inflows',           source: 'Business Today',        url: 'https://finance.yahoo.com/quote/INR%3DX/news/',    publishedAt: '2026-04-04T06:30:00Z', summary: 'The Indian Rupee appreciated to 82.40 against the US Dollar, its strongest level in 6 months, supported by robust FII inflows into equities and dollar weakness globally.', sentiment: 'positive', tags: ['INR', 'FX', 'Capital Flows'], country: 'IN' },
  { id: 'inn9',  title: 'Adani Group Announces ₹75,000 Crore Capex for Green Hydrogen Push',            source: 'Bloomberg Quint',       url: 'https://finance.yahoo.com/quote/ADANIENT.NS/news/',publishedAt: '2026-04-04T03:00:00Z', summary: 'Adani Group outlined a ₹75,000 crore investment plan over 5 years to build the worlds largest green hydrogen production facility at Mundra, targeting 1 million tonnes annual capacity by 2030.', sentiment: 'positive', tags: ['Adani', 'Green Energy', 'Capex'], country: 'IN' },
  { id: 'inn10', title: 'Bank Nifty Hits Record High as HDFC and ICICI Lead Sector Rally',              source: 'NDTV Profit',           url: 'https://finance.yahoo.com/quote/%5ENSEBANK/news/', publishedAt: '2026-04-03T10:30:00Z', summary: 'The Nifty Bank index crossed 47,000 for the first time ever, led by HDFC Bank and ICICI Bank on improving asset quality and deposit growth momentum heading into Q4 results.', sentiment: 'positive', tags: ['Bank Nifty', 'Banking', 'India'], country: 'IN' },
];

// ═════════════════════════════════════════════════════════════════════════════
// Registry
// ═════════════════════════════════════════════════════════════════════════════

export const REGION_MOCK: Record<RegionId, RegionMock> = {
  SG: {
    user: SG_USER,
    holdings: SG_HOLDINGS,
    events: SG_EVENTS,
    news: SG_NEWS,
    portfolioSummary: SG_PORTFOLIO_SUMMARY,
    transactions: SG_TRANSACTIONS,
    paperOrders: SG_PAPER_ORDERS,
    goals: SG_GOALS,
    alerts: SG_ALERTS,
    watchlist: SG_WATCHLIST,
    retirementBalances: { oa: 87450, sa: 34200, ma: 18750, ra: 0 },
    advisorClients: SG_ADVISOR_CLIENTS,
    allocationTargets: SG_ALLOCATION_TARGETS,
    ytdPerformance: SG_YTD_PERFORMANCE,
  },
  IN: {
    user: IN_USER,
    holdings: IN_HOLDINGS,
    events: IN_EVENTS,
    news: IN_NEWS,
    portfolioSummary: IN_PORTFOLIO_SUMMARY,
    transactions: IN_TRANSACTIONS,
    paperOrders: IN_PAPER_ORDERS,
    goals: IN_GOALS,
    alerts: IN_ALERTS,
    watchlist: IN_WATCHLIST,
    retirementBalances: { oa: 1850000, sa: 920000, ma: 340000, ra: 0 },
    advisorClients: IN_ADVISOR_CLIENTS,
    allocationTargets: IN_ALLOCATION_TARGETS,
    ytdPerformance: IN_YTD_PERFORMANCE,
  },
};
