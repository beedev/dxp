export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  phone: string;
  category: string;
  leadTimeDays: number;
  qualityScore: number;
  onTimeRate: number;
  status: 'active' | 'probation' | 'suspended';
}

export interface POItem {
  sku: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: POItem[];
  totalAmount: number;
  status: 'draft' | 'submitted' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdDate: string;
  expectedDelivery: string;
}

export interface VendorScorecard {
  supplierId: string;
  supplierName: string;
  qualityScore: number;
  deliveryScore: number;
  priceCompetitiveness: number;
  responsiveness: number;
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
}

export const suppliers: Supplier[] = [
  { id: 'SUP01', name: 'Stanley Black & Decker', contactEmail: 'orders@sbd.com', phone: '(860) 225-5111', category: 'Tools', leadTimeDays: 7, qualityScore: 94, onTimeRate: 96.2, status: 'active' },
  { id: 'SUP02', name: 'Moen Inc.', contactEmail: 'wholesale@moen.com', phone: '(800) 289-6636', category: 'Plumbing', leadTimeDays: 10, qualityScore: 92, onTimeRate: 94.8, status: 'active' },
  { id: 'SUP03', name: 'Rust-Oleum Corporation', contactEmail: 'sales@rustoleum.com', phone: '(800) 553-8444', category: 'Paint', leadTimeDays: 5, qualityScore: 91, onTimeRate: 97.1, status: 'active' },
  { id: 'SUP04', name: '3M Company', contactEmail: 'b2b@3m.com', phone: '(888) 364-3577', category: 'Hardware', leadTimeDays: 6, qualityScore: 96, onTimeRate: 98.0, status: 'active' },
  { id: 'SUP05', name: 'Leviton Manufacturing', contactEmail: 'orders@leviton.com', phone: '(800) 323-8920', category: 'Electrical', leadTimeDays: 8, qualityScore: 90, onTimeRate: 93.5, status: 'active' },
  { id: 'SUP06', name: 'Weber-Stephen Products', contactEmail: 'wholesale@weber.com', phone: '(800) 446-1071', category: 'Outdoor', leadTimeDays: 12, qualityScore: 93, onTimeRate: 91.2, status: 'active' },
  { id: 'SUP07', name: 'Scotts Miracle-Gro', contactEmail: 'commercial@scotts.com', phone: '(888) 270-3714', category: 'Outdoor', leadTimeDays: 9, qualityScore: 88, onTimeRate: 89.5, status: 'probation' },
  { id: 'SUP08', name: 'Simpson Strong-Tie', contactEmail: 'sales@strongtie.com', phone: '(800) 999-5099', category: 'Hardware', leadTimeDays: 7, qualityScore: 95, onTimeRate: 97.8, status: 'active' },
  { id: 'SUP09', name: 'DAP Products', contactEmail: 'orders@dap.com', phone: '(800) 543-3840', category: 'Paint', leadTimeDays: 5, qualityScore: 87, onTimeRate: 92.0, status: 'active' },
  { id: 'SUP10', name: 'Eaton Corporation', contactEmail: 'electrical@eaton.com', phone: '(800) 386-1911', category: 'Electrical', leadTimeDays: 11, qualityScore: 82, onTimeRate: 85.3, status: 'probation' },
];

