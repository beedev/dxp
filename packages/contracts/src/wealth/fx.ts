export type ApacCurrency =
  | 'SGD'
  | 'HKD'
  | 'JPY'
  | 'AUD'
  | 'NZD'
  | 'CNY'
  | 'KRW'
  | 'INR'
  | 'MYR'
  | 'THB'
  | 'IDR'
  | 'PHP'
  | 'TWD'
  | 'VND';

export interface FxRate {
  base: string;
  target: string;
  rate: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export interface FxRatesSnapshot {
  base: string;
  rates: Record<string, number>;
  timestamp: string;
}

export interface FxConvertResult {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
}

export interface SgdRate {
  currency: string;
  name: string;
  buyRate: number;
  sellRate: number;
  date: string;
}
