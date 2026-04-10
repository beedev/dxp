import { Injectable, Logger } from '@nestjs/common';
import { StockQuote, ApacIndex, SymbolSearchResult, PriceBar } from '@dxp/contracts';
import { MarketDataPort } from '../ports/market-data.port';

// Compute whether a market is currently open based on UTC hour ranges
function isExchangeOpen(utcOpenHour: number, utcCloseHour: number): boolean {
  const hour = new Date().getUTCHours();
  if (utcOpenHour < utcCloseHour) {
    return hour >= utcOpenHour && hour < utcCloseHour;
  }
  return hour >= utcOpenHour || hour < utcCloseHour;
}

const MOCK_INDICES: ApacIndex[] = [
  { symbol: '^HSI',    name: 'Hang Seng Index',           exchange: 'HKEX',  country: 'Hong Kong',  flag: '🇭🇰', timezone: 'Asia/Hong_Kong',      sessionOpen: '09:30', sessionClose: '16:00', value: 19842.23, change: -67.89,  changePercent: -0.34, isMarketOpen: isExchangeOpen(1, 8) },
  { symbol: '^N225',   name: 'Nikkei 225',                exchange: 'TSE',   country: 'Japan',      flag: '🇯🇵', timezone: 'Asia/Tokyo',           sessionOpen: '09:00', sessionClose: '15:30', value: 35210.45, change: 304.23, changePercent: 0.87,  isMarketOpen: isExchangeOpen(0, 6) },
  { symbol: '^AXJO',   name: 'S&P/ASX 200',              exchange: 'ASX',   country: 'Australia',  flag: '🇦🇺', timezone: 'Australia/Sydney',     sessionOpen: '10:00', sessionClose: '16:00', value: 7834.56,  change: 17.92,  changePercent: 0.23,  isMarketOpen: isExchangeOpen(23, 6) },
  { symbol: '^STI',    name: 'Straits Times Index',       exchange: 'SGX',   country: 'Singapore',  flag: '🇸🇬', timezone: 'Asia/Singapore',      sessionOpen: '09:00', sessionClose: '17:00', value: 3421.78,  change: -4.11,  changePercent: -0.12, isMarketOpen: isExchangeOpen(1, 9) },
  { symbol: '^KS11',   name: 'KOSPI',                    exchange: 'KRX',   country: 'South Korea', flag: '🇰🇷', timezone: 'Asia/Seoul',          sessionOpen: '09:00', sessionClose: '15:30', value: 2678.34,  change: 29.78,  changePercent: 1.12,  isMarketOpen: isExchangeOpen(0, 6) },
  { symbol: '^BSESN',  name: 'BSE Sensex',               exchange: 'BSE',   country: 'India',      flag: '🇮🇳', timezone: 'Asia/Kolkata',         sessionOpen: '09:15', sessionClose: '15:30', value: 72453.22, change: -327.89, changePercent: -0.45, isMarketOpen: isExchangeOpen(3, 10) },
  { symbol: '^NSEI',   name: 'NIFTY 50',                 exchange: 'NSE',   country: 'India',      flag: '🇮🇳', timezone: 'Asia/Kolkata',         sessionOpen: '09:15', sessionClose: '15:30', value: 21934.56, change: -83.45, changePercent: -0.38, isMarketOpen: isExchangeOpen(3, 10) },
  { symbol: '^KLSE',   name: 'FTSE Bursa Malaysia KLCI', exchange: 'BURSA', country: 'Malaysia',   flag: '🇲🇾', timezone: 'Asia/Kuala_Lumpur',   sessionOpen: '09:00', sessionClose: '17:00', value: 1567.89,  change: 5.34,   changePercent: 0.34,  isMarketOpen: isExchangeOpen(1, 9) },
  { symbol: '^SET.BK', name: 'SET Index',                exchange: 'SET',   country: 'Thailand',   flag: '🇹🇭', timezone: 'Asia/Bangkok',         sessionOpen: '10:00', sessionClose: '16:30', value: 1389.23,  change: -9.34,  changePercent: -0.67, isMarketOpen: isExchangeOpen(3, 9) },
  { symbol: '^JKSE',   name: 'Jakarta Composite Index',  exchange: 'IDX',   country: 'Indonesia',  flag: '🇮🇩', timezone: 'Asia/Jakarta',         sessionOpen: '09:00', sessionClose: '16:00', value: 7234.56,  change: 63.89,  changePercent: 0.89,  isMarketOpen: isExchangeOpen(2, 9) },
  { symbol: '^TWII',   name: 'Taiwan Weighted Index',    exchange: 'TWSE',  country: 'Taiwan',     flag: '🇹🇼', timezone: 'Asia/Taipei',          sessionOpen: '09:00', sessionClose: '13:30', value: 19876.34, change: 284.56, changePercent: 1.45,  isMarketOpen: isExchangeOpen(1, 5) },
  { symbol: '000001.SS', name: 'SSE Composite Index',   exchange: 'SSE',   country: 'China',      flag: '🇨🇳', timezone: 'Asia/Shanghai',        sessionOpen: '09:30', sessionClose: '15:00', value: 3178.45,  change: -7.34,  changePercent: -0.23, isMarketOpen: isExchangeOpen(1, 7) },
];

