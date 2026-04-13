export const networkSummary = {
  totalStores: 5247,
  totalRevenue: 6200000000,
  avgStoreRevenue: 1181000,
  yoyGrowth: 3.2,
  customerSatAvg: 87,
};

export const regions = [
  { name: 'Northeast', stores: 1124, revenue: 1420000000, growth: 2.8, satScore: 89 },
  { name: 'Southeast', stores: 1087, revenue: 1280000000, growth: 4.1, satScore: 86 },
  { name: 'Midwest', stores: 1340, revenue: 1520000000, growth: 2.5, satScore: 88 },
  { name: 'Southwest', stores: 876, revenue: 990000000, growth: 5.3, satScore: 85 },
  { name: 'West', stores: 820, revenue: 990000000, growth: 3.6, satScore: 90 },
];

export const topStores = [
  { rank: 1, name: 'ACE — Bellevue', city: 'Bellevue', state: 'WA', annualRevenue: 3350000, growth: 8.2, satScore: 95, status: 'Exceeding' as const },
  { rank: 2, name: 'ACE — Naperville', city: 'Naperville', state: 'IL', annualRevenue: 3420000, growth: 6.1, satScore: 92, status: 'Exceeding' as const },
  { rank: 3, name: 'ACE — Minneapolis', city: 'Minneapolis', state: 'MN', annualRevenue: 3280000, growth: 5.5, satScore: 93, status: 'Exceeding' as const },
  { rank: 4, name: 'ACE — Cherry Creek', city: 'Denver', state: 'CO', annualRevenue: 3180000, growth: 4.8, satScore: 94, status: 'Exceeding' as const },
  { rank: 5, name: 'ACE — Nashville', city: 'Nashville', state: 'TN', annualRevenue: 3100000, growth: 4.2, satScore: 88, status: 'Meeting' as const },
  { rank: 6, name: 'ACE — Buckhead', city: 'Atlanta', state: 'GA', annualRevenue: 3050000, growth: 3.5, satScore: 88, status: 'Meeting' as const },
  { rank: 7, name: 'ACE — La Jolla', city: 'La Jolla', state: 'CA', annualRevenue: 2960000, growth: 3.1, satScore: 91, status: 'Meeting' as const },
  { rank: 8, name: 'ACE — Austin Downtown', city: 'Austin', state: 'TX', annualRevenue: 2890000, growth: 2.8, satScore: 89, status: 'Meeting' as const },
  { rank: 9, name: 'ACE — Raleigh', city: 'Raleigh', state: 'NC', annualRevenue: 2870000, growth: 1.9, satScore: 89, status: 'Meeting' as const },
  { rank: 10, name: 'ACE — Boulder', city: 'Boulder', state: 'CO', annualRevenue: 2840000, growth: 0.8, satScore: 94, status: 'Below Target' as const },
];

export const distributionCenters = [
  { name: 'RSC — Chicago', location: 'Joliet, IL', status: 'Operational' as const, onTimeRate: 97.1, stockOutRate: 1.2 },
  { name: 'RSC — Atlanta', location: 'McDonough, GA', status: 'Operational' as const, onTimeRate: 95.8, stockOutRate: 1.8 },
  { name: 'RSC — Sacramento', location: 'Lathrop, CA', status: 'Operational' as const, onTimeRate: 96.5, stockOutRate: 1.4 },
  { name: 'RSC — Dallas', location: 'Princeton, TX', status: 'Operational' as const, onTimeRate: 94.2, stockOutRate: 2.3 },
  { name: 'RSC — Portland', location: 'Wilsonville, OR', status: 'Maintenance' as const, onTimeRate: 91.3, stockOutRate: 3.1 },
];

// 12-month network revenue trend
export const networkRevenueTrend = [
  { month: 'May \'25', revenue: 490000000 },
  { month: 'Jun', revenue: 560000000 },
  { month: 'Jul', revenue: 580000000 },
  { month: 'Aug', revenue: 550000000 },
  { month: 'Sep', revenue: 510000000 },
  { month: 'Oct', revenue: 520000000 },
  { month: 'Nov', revenue: 480000000 },
  { month: 'Dec', revenue: 540000000 },
  { month: 'Jan \'26', revenue: 430000000 },
  { month: 'Feb', revenue: 460000000 },
  { month: 'Mar', revenue: 530000000 },
  { month: 'Apr', revenue: 570000000 },
];
