export interface StockQuote {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high52w?: number;
  low52w?: number;
  pe?: number;
  dividendYield?: number;
  isMarketOpen: boolean;
  lastUpdated: string;
}

export interface ApacIndex {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  flag: string;
  timezone: string;
  sessionOpen: string;
  sessionClose: string;
  value: number;
  change: number;
  changePercent: number;
  isMarketOpen: boolean;
}

export interface PriceBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  currency: string;
  country: string;
}

export interface MarketDataFilters {
  exchange?: string;
  limit?: number;
}
