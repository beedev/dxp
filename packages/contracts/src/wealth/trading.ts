export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop-limit';
export type OrderStatus = 'pending' | 'partial' | 'filled' | 'cancelled' | 'rejected';
export type OrderValidity = 'DAY' | 'GTC' | 'GTD';

export interface Order {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  price?: number;
  stopPrice?: number;
  filledQty: number;
  avgFillPrice?: number;
  status: OrderStatus;
  validity: OrderValidity;
  createdAt: string;
  updatedAt: string;
  estimatedValue: number;
  commission: number;
  pnl?: number;
  isPaper: boolean;
}

export interface PlaceOrderRequest {
  symbol: string;
  exchange: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  price?: number;
  stopPrice?: number;
  validity: OrderValidity;
}

export interface PaperPortfolio {
  cashBalance: number;
  totalValue: number;
  totalPnl: number;
  currency: string;
}

export interface Alert {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  type: 'price-above' | 'price-below' | 'volume-spike' | 'news';
  threshold?: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export interface CreateAlertRequest {
  symbol: string;
  exchange: string;
  type: Alert['type'];
  threshold?: number;
}
