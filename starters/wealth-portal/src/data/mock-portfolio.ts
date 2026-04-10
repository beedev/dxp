// FX rates (SGD base): HKD=0.172, JPY=0.009, AUD=0.870, INR=0.016

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  qty: number;
  avgCost: number;
  currentPrice: number;
  localValue: number;
  localPnl: number;
  localPnlPct: number;
  baseCurrencyValue: number;
  baseCurrencyPnl: number;
  fxPnl: number;
  totalPnlPct: number;
  sector: string;
  country: string;
  withholdingTaxRate: number;
  dividendYield: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  side: 'buy' | 'sell' | 'dividend';
  qty: number;
  price: number;
  currency: string;
  fxRate: number;
  baseCurrencyAmount: number;
  fee: number;
  date: string;
  note?: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  currency: string;
  targetDate: string;
  color: string;
}

export interface PaperOrder {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop-limit';
  qty: number;
  price: number;
  filledQty: number;
  avgFillPrice?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'partial';
  validity: 'DAY' | 'GTC';
  createdAt: string;
  updatedAt: string;
  estimatedValue: number;
  commission: number;
  pnl?: number;
  isPaper: boolean;
}

export interface Alert {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  type: 'price-above' | 'price-below' | 'volume-spike';
  threshold: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  addedAt: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

export interface AdvisorClient {
  id: string;
  name: string;
  baseCurrency: string;
  aum: number;
  dayChange: number;
  dayChangePct: number;
  ytdReturn: number;
  riskProfile: string;
  lastReview: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  tags: string[];
  country: string;
}

export const MOCK_HOLDINGS: Holding[] = [
  { id: 'h1', symbol: 'D05.SI', name: 'DBS Group Holdings', exchange: 'SGX', currency: 'SGD', qty: 500, avgCost: 32.40, currentPrice: 38.45, localValue: 19225, localPnl: 3025, localPnlPct: 18.67, baseCurrencyValue: 19225, baseCurrencyPnl: 3025, fxPnl: 0, totalPnlPct: 18.67, sector: 'Financials', country: 'Singapore', withholdingTaxRate: 0, dividendYield: 5.8 },
  { id: 'h2', symbol: '0700.HK', name: 'Tencent Holdings', exchange: 'HKEX', currency: 'HKD', qty: 200, avgCost: 315, currentPrice: 425.60, localValue: 85120, localPnl: 22120, localPnlPct: 35.11, baseCurrencyValue: 14641, baseCurrencyPnl: 3804, fxPnl: -180, totalPnlPct: 33.2, sector: 'Technology', country: 'Hong Kong', withholdingTaxRate: 0, dividendYield: 0.4 },
  { id: 'h3', symbol: '7203.T', name: 'Toyota Motor Corp', exchange: 'TSE', currency: 'JPY', qty: 100, avgCost: 2850, currentPrice: 3124, localValue: 312400, localPnl: 27400, localPnlPct: 9.61, baseCurrencyValue: 2812, baseCurrencyPnl: 246, fxPnl: -120, totalPnlPct: 7.85, sector: 'Consumer Discretionary', country: 'Japan', withholdingTaxRate: 15.315, dividendYield: 2.8 },
  { id: 'h4', symbol: 'BHP.AX', name: 'BHP Group Ltd', exchange: 'ASX', currency: 'AUD', qty: 300, avgCost: 43.20, currentPrice: 49.50, localValue: 14850, localPnl: 1890, localPnlPct: 14.58, baseCurrencyValue: 12920, baseCurrencyPnl: 1645, fxPnl: -210, totalPnlPct: 12.34, sector: 'Materials', country: 'Australia', withholdingTaxRate: 15, dividendYield: 4.2 },
  { id: 'h5', symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', exchange: 'NSE', currency: 'INR', qty: 100, avgCost: 1720, currentPrice: 1965, localValue: 196500, localPnl: 24500, localPnlPct: 14.24, baseCurrencyValue: 3144, baseCurrencyPnl: 392, fxPnl: -45, totalPnlPct: 11.6, sector: 'Financials', country: 'India', withholdingTaxRate: 20, dividendYield: 1.2 },
  { id: 'h6', symbol: '9988.HK', name: 'Alibaba Group', exchange: 'HKEX', currency: 'HKD', qty: 150, avgCost: 79.20, currentPrice: 97.40, localValue: 14610, localPnl: 2730, localPnlPct: 22.98, baseCurrencyValue: 2513, baseCurrencyPnl: 470, fxPnl: -28, totalPnlPct: 21.4, sector: 'Technology', country: 'Hong Kong', withholdingTaxRate: 0, dividendYield: 0 },
  { id: 'h7', symbol: 'M44U.SI', name: 'Mapletree Logistics Trust', exchange: 'SGX', currency: 'SGD', qty: 5000, avgCost: 1.72, currentPrice: 1.58, localValue: 7900, localPnl: -700, localPnlPct: -8.14, baseCurrencyValue: 7900, baseCurrencyPnl: -700, fxPnl: 0, totalPnlPct: -8.14, sector: 'REITs', country: 'Singapore', withholdingTaxRate: 0, dividendYield: 6.8 },
  { id: 'h8', symbol: '9984.T', name: 'SoftBank Group Corp', exchange: 'TSE', currency: 'JPY', qty: 50, avgCost: 8450, currentPrice: 9280, localValue: 464000, localPnl: 41500, localPnlPct: 9.82, baseCurrencyValue: 4176, baseCurrencyPnl: 373, fxPnl: -89, totalPnlPct: 7.9, sector: 'Technology', country: 'Japan', withholdingTaxRate: 15.315, dividendYield: 0.5 },
];

export const MOCK_PORTFOLIO_SUMMARY = {
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
    { country: 'Singapore', value: 27125, pct: 40.3 },
    { country: 'Hong Kong', value: 17154, pct: 25.5 },
    { country: 'Japan', value: 6988, pct: 10.4 },
    { country: 'Australia', value: 12920, pct: 19.2 },
    { country: 'India', value: 3144, pct: 4.7 },
  ],
  bySector: [
    { sector: 'Financials', value: 22369, pct: 33.2 },
    { sector: 'Technology', value: 21330, pct: 31.7 },
    { sector: 'Materials', value: 12920, pct: 19.2 },
    { sector: 'REITs', value: 7900, pct: 11.7 },
    { sector: 'Consumer Discretionary', value: 2812, pct: 4.2 },
  ],
  byCurrency: [
    { currency: 'SGD', value: 27125, pct: 40.3 },
    { currency: 'HKD', value: 17154, pct: 25.5 },
    { currency: 'AUD', value: 12920, pct: 19.2 },
    { currency: 'JPY', value: 6988, pct: 10.4 },
    { currency: 'INR', value: 3144, pct: 4.7 },
  ],
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', symbol: 'D05.SI', name: 'DBS Group', exchange: 'SGX', side: 'buy', qty: 500, price: 32.40, currency: 'SGD', fxRate: 1, baseCurrencyAmount: 16200, fee: 12.50, date: '2024-06-15' },
  { id: 't2', symbol: '0700.HK', name: 'Tencent', exchange: 'HKEX', side: 'buy', qty: 200, price: 315.00, currency: 'HKD', fxRate: 0.171, baseCurrencyAmount: 10773, fee: 18.50, date: '2024-07-22' },
  { id: 't3', symbol: 'BHP.AX', name: 'BHP Group', exchange: 'ASX', side: 'buy', qty: 300, price: 43.20, currency: 'AUD', fxRate: 0.862, baseCurrencyAmount: 11192, fee: 15.00, date: '2024-08-10' },
  { id: 't4', symbol: 'D05.SI', name: 'DBS Group', exchange: 'SGX', side: 'dividend', qty: 500, price: 1.92, currency: 'SGD', fxRate: 1, baseCurrencyAmount: 960, fee: 0, date: '2024-09-03', note: 'Q3 2024 dividend' },
  { id: 't5', symbol: '7203.T', name: 'Toyota Motor', exchange: 'TSE', side: 'buy', qty: 100, price: 2850, currency: 'JPY', fxRate: 0.0089, baseCurrencyAmount: 2537, fee: 8.00, date: '2024-10-18' },
  { id: 't6', symbol: 'HDFCBANK.NS', name: 'HDFC Bank', exchange: 'NSE', side: 'buy', qty: 100, price: 1720, currency: 'INR', fxRate: 0.0161, baseCurrencyAmount: 2769, fee: 5.00, date: '2024-11-05' },
  { id: 't7', symbol: 'M44U.SI', name: 'Mapletree Logistics Trust', exchange: 'SGX', side: 'buy', qty: 5000, price: 1.72, currency: 'SGD', fxRate: 1, baseCurrencyAmount: 8600, fee: 20.00, date: '2024-12-12' },
  { id: 't8', symbol: 'M44U.SI', name: 'Mapletree Logistics Trust', exchange: 'SGX', side: 'dividend', qty: 5000, price: 0.0268, currency: 'SGD', fxRate: 1, baseCurrencyAmount: 134, fee: 0, date: '2025-01-15', note: 'Q4 2024 DPU' },
  { id: 't9', symbol: '9988.HK', name: 'Alibaba Group', exchange: 'HKEX', side: 'buy', qty: 150, price: 79.20, currency: 'HKD', fxRate: 0.172, baseCurrencyAmount: 2044, fee: 12.00, date: '2025-02-28' },
  { id: 't10', symbol: '9984.T', name: 'SoftBank Group', exchange: 'TSE', side: 'buy', qty: 50, price: 8450, currency: 'JPY', fxRate: 0.0089, baseCurrencyAmount: 3760, fee: 8.00, date: '2025-03-15' },
];

export const MOCK_CPF = { oa: 87450, sa: 34200, ma: 18750, ra: 0 };

export const MOCK_GOALS: Goal[] = [
  { id: 'g1', name: 'Retirement at 60', target: 2000000, current: 117331, currency: 'SGD', targetDate: '2045-01-01', color: 'amber' },
  { id: 'g2', name: 'Property Downpayment', target: 200000, current: 67331, currency: 'SGD', targetDate: '2027-06-01', color: 'blue' },
  { id: 'g3', name: "Children's Education", target: 150000, current: 25000, currency: 'SGD', targetDate: '2032-01-01', color: 'emerald' },
];

export const MOCK_PAPER_ORDERS: PaperOrder[] = [
  { id: 'po1', symbol: 'D05.SI', name: 'DBS Group Holdings', exchange: 'SGX', currency: 'SGD', side: 'buy', type: 'limit', qty: 100, price: 37.80, filledQty: 0, status: 'pending', validity: 'GTC', createdAt: '2026-04-05T09:15:00Z', updatedAt: '2026-04-05T09:15:00Z', estimatedValue: 3780, commission: 4.50, isPaper: true },
  { id: 'po2', symbol: '0700.HK', name: 'Tencent Holdings', exchange: 'HKEX', currency: 'HKD', side: 'buy', type: 'limit', qty: 50, price: 410.00, filledQty: 0, status: 'pending', validity: 'GTC', createdAt: '2026-04-06T10:30:00Z', updatedAt: '2026-04-06T10:30:00Z', estimatedValue: 20500, commission: 18.50, isPaper: true },
  { id: 'po3', symbol: 'BHP.AX', name: 'BHP Group', exchange: 'ASX', currency: 'AUD', side: 'sell', type: 'limit', qty: 100, price: 52.00, filledQty: 0, status: 'pending', validity: 'DAY', createdAt: '2026-04-07T02:00:00Z', updatedAt: '2026-04-07T02:00:00Z', estimatedValue: 5200, commission: 15.00, isPaper: true },
  { id: 'po4', symbol: 'HDFCBANK.NS', name: 'HDFC Bank', exchange: 'NSE', currency: 'INR', side: 'buy', type: 'market', qty: 50, price: 1892, filledQty: 50, avgFillPrice: 1894.50, status: 'filled', validity: 'DAY', createdAt: '2026-03-20T04:00:00Z', updatedAt: '2026-03-20T04:01:00Z', estimatedValue: 94725, commission: 5, pnl: 145, isPaper: true },
  { id: 'po5', symbol: '9984.T', name: 'SoftBank Group', exchange: 'TSE', currency: 'JPY', side: 'buy', type: 'market', qty: 20, price: 8920, filledQty: 20, avgFillPrice: 8923, status: 'filled', validity: 'DAY', createdAt: '2026-03-25T01:00:00Z', updatedAt: '2026-03-25T01:01:00Z', estimatedValue: 178460, commission: 8, pnl: 712, isPaper: true },
  { id: 'po6', symbol: 'M44U.SI', name: 'Mapletree Logistics', exchange: 'SGX', currency: 'SGD', side: 'sell', type: 'limit', qty: 2000, price: 1.60, filledQty: 2000, avgFillPrice: 1.60, status: 'filled', validity: 'GTC', createdAt: '2026-04-01T02:15:00Z', updatedAt: '2026-04-01T02:20:00Z', estimatedValue: 3200, commission: 4.50, pnl: -240, isPaper: true },
  { id: 'po7', symbol: 'BHP.AX', name: 'BHP Group', exchange: 'ASX', currency: 'AUD', side: 'buy', type: 'market', qty: 200, price: 48.20, filledQty: 200, avgFillPrice: 48.25, status: 'filled', validity: 'DAY', createdAt: '2026-04-03T00:00:00Z', updatedAt: '2026-04-03T00:01:00Z', estimatedValue: 9650, commission: 15, pnl: 250, isPaper: true },
  { id: 'po8', symbol: 'D05.SI', name: 'DBS Group', exchange: 'SGX', currency: 'SGD', side: 'buy', type: 'limit', qty: 200, price: 37.50, filledQty: 200, avgFillPrice: 37.52, status: 'filled', validity: 'GTC', createdAt: '2026-03-28T01:30:00Z', updatedAt: '2026-03-28T09:00:00Z', estimatedValue: 7504, commission: 12.50, pnl: 186, isPaper: true },
];

export const MOCK_ALERTS: Alert[] = [
  { id: 'a1', symbol: 'D05.SI', name: 'DBS Group', exchange: 'SGX', type: 'price-below', threshold: 36.00, isActive: true, createdAt: '2026-04-01T00:00:00Z' },
  { id: 'a2', symbol: '0700.HK', name: 'Tencent', exchange: 'HKEX', type: 'price-above', threshold: 450.00, isActive: true, createdAt: '2026-04-02T00:00:00Z' },
  { id: 'a3', symbol: 'BHP.AX', name: 'BHP Group', exchange: 'ASX', type: 'price-above', threshold: 52.00, isActive: false, createdAt: '2026-03-15T00:00:00Z', triggeredAt: '2026-04-07T01:30:00Z' },
];

export const MOCK_WATCHLIST: WatchlistItem[] = [
  { id: 'w1', symbol: 'OCBC.SI', name: 'OCBC Bank', exchange: 'SGX', currency: 'SGD', addedAt: '2026-03-10T00:00:00Z', currentPrice: 14.82, change: 0.12, changePercent: 0.82 },
  { id: 'w2', symbol: '1299.HK', name: 'AIA Group', exchange: 'HKEX', currency: 'HKD', addedAt: '2026-03-15T00:00:00Z', currentPrice: 68.45, change: -0.55, changePercent: -0.80 },
  { id: 'w3', symbol: '6758.T', name: 'Sony Group Corp', exchange: 'TSE', currency: 'JPY', addedAt: '2026-03-20T00:00:00Z', currentPrice: 12450, change: 234, changePercent: 1.92 },
  { id: 'w4', symbol: 'CBA.AX', name: 'Commonwealth Bank', exchange: 'ASX', currency: 'AUD', addedAt: '2026-03-22T00:00:00Z', currentPrice: 138.50, change: -1.20, changePercent: -0.86 },
  { id: 'w5', symbol: 'Z74.SI', name: 'Singtel', exchange: 'SGX', currency: 'SGD', addedAt: '2026-04-01T00:00:00Z', currentPrice: 2.84, change: 0.06, changePercent: 2.16 },
];

export const MOCK_ADVISORS_CLIENTS: AdvisorClient[] = [
  { id: 'c1', name: 'Wei Liang Tan', baseCurrency: 'SGD', aum: 524780, dayChange: 312.45, dayChangePct: 0.06, ytdReturn: 8.34, riskProfile: 'Moderate Growth', lastReview: '2026-03-01' },
  { id: 'c2', name: 'Priya Sharma', baseCurrency: 'SGD', aum: 1240000, dayChange: -2340, dayChangePct: -0.19, ytdReturn: 12.45, riskProfile: 'Aggressive Growth', lastReview: '2026-02-15' },
  { id: 'c3', name: 'James Woo', baseCurrency: 'HKD', aum: 8500000, dayChange: 34500, dayChangePct: 0.41, ytdReturn: 6.78, riskProfile: 'Conservative', lastReview: '2026-03-20' },
  { id: 'c4', name: 'Ananya Krishnan', baseCurrency: 'SGD', aum: 320000, dayChange: 780, dayChangePct: 0.24, ytdReturn: 15.23, riskProfile: 'Moderate Growth', lastReview: '2026-01-30' },
  { id: 'c5', name: 'Robert Chen', baseCurrency: 'AUD', aum: 2100000, dayChange: -8900, dayChangePct: -0.42, ytdReturn: 4.12, riskProfile: 'Balanced', lastReview: '2026-03-10' },
];

export const MOCK_NEWS: NewsItem[] = [
  { id: 'n1', title: 'DBS Group Reports Record Q1 2026 Profits Amid Strong Regional Lending', source: 'The Business Times', url: 'https://finance.yahoo.com/quote/D05.SI/news/', publishedAt: '2026-04-07T02:00:00Z', summary: 'DBS Group Holdings reported a 15% year-on-year increase in net profit for Q1 2026, driven by strong net interest income and wealth management fee growth across Southeast Asia.', sentiment: 'positive', tags: ['DBS', 'Financials', 'Singapore'], country: 'SG' },
  { id: 'n2', title: 'Hang Seng Index Rallies 2.3% as China Unveils New Stimulus Package', source: 'South China Morning Post', url: 'https://finance.yahoo.com/quote/%5EHSI/news/', publishedAt: '2026-04-07T01:30:00Z', summary: 'Hong Kong markets surged as Beijing announced a CNY 2 trillion infrastructure spending package targeting green energy and semiconductor supply chains.', sentiment: 'positive', tags: ['HSI', 'China', 'Stimulus'], country: 'HK' },
  { id: 'n3', title: 'Bank of Japan Maintains Ultra-Low Rates, Signals Gradual Normalisation', source: 'Nikkei Asia', url: 'https://finance.yahoo.com/quote/%5EN225/news/', publishedAt: '2026-04-06T08:00:00Z', summary: 'The Bank of Japan kept its policy rate unchanged at 0.1% but indicated that conditions for further tightening may emerge if inflation sustainably reaches the 2% target.', sentiment: 'neutral', tags: ['BOJ', 'Japan', 'Rates'], country: 'JP' },
  { id: 'n4', title: 'RBA Holds Cash Rate at 4.10% as Australian Inflation Eases to 3.2%', source: 'Australian Financial Review', url: 'https://finance.yahoo.com/quote/%5EAXJO/news/', publishedAt: '2026-04-06T05:30:00Z', summary: 'The Reserve Bank of Australia left its benchmark rate unchanged, citing encouraging progress on inflation while flagging risks from weakening Chinese demand for iron ore.', sentiment: 'neutral', tags: ['RBA', 'Australia', 'Rates'], country: 'AU' },
  { id: 'n5', title: 'Tencent Beats Q1 Revenue Forecasts on Gaming and AI Cloud Recovery', source: 'Reuters', url: 'https://finance.yahoo.com/quote/TCEHY/news/', publishedAt: '2026-04-05T12:00:00Z', summary: 'Tencent reported Q1 revenues up 18% year-on-year, with domestic gaming revenue surging 24% on the back of blockbuster mobile titles and expanding international game portfolio.', sentiment: 'positive', tags: ['Tencent', 'Technology', 'Hong Kong'], country: 'HK' },
  { id: 'n6', title: 'Singapore REITs Face Pressure as Office Vacancies Rise in CBD', source: 'The Straits Times', url: 'https://finance.yahoo.com/quote/SE/news/', publishedAt: '2026-04-05T04:00:00Z', summary: 'S-REIT managers flagged challenges in the office sub-sector as Central Business District vacancy rates reached 7.2%, the highest since 2021, driven by hybrid work adoption.', sentiment: 'negative', tags: ['REITs', 'Singapore', 'Real Estate'], country: 'SG' },
  { id: 'n7', title: 'India Nifty Hits Record High on Foreign Institutional Investor Inflows', source: 'Economic Times', url: 'https://finance.yahoo.com/quote/INFY/news/', publishedAt: '2026-04-04T10:00:00Z', summary: 'The NSE Nifty 50 Index surpassed 22,500 for the first time as foreign investors poured $4.2 billion into Indian equities in March, attracted by strong GDP growth forecasts.', sentiment: 'positive', tags: ['Nifty', 'India', 'FII'], country: 'IN' },
  { id: 'n8', title: 'BHP Ships Record Iron Ore Volume to China Ahead of Stimulus Rollout', source: 'Bloomberg', url: 'https://finance.yahoo.com/quote/BHP/news/', publishedAt: '2026-04-04T02:00:00Z', summary: "BHP Group reported record quarterly iron ore shipments of 68.9 million tonnes from its Pilbara operations, positioning the miner to benefit from China's infrastructure push.", sentiment: 'positive', tags: ['BHP', 'Mining', 'Australia'], country: 'AU' },
  { id: 'n9', title: 'MAS Maintains SGD NEER Policy Band, Cites Contained Inflation Outlook', source: 'Channel NewsAsia', url: 'https://finance.yahoo.com/quote/GRAB/news/', publishedAt: '2026-04-03T08:00:00Z', summary: 'The Monetary Authority of Singapore kept its Singapore Dollar Nominal Effective Exchange Rate policy unchanged at its April meeting, projecting core inflation to ease to 1.5-2.5% for 2026.', sentiment: 'neutral', tags: ['MAS', 'SGD', 'Monetary Policy'], country: 'SG' },
  { id: 'n10', title: 'ASEAN Fintech Funding Rebounds 34% in Q1 2026 Despite Global Headwinds', source: 'Tech in Asia', url: 'https://finance.yahoo.com/quote/SE/news/', publishedAt: '2026-04-02T06:00:00Z', summary: 'Venture capital investment in Southeast Asian fintech startups reached $1.8 billion in Q1 2026, led by Singapore-based wealth management and payments platforms capturing cross-border flows.', sentiment: 'positive', tags: ['Fintech', 'ASEAN', 'Venture Capital'], country: 'SG' },
];
