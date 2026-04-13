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

export const promotions: Promotion[] = [
  { id: 'PROMO01', name: 'Spring Paint Sale', type: 'percentage', discount: 25, startDate: '2026-03-15', endDate: '2026-04-30', status: 'active', targetCategory: 'Paint', redemptions: 342, revenue: 28450 },
  { id: 'PROMO02', name: 'Tool Trade-In Event', type: 'fixed', discount: 20, startDate: '2026-04-01', endDate: '2026-04-15', status: 'active', targetCategory: 'Tools', redemptions: 89, revenue: 15230 },
  { id: 'PROMO03', name: 'Plumbing Essentials BOGO', type: 'bogo', discount: 50, startDate: '2026-04-10', endDate: '2026-05-10', status: 'active', targetCategory: 'Plumbing', redemptions: 56, revenue: 4890 },
  { id: 'PROMO04', name: 'Memorial Day Grill Bundle', type: 'bundle', discount: 15, startDate: '2026-05-15', endDate: '2026-05-31', status: 'scheduled', targetCategory: 'Outdoor', redemptions: 0, revenue: 0 },
  { id: 'PROMO05', name: 'Winter Weatherproofing', type: 'percentage', discount: 20, startDate: '2025-11-01', endDate: '2025-12-31', status: 'expired', targetCategory: 'Hardware', redemptions: 478, revenue: 35200 },
  { id: 'PROMO06', name: 'Holiday Lighting Sale', type: 'percentage', discount: 30, startDate: '2025-11-20', endDate: '2025-12-25', status: 'expired', targetCategory: 'Electrical', redemptions: 621, revenue: 18900 },
  { id: 'PROMO07', name: 'Summer Lawn Care Bundle', type: 'bundle', discount: 20, startDate: '2026-06-01', endDate: '2026-08-31', status: 'scheduled', targetCategory: 'Outdoor', redemptions: 0, revenue: 0 },
  { id: 'PROMO08', name: 'Back-to-School Storage', type: 'fixed', discount: 10, startDate: '2026-07-15', endDate: '2026-09-01', status: 'draft', redemptions: 0, revenue: 0 },
];

export const coupons: Coupon[] = [
  { code: 'SPRING25', promotionId: 'PROMO01', promotionName: 'Spring Paint Sale', usageCount: 342, maxUsage: 1000, status: 'active' },
  { code: 'TOOLSWAP', promotionId: 'PROMO02', promotionName: 'Tool Trade-In Event', usageCount: 89, maxUsage: 200, status: 'active' },
  { code: 'PLUMBBOGO', promotionId: 'PROMO03', promotionName: 'Plumbing Essentials BOGO', usageCount: 56, maxUsage: 300, status: 'active' },
  { code: 'WINTER20', promotionId: 'PROMO05', promotionName: 'Winter Weatherproofing', usageCount: 478, maxUsage: 500, status: 'expired' },
  { code: 'LIGHTS30', promotionId: 'PROMO06', promotionName: 'Holiday Lighting Sale', usageCount: 621, maxUsage: 621, status: 'exhausted' },
];

// Pre-computed chart data: redemptions by promotion
export const promoPerformanceChart = promotions
  .filter((p) => p.redemptions > 0)
  .sort((a, b) => b.redemptions - a.redemptions)
  .map((p) => ({ name: p.name.length > 20 ? p.name.slice(0, 18) + '...' : p.name, redemptions: p.redemptions, revenue: p.revenue }));
