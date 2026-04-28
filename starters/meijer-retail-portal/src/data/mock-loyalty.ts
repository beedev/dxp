export interface LoyaltyMember {
  id: string;
  name: string;
  email: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  points: number;
  lifetimePoints: number;
  memberSince: string;
}

export const members: LoyaltyMember[] = [
  {
    id: 'LM001', name: 'Mark Henderson', email: 'mark.h@email.com',
    tier: 'Gold', points: 4750, lifetimePoints: 28400, memberSince: '2019-03-15',
  },
  {
    id: 'LM002', name: 'Jessica Park', email: 'jpark@email.com',
    tier: 'Platinum', points: 12300, lifetimePoints: 67800, memberSince: '2016-08-22',
  },
  {
    id: 'LM003', name: 'Brian Foster', email: 'bfoster@email.com',
    tier: 'Silver', points: 1820, lifetimePoints: 9650, memberSince: '2022-01-10',
  },
];

export const pointsHistory = [
  { date: '2026-04-08', description: 'DeWalt 20V Drill/Driver Kit', points: 198, type: 'earn' as const },
  { date: '2026-04-05', description: 'Benjamin Moore Regal Select (2 gal)', points: 252, type: 'earn' as const },
  { date: '2026-04-02', description: 'Redeemed: $10 off next purchase', points: -500, type: 'redeem' as const },
  { date: '2026-03-28', description: 'Craftsman 170-Piece Tool Set', points: 298, type: 'earn' as const },
  { date: '2026-03-22', description: 'Scotts Turf Builder 15K', points: 110, type: 'earn' as const },
  { date: '2026-03-18', description: 'Spring Bonus: 2x points weekend', points: 320, type: 'earn' as const },
  { date: '2026-03-10', description: 'Moen Arbor Kitchen Faucet', points: 618, type: 'earn' as const },
  { date: '2026-03-05', description: 'Redeemed: Free key cutting (5 keys)', points: -200, type: 'redeem' as const },
  { date: '2026-02-20', description: 'Kwikset SmartKey Deadbolt', points: 60, type: 'earn' as const },
  { date: '2026-02-14', description: 'Valentine\'s Day Bonus', points: 100, type: 'earn' as const },
];

export const rewardsCatalog = [
  { id: 'R001', name: '$5 Off Your Next Purchase', description: 'Save $5 on any purchase of $25 or more.', pointsCost: 250, category: 'Discount' },
  { id: 'R002', name: '$10 Off Your Next Purchase', description: 'Save $10 on any purchase of $50 or more.', pointsCost: 500, category: 'Discount' },
  { id: 'R003', name: '$25 Off Your Next Purchase', description: 'Save $25 on any purchase of $100 or more.', pointsCost: 1200, category: 'Discount' },
  { id: 'R004', name: 'Free Key Cutting (5 Keys)', description: 'Get up to 5 keys cut for free at any ACE location.', pointsCost: 200, category: 'Service' },
  { id: 'R005', name: 'Free Paint Mixing', description: 'One free custom paint color mix at the paint counter.', pointsCost: 150, category: 'Service' },
  { id: 'R006', name: 'Free Tool Rental (1 Day)', description: 'Rent any tool for one day at no charge.', pointsCost: 400, category: 'Service' },
  { id: 'R007', name: 'ACE Branded Work Gloves', description: 'Heavy-duty leather work gloves with ACE logo.', pointsCost: 350, category: 'Merchandise' },
  { id: 'R008', name: 'Stanley Tape Measure', description: 'Stanley 16ft tape measure — exclusive ACE edition.', pointsCost: 600, category: 'Merchandise' },
  { id: 'R009', name: 'Free Propane Tank Exchange', description: 'Exchange your empty 20lb propane tank for free.', pointsCost: 300, category: 'Service' },
  { id: 'R010', name: 'Priority Workshop Access', description: 'Early registration for all in-store workshops.', pointsCost: 800, category: 'Experience' },
];

export const currentMember: LoyaltyMember = members[0]; // Gold tier, 4,750 points
