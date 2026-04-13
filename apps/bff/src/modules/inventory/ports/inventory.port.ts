// Inventory Port — the contract that all inventory adapters must implement.

export interface InventoryProduct {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  price: number;
}

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

export interface ProductQuery {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductList {
  data: InventoryProduct[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdjustStockDto {
  quantity: number;
  reason: string;
}

export abstract class InventoryPort {
  abstract listProducts(query: ProductQuery): Promise<ProductList>;
  abstract getProduct(id: string): Promise<InventoryProduct>;
  abstract getStockLevels(storeId: string): Promise<StockLevel[]>;
  abstract barcodeLookup(code: string): Promise<InventoryProduct | null>;
  abstract adjustStock(storeId: string, productId: string, dto: AdjustStockDto): Promise<StockLevel>;
}