const MOCK_QUOTES: Record<string, StockQuote> = {
  'D05.SI': {
    symbol: 'D05.SI', name: 'DBS Group Holdings Ltd', exchange: 'SGX', currency: 'SGD',
    price: 38.45, change: 0.32, changePercent: 0.84, volume: 3_421_567,
    marketCap: 98_234_560_000, high52w: 40.12, low52w: 30.20, pe: 12.4, dividendYield: 5.1,
    isMarketOpen: isExchangeOpen(1, 9), lastUpdated: new Date().toISOString(),
  },
  '0700.HK': {
    symbol: '0700.HK', name: 'Tencent Holdings Ltd', exchange: 'HKEX', currency: 'HKD',
    price: 425.60, change: 5.80, changePercent: 1.38, volume: 12_345_678,
    marketCap: 4_089_000_000_000, high52w: 468.20, low52w: 289.40, pe: 21.3, dividendYield: 0.8,
    isMarketOpen: isExchangeOpen(1, 8), lastUpdated: new Date().toISOString(),
  },
  '7203.T': {
    symbol: '7203.T', name: 'Toyota Motor Corporation', exchange: 'TSE', currency: 'JPY',
    price: 3124.00, change: 45.00, changePercent: 1.46, volume: 8_765_432,
    marketCap: 45_678_900_000_000, high52w: 3456.00, low52w: 2234.00, pe: 9.8, dividendYield: 2.3,
    isMarketOpen: isExchangeOpen(0, 6), lastUpdated: new Date().toISOString(),
  },
  'BHP.AX': {
    symbol: 'BHP.AX', name: 'BHP Group Ltd', exchange: 'ASX', currency: 'AUD',
    price: 49.50, change: -0.34, changePercent: -0.68, volume: 5_234_567,
    marketCap: 248_900_000_000, high52w: 56.78, low52w: 41.23, pe: 14.2, dividendYield: 4.7,
    isMarketOpen: isExchangeOpen(23, 6), lastUpdated: new Date().toISOString(),
  },
  'HDFCBANK.NS': {
    symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', exchange: 'NSE', currency: 'INR',
    price: 1965.00, change: 22.50, changePercent: 1.16, volume: 6_789_012,
    marketCap: 10_987_654_000_000, high52w: 1990.00, low52w: 1425.00, pe: 18.7, dividendYield: 1.2,
    isMarketOpen: isExchangeOpen(3, 10), lastUpdated: new Date().toISOString(),
  },
  '9988.HK': {
    symbol: '9988.HK', name: 'Alibaba Group Holding Ltd', exchange: 'HKEX', currency: 'HKD',
    price: 97.40, change: 1.80, changePercent: 1.88, volume: 23_456_789,
    marketCap: 2_098_765_000_000, high52w: 121.00, low52w: 66.00, pe: 15.6, dividendYield: 0.0,
    isMarketOpen: isExchangeOpen(1, 8), lastUpdated: new Date().toISOString(),
  },
  'M44U.SI': {
    symbol: 'M44U.SI', name: 'Mapletree Pan Asia Commercial Trust', exchange: 'SGX', currency: 'SGD',
    price: 1.58, change: -0.03, changePercent: -1.86, volume: 12_345_678,
    marketCap: 6_789_012_000, high52w: 1.89, low52w: 1.45, pe: 0.0, dividendYield: 7.8,
    isMarketOpen: isExchangeOpen(1, 9), lastUpdated: new Date().toISOString(),
  },
  '9984.T': {
    symbol: '9984.T', name: 'SoftBank Group Corp', exchange: 'TSE', currency: 'JPY',
    price: 9280.00, change: 234.00, changePercent: 2.59, volume: 4_567_890,
    marketCap: 15_987_654_000_000, high52w: 10234.00, low52w: 6543.00, pe: 0.0, dividendYield: 0.5,
    isMarketOpen: isExchangeOpen(0, 6), lastUpdated: new Date().toISOString(),
  },
};

