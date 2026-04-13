import { Injectable, Logger } from '@nestjs/common';
import {
  InventoryPort,
  InventoryProduct,
  StockLevel,
  ProductQuery,
  ProductList,
  AdjustStockDto,
} from '../ports/inventory.port';

const mockProducts: InventoryProduct[] = [
  { id: 'T001', sku: 'DW-DRL-20V', barcode: '885911478700', name: 'DeWalt 20V MAX Drill/Driver Kit', category: 'tools', brand: 'DeWalt', price: 99.00 },
  { id: 'P002', sku: 'BM-REGAL-WH', barcode: '023906735012', name: 'Benjamin Moore Regal Select Interior', category: 'paint', brand: 'Benjamin Moore', price: 62.99 },
  { id: 'PL001', sku: 'MN-FAU-ARC', barcode: '026508206515', name: 'Moen Arbor Pull-Down Kitchen Faucet', category: 'plumbing', brand: 'Moen', price: 309.00 },
];

const mockStock: StockLevel[] = [
  { productId: 'T001', storeId: 'S001', quantity: 18, reorderPoint: 5, aisle: 'B', bin: 'B1', lastCounted: '2026-04-07', status: 'in-stock' },
  { productId: 'P002', storeId: 'S001', quantity: 42, reorderPoint: 10, aisle: 'A', bin: 'A2', lastCounted: '2026-04-05', status: 'in-stock' },
  { productId: 'PL001', storeId: 'S001', quantity: 3, reorderPoint: 5, aisle: 'C', bin: 'C1', lastCounted: '2026-04-03', status: 'low-stock' },
];

@Injectable()
export class MockInventoryAdapter extends InventoryPort {
  private readonly logger = new Logger(MockInventoryAdapter.name);

  async listProducts(query: ProductQuery): Promise<ProductList> {
    let filtered = [...mockProducts];
    if (query.search) {
      const q = query.search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (query.category) {
      filtered = filtered.filter((p) => p.category === query.category);
    }
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    return { data: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize };
  }

  async getProduct(id: string): Promise<InventoryProduct> {
    const product = mockProducts.find((p) => p.id === id);
    if (!product) throw new Error(`Product ${id} not found`);
    return product;
  }

  async getStockLevels(storeId: string): Promise<StockLevel[]> {
    return mockStock.filter((s) => s.storeId === storeId);
  }

  async barcodeLookup(code: string): Promise<InventoryProduct | null> {
    return mockProducts.find((p) => p.barcode === code) || null;
  }

  async adjustStock(storeId: string, productId: string, dto: AdjustStockDto): Promise<StockLevel> {
    const stock = mockStock.find((s) => s.storeId === storeId && s.productId === productId);
    if (!stock) throw new Error(`Stock record not found for ${storeId}/${productId}`);
    stock.quantity += dto.quantity;
    stock.status = stock.quantity <= 0 ? 'out-of-stock' : stock.quantity <= stock.reorderPoint ? 'low-stock' : 'in-stock';
    return stock;
  }
}
