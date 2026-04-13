export interface DailySales {
  date: string;
  storeId: string;
  revenue: number;
  transactions: number;
  avgTicket: number;
}

export interface CategoryBreakdown {
  category: string;
  revenue: number;
  units: number;
  pctOfTotal: number;
}

export interface TopSeller {
  productId: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
}
