// POS Connector Port — the contract that all POS adapters must implement.

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

export interface Transaction {
  id: string;
  storeId: string;
  timestamp: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  total: number;
  paymentMethod: string;
}

export abstract class PosConnectorPort {
  abstract getDailySales(storeId: string, date: string): Promise<DailySales>;
  abstract getSalesRange(storeId: string, from: string, to: string): Promise<DailySales[]>;
  abstract getCategoryBreakdown(storeId: string): Promise<CategoryBreakdown[]>;
  abstract getTopSellers(storeId: string): Promise<TopSeller[]>;
  abstract getTransactions(storeId: string, date: string): Promise<Transaction[]>;
}
