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
