import { products } from './mock-products';

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

// Aisle/bin assignments by category
const aisleMap: Record<string, { aisle: string; bins: string[] }> = {
  paint: { aisle: 'A', bins: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'] },
  tools: { aisle: 'B', bins: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'] },
  plumbing: { aisle: 'C', bins: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'] },
  electrical: { aisle: 'D', bins: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'] },
  outdoor: { aisle: 'E', bins: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8'] },
  hardware: { aisle: 'F', bins: ['F1', 'F2', 'F3', 'F4'] },
  seasonal: { aisle: 'G', bins: ['G1', 'G2'] },
};

// Out of stock product IDs (5)
const outOfStockIds = new Set(['P007', 'PL007', 'E004', 'O002', 'H004']);

// Low stock product IDs (8)
const lowStockIds = new Set(['P003', 'T005', 'PL002', 'E003', 'E008', 'O006', 'H001', 'H006']);

// Quantities for specific products
const qtyOverrides: Record<string, number> = {
  // Out of stock
  P007: 0, PL007: 0, E004: 0, O002: 0, H004: 0,
  // Low stock
  P003: 2, T005: 3, PL002: 3, E003: 4, E008: 5, O006: 2, H001: 6, H006: 4,
  // High stock items
  P001: 145, P002: 42, P004: 38, P005: 67, P006: 23, P008: 55, P009: 31, P010: 128,
  T001: 18, T002: 12, T003: 89, T004: 7, T006: 15, T007: 9, T008: 72, T009: 6, T010: 14,
  PL001: 8, PL003: 95, PL004: 120, PL005: 34, PL006: 28, PL008: 19,
  E001: 85, E002: 11, E005: 47, E006: 22, E007: 63,
  O001: 4, O003: 26, O004: 41, O005: 13, O007: 9, O008: 56,
  H002: 110, H003: 150, H005: 38,
};

const reorderPoints: Record<string, number> = {
  P001: 20, P002: 10, P003: 10, P004: 8, P005: 12, P006: 8, P007: 5, P008: 10, P009: 8, P010: 20,
  T001: 5, T002: 5, T003: 15, T004: 3, T005: 5, T006: 5, T007: 3, T008: 10, T009: 3, T010: 5,
  PL001: 3, PL002: 8, PL003: 15, PL004: 20, PL005: 8, PL006: 5, PL007: 3, PL008: 5,
  E001: 15, E002: 5, E003: 15, E004: 5, E005: 10, E006: 5, E007: 10, E008: 8,
  O001: 2, O002: 2, O003: 5, O004: 8, O005: 5, O006: 5, O007: 3, O008: 10,
  H001: 8, H002: 15, H003: 20, H004: 3, H005: 8, H006: 8,
};

// Date offsets for last counted (days ago)
const countedDaysAgo: Record<string, number> = {
  P001: 2, P002: 5, P003: 1, P004: 7, P005: 3, P006: 12, P007: 1, P008: 8, P009: 4, P010: 2,
  T001: 3, T002: 6, T003: 1, T004: 14, T005: 2, T006: 9, T007: 5, T008: 1, T009: 11, T010: 4,
  PL001: 7, PL002: 1, PL003: 3, PL004: 2, PL005: 10, PL006: 6, PL007: 1, PL008: 8,
  E001: 2, E002: 4, E003: 1, E004: 1, E005: 5, E006: 9, E007: 3, E008: 2,
  O001: 6, O002: 1, O003: 4, O004: 3, O005: 7, O006: 1, O007: 12, O008: 2,
  H001: 2, H002: 1, H003: 5, H004: 1, H005: 8, H006: 3,
};

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export const stockLevels: StockLevel[] = products.map((p, idx) => {
  const cat = aisleMap[p.category] || aisleMap['hardware'];
  const qty = qtyOverrides[p.id] ?? Math.round(20 + Math.random() * 80);
  const reorder = reorderPoints[p.id] ?? 10;

  let status: StockLevel['status'] = 'in-stock';
  if (outOfStockIds.has(p.id)) status = 'out-of-stock';
  else if (lowStockIds.has(p.id)) status = 'low-stock';

  return {
    productId: p.id,
    storeId: 'S001',
    quantity: qty,
    reorderPoint: reorder,
    aisle: cat.aisle,
    bin: cat.bins[idx % cat.bins.length],
    lastCounted: daysAgoISO(countedDaysAgo[p.id] ?? 7),
    status,
  };
});

export const stockAlerts: StockAlert[] = stockLevels
  .filter((s) => s.status === 'low-stock' || s.status === 'out-of-stock')
  .map((s) => {
    const product = products.find((p) => p.id === s.productId);
    return {
      productId: s.productId,
      productName: product?.name || s.productId,
      storeId: s.storeId,
      currentQty: s.quantity,
      reorderPoint: s.reorderPoint,
    };
  });
