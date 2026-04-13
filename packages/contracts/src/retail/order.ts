export type RetailOrderStatus = 'processing' | 'ready-for-pickup' | 'shipped' | 'delivered' | 'returned' | 'cancelled';

export interface RetailOrderItem { productId: string; name: string; quantity: number; price: number; }

export interface RetailOrder {
  id: string; date: string; status: RetailOrderStatus; items: RetailOrderItem[];
  subtotal: number; tax: number; total: number;
  deliveryMethod: 'pickup' | 'delivery'; storeId?: string;
  trackingNumber?: string;
}