export const purchaseOrders: PurchaseOrder[] = [
  { id: 'PO-2601', supplierId: 'SUP01', supplierName: 'Stanley Black & Decker', items: [{ sku: 'T001', productName: 'DeWalt 20V Drill/Driver Kit', quantity: 24, unitCost: 119.99, totalCost: 2879.76 }, { sku: 'T003', productName: 'Craftsman 170-Pc Mechanics Tool Set', quantity: 12, unitCost: 89.99, totalCost: 1079.88 }], totalAmount: 3959.64, status: 'confirmed', createdDate: '2026-04-01', expectedDelivery: '2026-04-10' },
  { id: 'PO-2602', supplierId: 'SUP03', supplierName: 'Rust-Oleum Corporation', items: [{ sku: 'P002', productName: 'Rust-Oleum Spray Paint Assorted', quantity: 144, unitCost: 5.49, totalCost: 790.56 }], totalAmount: 790.56, status: 'shipped', createdDate: '2026-03-28', expectedDelivery: '2026-04-05' },
  { id: 'PO-2603', supplierId: 'SUP02', supplierName: 'Moen Inc.', items: [{ sku: 'PL003', productName: 'Moen Arbor Kitchen Faucet', quantity: 8, unitCost: 289.00, totalCost: 2312.00 }, { sku: 'PL004', productName: 'Moen Adler Bath Faucet', quantity: 15, unitCost: 79.99, totalCost: 1199.85 }], totalAmount: 3511.85, status: 'submitted', createdDate: '2026-04-05', expectedDelivery: '2026-04-18' },
  { id: 'PO-2604', supplierId: 'SUP06', supplierName: 'Weber-Stephen Products', items: [{ sku: 'OD001', productName: 'Weber Spirit II E-310 Gas Grill', quantity: 6, unitCost: 449.00, totalCost: 2694.00 }], totalAmount: 2694.00, status: 'delivered', createdDate: '2026-03-15', expectedDelivery: '2026-03-28' },
  { id: 'PO-2605', supplierId: 'SUP05', supplierName: 'Leviton Manufacturing', items: [{ sku: 'E002', productName: 'Leviton Decora Smart Switch', quantity: 48, unitCost: 29.99, totalCost: 1439.52 }, { sku: 'E005', productName: 'Leviton GFCI Outlet', quantity: 96, unitCost: 18.99, totalCost: 1823.04 }], totalAmount: 3262.56, status: 'confirmed', createdDate: '2026-04-03', expectedDelivery: '2026-04-14' },
  { id: 'PO-2606', supplierId: 'SUP04', supplierName: '3M Company', items: [{ sku: 'HW010', productName: '3M Command Hooks Assorted', quantity: 200, unitCost: 3.99, totalCost: 798.00 }, { sku: 'HW011', productName: '3M Scotch Blue Painters Tape', quantity: 240, unitCost: 6.49, totalCost: 1557.60 }], totalAmount: 2355.60, status: 'delivered', createdDate: '2026-03-20', expectedDelivery: '2026-03-27' },
  { id: 'PO-2607', supplierId: 'SUP07', supplierName: 'Scotts Miracle-Gro', items: [{ sku: 'OD008', productName: 'Scotts Turf Builder 15K sqft', quantity: 30, unitCost: 54.99, totalCost: 1649.70 }], totalAmount: 1649.70, status: 'draft', createdDate: '2026-04-10', expectedDelivery: '2026-04-22' },
  { id: 'PO-2608', supplierId: 'SUP08', supplierName: 'Simpson Strong-Tie', items: [{ sku: 'HW020', productName: 'Joist Hangers Assorted', quantity: 500, unitCost: 2.49, totalCost: 1245.00 }], totalAmount: 1245.00, status: 'confirmed', createdDate: '2026-04-02', expectedDelivery: '2026-04-11' },
  { id: 'PO-2609', supplierId: 'SUP09', supplierName: 'DAP Products', items: [{ sku: 'P020', productName: 'DAP Silicone Caulk Clear', quantity: 120, unitCost: 7.99, totalCost: 958.80 }, { sku: 'P021', productName: 'DAP Plastic Wood Filler', quantity: 80, unitCost: 5.49, totalCost: 439.20 }], totalAmount: 1398.00, status: 'shipped', createdDate: '2026-03-30', expectedDelivery: '2026-04-06' },
  { id: 'PO-2610', supplierId: 'SUP10', supplierName: 'Eaton Corporation', items: [{ sku: 'E010', productName: 'Eaton BR 200A Panel', quantity: 4, unitCost: 189.00, totalCost: 756.00 }], totalAmount: 756.00, status: 'cancelled', createdDate: '2026-03-10', expectedDelivery: '2026-03-25' },
  { id: 'PO-2611', supplierId: 'SUP01', supplierName: 'Stanley Black & Decker', items: [{ sku: 'T010', productName: 'DeWalt Miter Saw 12"', quantity: 3, unitCost: 399.00, totalCost: 1197.00 }], totalAmount: 1197.00, status: 'submitted', createdDate: '2026-04-08', expectedDelivery: '2026-04-17' },
  { id: 'PO-2612', supplierId: 'SUP03', supplierName: 'Rust-Oleum Corporation', items: [{ sku: 'P001', productName: 'Benjamin Moore Regal Select Gal', quantity: 36, unitCost: 52.99, totalCost: 1907.64 }], totalAmount: 1907.64, status: 'confirmed', createdDate: '2026-04-06', expectedDelivery: '2026-04-12' },
  { id: 'PO-2613', supplierId: 'SUP02', supplierName: 'Moen Inc.', items: [{ sku: 'PL010', productName: 'Moen Magnetix Showerhead', quantity: 20, unitCost: 64.99, totalCost: 1299.80 }], totalAmount: 1299.80, status: 'delivered', createdDate: '2026-03-18', expectedDelivery: '2026-03-30' },
  { id: 'PO-2614', supplierId: 'SUP06', supplierName: 'Weber-Stephen Products', items: [{ sku: 'OD002', productName: 'Weber Smokey Mountain Cooker', quantity: 4, unitCost: 399.00, totalCost: 1596.00 }], totalAmount: 1596.00, status: 'draft', createdDate: '2026-04-11', expectedDelivery: '2026-04-25' },
  { id: 'PO-2615', supplierId: 'SUP04', supplierName: '3M Company', items: [{ sku: 'HW015', productName: '3M Filtrete Air Filters 4-Pack', quantity: 60, unitCost: 24.99, totalCost: 1499.40 }], totalAmount: 1499.40, status: 'submitted', createdDate: '2026-04-09', expectedDelivery: '2026-04-16' },
];

