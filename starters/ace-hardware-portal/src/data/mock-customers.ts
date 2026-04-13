export interface CustomerAnalytics {
  id: string;
  name: string;
  email: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  totalSpend: number;
  visitCount: number;
  avgOrderValue: number;
  lastVisit: string;
  preferredCategory: string;
  memberSince: string;
  lifetimePoints: number;
}

export const customerAnalytics: CustomerAnalytics[] = [
  { id: 'LM001', name: 'Mark Henderson', email: 'mark.h@email.com', tier: 'Gold', totalSpend: 14200, visitCount: 48, avgOrderValue: 295.83, lastVisit: '2026-04-08', preferredCategory: 'Tools', memberSince: '2019-03-15', lifetimePoints: 28400 },
  { id: 'LM002', name: 'Jessica Park', email: 'jpark@email.com', tier: 'Platinum', totalSpend: 33900, visitCount: 112, avgOrderValue: 302.68, lastVisit: '2026-04-10', preferredCategory: 'Plumbing', memberSince: '2016-08-22', lifetimePoints: 67800 },
  { id: 'LM003', name: 'Brian Foster', email: 'bfoster@email.com', tier: 'Silver', totalSpend: 4825, visitCount: 22, avgOrderValue: 219.32, lastVisit: '2026-03-28', preferredCategory: 'Hardware', memberSince: '2022-01-10', lifetimePoints: 9650 },
  { id: 'LM004', name: 'Sarah Mitchell', email: 'smitchell@email.com', tier: 'Gold', totalSpend: 11800, visitCount: 38, avgOrderValue: 310.53, lastVisit: '2026-04-06', preferredCategory: 'Paint', memberSince: '2020-06-14', lifetimePoints: 23600 },
  { id: 'LM005', name: 'David Nguyen', email: 'dnguyen@email.com', tier: 'Bronze', totalSpend: 1250, visitCount: 8, avgOrderValue: 156.25, lastVisit: '2026-03-15', preferredCategory: 'Electrical', memberSince: '2025-09-01', lifetimePoints: 2500 },
  { id: 'LM006', name: 'Karen Rodriguez', email: 'krodriguez@email.com', tier: 'Platinum', totalSpend: 28400, visitCount: 96, avgOrderValue: 295.83, lastVisit: '2026-04-12', preferredCategory: 'Outdoor', memberSince: '2017-02-28', lifetimePoints: 56800 },
  { id: 'LM007', name: 'Tom Baker', email: 'tbaker@email.com', tier: 'Silver', totalSpend: 6200, visitCount: 28, avgOrderValue: 221.43, lastVisit: '2026-04-01', preferredCategory: 'Tools', memberSince: '2021-11-05', lifetimePoints: 12400 },
  { id: 'LM008', name: 'Lisa Chen', email: 'lchen@email.com', tier: 'Gold', totalSpend: 15600, visitCount: 52, avgOrderValue: 300.00, lastVisit: '2026-04-09', preferredCategory: 'Paint', memberSince: '2018-07-20', lifetimePoints: 31200 },
  { id: 'LM009', name: 'James Wilson', email: 'jwilson@email.com', tier: 'Bronze', totalSpend: 890, visitCount: 5, avgOrderValue: 178.00, lastVisit: '2026-02-20', preferredCategory: 'Seasonal', memberSince: '2025-12-01', lifetimePoints: 1780 },
  { id: 'LM010', name: 'Maria Garcia', email: 'mgarcia@email.com', tier: 'Silver', totalSpend: 7450, visitCount: 31, avgOrderValue: 240.32, lastVisit: '2026-04-04', preferredCategory: 'Plumbing', memberSince: '2021-04-18', lifetimePoints: 14900 },
];

// Pre-computed: spending by tier
export const spendByTier = [
  { tier: 'Platinum', avgSpend: 31150, members: 2 },
  { tier: 'Gold', avgSpend: 13867, members: 3 },
  { tier: 'Silver', avgSpend: 6158, members: 3 },
  { tier: 'Bronze', avgSpend: 1070, members: 2 },
];
