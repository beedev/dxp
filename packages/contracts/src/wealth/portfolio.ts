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
  dividendYield?: number;
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
  byCountry: Array<{ country: string; value: number; pct: number }>;
  bySector: Array<{ sector: string; value: number; pct: number }>;
  byCurrency: Array<{ currency: string; value: number; pct: number }>;
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

export interface PortfolioFilters {
  exchange?: string;
  sector?: string;
  currency?: string;
  assetClass?: string;
  region?: string;
}