export const vendorScorecards: VendorScorecard[] = [
  { supplierId: 'SUP01', supplierName: 'Stanley Black & Decker', qualityScore: 94, deliveryScore: 96, priceCompetitiveness: 85, responsiveness: 92, overallScore: 92, trend: 'stable' },
  { supplierId: 'SUP02', supplierName: 'Moen Inc.', qualityScore: 92, deliveryScore: 95, priceCompetitiveness: 80, responsiveness: 90, overallScore: 89, trend: 'improving' },
  { supplierId: 'SUP03', supplierName: 'Rust-Oleum Corporation', qualityScore: 91, deliveryScore: 97, priceCompetitiveness: 88, responsiveness: 85, overallScore: 90, trend: 'stable' },
  { supplierId: 'SUP04', supplierName: '3M Company', qualityScore: 96, deliveryScore: 98, priceCompetitiveness: 78, responsiveness: 94, overallScore: 92, trend: 'improving' },
  { supplierId: 'SUP05', supplierName: 'Leviton Manufacturing', qualityScore: 90, deliveryScore: 94, priceCompetitiveness: 82, responsiveness: 88, overallScore: 89, trend: 'stable' },
  { supplierId: 'SUP06', supplierName: 'Weber-Stephen Products', qualityScore: 93, deliveryScore: 91, priceCompetitiveness: 75, responsiveness: 86, overallScore: 86, trend: 'declining' },
  { supplierId: 'SUP07', supplierName: 'Scotts Miracle-Gro', qualityScore: 88, deliveryScore: 90, priceCompetitiveness: 84, responsiveness: 80, overallScore: 86, trend: 'declining' },
  { supplierId: 'SUP08', supplierName: 'Simpson Strong-Tie', qualityScore: 95, deliveryScore: 98, priceCompetitiveness: 90, responsiveness: 93, overallScore: 94, trend: 'improving' },
  { supplierId: 'SUP09', supplierName: 'DAP Products', qualityScore: 87, deliveryScore: 92, priceCompetitiveness: 91, responsiveness: 84, overallScore: 89, trend: 'stable' },
  { supplierId: 'SUP10', supplierName: 'Eaton Corporation', qualityScore: 82, deliveryScore: 85, priceCompetitiveness: 79, responsiveness: 76, overallScore: 81, trend: 'declining' },
];
