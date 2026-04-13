export interface Promotion {
  id: string;
  name: string;
  type: 'percentage' | 'bogo' | 'fixed' | 'bundle';
  discount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'expired' | 'draft';
  targetCategory?: string;
  redemptions: number;
  revenue: number;
}

export interface Coupon {
  code: string;
  promotionId: string;
  promotionName: string;
  usageCount: number;
  maxUsage: number;
  status: 'active' | 'exhausted' | 'expired';
}
