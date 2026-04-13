export interface StockLevel {
  productId: string;
  storeId: string;
  quantity: number;
  reorderPoint: number;
  aisle: string;
  bin: string;
  lastCounted: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

export interface StockAlert {
  productId: string;
  productName: string;
  storeId: string;
  currentQty: number;
  reorderPoint: number;
}
