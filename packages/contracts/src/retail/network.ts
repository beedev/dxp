export interface StoreKPI {
  storeId: string;
  storeName: string;
  region: string;
  revenue: number;
  growth: number;
  customerSat: number;
  inventoryTurnover: number;
  laborCostPct: number;
  status: 'exceeding' | 'meeting' | 'below';
}

export interface RegionMetrics {
  region: string;
  stores: number;
  revenue: number;
  growth: number;
  topCategory: string;
}

export interface DistributionCenter {
  id: string;
  name: string;
  location: string;
  capacity: number;
  utilization: number;
  onTimeRate: number;
  stockOutRate: number;
  status: 'Operational' | 'Maintenance' | 'Partial';
}