const MOCK_SEARCH_RESULTS: SymbolSearchResult[] = [
  { symbol: '7203.T',  name: 'Toyota Motor Corporation',    type: 'Equity', exchange: 'TSE',   currency: 'JPY', country: 'Japan' },
  { symbol: '7267.T',  name: 'Honda Motor Co Ltd',          type: 'Equity', exchange: 'TSE',   currency: 'JPY', country: 'Japan' },
  { symbol: 'D05.SI',  name: 'DBS Group Holdings Ltd',      type: 'Equity', exchange: 'SGX',   currency: 'SGD', country: 'Singapore' },
  { symbol: '0700.HK', name: 'Tencent Holdings Ltd',        type: 'Equity', exchange: 'HKEX',  currency: 'HKD', country: 'Hong Kong' },
  { symbol: 'BHP.AX',  name: 'BHP Group Ltd',               type: 'Equity', exchange: 'ASX',   currency: 'AUD', country: 'Australia' },
  { symbol: '9988.HK', name: 'Alibaba Group Holding Ltd',   type: 'Equity', exchange: 'HKEX',  currency: 'HKD', country: 'Hong Kong' },
  { symbol: 'M44U.SI', name: 'Mapletree Pan Asia Commercial Trust', type: 'REIT', exchange: 'SGX', currency: 'SGD', country: 'Singapore' },
  { symbol: '9984.T',  name: 'SoftBank Group Corp',         type: 'Equity', exchange: 'TSE',   currency: 'JPY', country: 'Japan' },
  { symbol: '2330.TW', name: 'Taiwan Semiconductor Manufacturing', type: 'Equity', exchange: 'TWSE', currency: 'TWD', country: 'Taiwan' },
  { symbol: 'CBA.AX',  name: 'Commonwealth Bank of Australia', type: 'Equity', exchange: 'ASX', currency: 'AUD', country: 'Australia' },
];

@Injectable()
export class MockMarketAdapter extends MarketDataPort {
  private readonly logger = new Logger(MockMarketAdapter.name);

  async getQuote(symbol: string): Promise<StockQuote> {
    const quote = MOCK_QUOTES[symbol];
    if (quote) {
      return { ...quote, lastUpdated: new Date().toISOString() };
    }
    // Generate a plausible mock for unknown symbols
    this.logger.warn(`No mock data for ${symbol}, generating placeholder`);
    return {
      symbol,
      name: symbol,
      exchange: 'UNKNOWN',
      currency: 'USD',
      price: 100.00,
      change: 0.50,
      changePercent: 0.50,
      volume: 1_000_000,
      isMarketOpen: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getQuotes(symbols: string[]): Promise<StockQuote[]> {
    return Promise.all(symbols.map(s => this.getQuote(s)));
  }

  async getApacIndices(): Promise<ApacIndex[]> {
    return MOCK_INDICES.map(idx => ({ ...idx, isMarketOpen: this.recomputeOpen(idx) }));
  }

  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const q = query.toLowerCase();
    return MOCK_SEARCH_RESULTS.filter(
      r => r.symbol.toLowerCase().includes(q) || r.name.toLowerCase().includes(q),
    );
  }

  async getPriceHistory(symbol: string, range: string): Promise<PriceBar[]> {
    const days = this.rangeToDays(range);
    const bars: PriceBar[] = [];
    const quote = await this.getQuote(symbol);
    let price = quote.price * 0.85; // start ~15% below current
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const dayReturn = (Math.random() - 0.48) * 0.025; // slight upward drift
      const open = price;
      const close = parseFloat((price * (1 + dayReturn)).toFixed(2));
      const high = parseFloat((Math.max(open, close) * (1 + Math.random() * 0.01)).toFixed(2));
      const low = parseFloat((Math.min(open, close) * (1 - Math.random() * 0.01)).toFixed(2));
      bars.push({
        date: date.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 5_000_000) + 1_000_000,
      });
      price = close;
    }
    return bars;
  }

  private recomputeOpen(idx: ApacIndex): boolean {
    // Re-evaluate at call time using the stored session hours
    const [openH] = idx.sessionOpen.split(':').map(Number);
    const [closeH] = idx.sessionClose.split(':').map(Number);
    // Approximate UTC offset by timezone name
    const tzOffsets: Record<string, number> = {
      'Asia/Hong_Kong': 8, 'Asia/Tokyo': 9, 'Australia/Sydney': 10,
      'Asia/Singapore': 8, 'Asia/Seoul': 9, 'Asia/Kolkata': 5,
      'Asia/Kuala_Lumpur': 8, 'Asia/Bangkok': 7, 'Asia/Jakarta': 7,
      'Asia/Taipei': 8, 'Asia/Shanghai': 8,
    };
    const offset = tzOffsets[idx.timezone] ?? 8;
    const utcOpen = (openH - offset + 24) % 24;
    const utcClose = (closeH - offset + 24) % 24;
    const utcHour = new Date().getUTCHours();
    if (utcOpen < utcClose) return utcHour >= utcOpen && utcHour < utcClose;
    return utcHour >= utcOpen || utcHour < utcClose;
  }

  private rangeToDays(range: string): number {
    const map: Record<string, number> = { '1m': 30, '3m': 90, '6m': 180, '1y': 365, '5y': 1825 };
    return map[range] ?? 30;
  }
}
