export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  addedAt: string;
  notes?: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}
