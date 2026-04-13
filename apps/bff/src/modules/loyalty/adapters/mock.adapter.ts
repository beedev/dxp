import { Injectable, Logger } from '@nestjs/common';
import {
  LoyaltyPort,
  LoyaltyMember,
  PointsTransaction,
  Reward,
  TierStatus,
} from '../ports/loyalty.port';

const mockMembers: LoyaltyMember[] = [
  {
    id: 'LM001', name: 'Mark Henderson', email: 'mark.h@email.com',
    tier: 'Gold', points: 4750, lifetimePoints: 28400, joinDate: '2019-03-15',
  },
  {
    id: 'LM002', name: 'Jessica Park', email: 'jpark@email.com',
    tier: 'Platinum', points: 12300, lifetimePoints: 67800, joinDate: '2016-08-22',
  },
  {
    id: 'LM003', name: 'Brian Foster', email: 'bfoster@email.com',
    tier: 'Silver', points: 1820, lifetimePoints: 9650, joinDate: '2022-01-10',
  },
];

const mockTransactions: PointsTransaction[] = [
  { id: 'PT001', memberId: 'LM001', type: 'earn', points: 198, description: 'DeWalt 20V Drill/Driver Kit', date: '2026-04-08', orderId: 'ORD-1047' },
  { id: 'PT002', memberId: 'LM001', type: 'earn', points: 252, description: 'Benjamin Moore Regal Select (2 gal)', date: '2026-04-05', orderId: 'ORD-1042' },
  { id: 'PT003', memberId: 'LM001', type: 'redeem', points: 500, description: 'Redeemed: $10 off next purchase', date: '2026-04-02' },
  { id: 'PT004', memberId: 'LM001', type: 'earn', points: 298, description: 'Craftsman 170-Piece Tool Set', date: '2026-03-28', orderId: 'ORD-1035' },
  { id: 'PT005', memberId: 'LM001', type: 'earn', points: 110, description: 'Scotts Turf Builder 15K', date: '2026-03-22', orderId: 'ORD-1028' },
  { id: 'PT006', memberId: 'LM002', type: 'earn', points: 618, description: 'Moen Arbor Kitchen Faucet', date: '2026-03-10', orderId: 'ORD-1019' },
  { id: 'PT007', memberId: 'LM002', type: 'redeem', points: 200, description: 'Redeemed: Free key cutting (5 keys)', date: '2026-03-05' },
  { id: 'PT008', memberId: 'LM003', type: 'earn', points: 60, description: 'Kwikset SmartKey Deadbolt', date: '2026-02-20', orderId: 'ORD-1008' },
  { id: 'PT009', memberId: 'LM003', type: 'earn', points: 100, description: 'Valentine\'s Day Bonus', date: '2026-02-14' },
  { id: 'PT010', memberId: 'LM002', type: 'earn', points: 320, description: 'Spring Bonus: 2x points weekend', date: '2026-03-18' },
];

const mockRewards: Reward[] = [
  { id: 'R001', name: '$5 Off Your Next Purchase', description: 'Save $5 on any purchase of $25 or more.', pointsCost: 250, category: 'Discount', available: true },
  { id: 'R002', name: '$10 Off Your Next Purchase', description: 'Save $10 on any purchase of $50 or more.', pointsCost: 500, category: 'Discount', available: true },
  { id: 'R003', name: '$25 Off Your Next Purchase', description: 'Save $25 on any purchase of $100 or more.', pointsCost: 1200, category: 'Discount', available: true },
  { id: 'R004', name: 'Free Key Cutting (5 Keys)', description: 'Get up to 5 keys cut for free at any ACE location.', pointsCost: 200, category: 'Service', available: true },
  { id: 'R005', name: 'Free Paint Mixing', description: 'One free custom paint color mix at the paint counter.', pointsCost: 150, category: 'Service', available: true },
  { id: 'R006', name: 'Free Tool Rental (1 Day)', description: 'Rent any tool for one day at no charge.', pointsCost: 400, category: 'Service', available: true },
  { id: 'R007', name: 'ACE Branded Work Gloves', description: 'Heavy-duty leather work gloves with ACE logo.', pointsCost: 350, category: 'Merchandise', available: true },
  { id: 'R008', name: 'Stanley Tape Measure', description: 'Stanley 16ft tape measure — exclusive ACE edition.', pointsCost: 600, category: 'Merchandise', available: false },
  { id: 'R009', name: 'Free Propane Tank Exchange', description: 'Exchange your empty 20lb propane tank for free.', pointsCost: 300, category: 'Service', available: true },
  { id: 'R010', name: 'Priority Workshop Access', description: 'Early registration for all in-store workshops.', pointsCost: 800, category: 'Experience', available: true },
];

const tierThresholds: Record<string, { next: string | null; pointsNeeded: number; benefits: string[] }> = {
  Bronze: { next: 'Silver', pointsNeeded: 5000, benefits: ['1 point per $1 spent', 'Birthday bonus (50 pts)'] },
  Silver: { next: 'Gold', pointsNeeded: 15000, benefits: ['1.25 points per $1 spent', 'Birthday bonus (100 pts)', 'Free key cutting (monthly)'] },
  Gold: { next: 'Platinum', pointsNeeded: 40000, benefits: ['1.5 points per $1 spent', 'Birthday bonus (200 pts)', 'Free key cutting (weekly)', 'Priority tool rental'] },
  Platinum: { next: null, pointsNeeded: 0, benefits: ['2 points per $1 spent', 'Birthday bonus (500 pts)', 'Free key cutting (unlimited)', 'Priority tool rental', 'Exclusive workshop access', 'Annual $50 credit'] },
};

@Injectable()
export class MockLoyaltyAdapter extends LoyaltyPort {
  private readonly logger = new Logger(MockLoyaltyAdapter.name);

  async getMember(memberId: string): Promise<LoyaltyMember> {
    const member = mockMembers.find((m) => m.id === memberId);
    if (!member) throw new Error(`Member ${memberId} not found`);
    return member;
  }

  async getPointsBalance(memberId: string): Promise<number> {
    const member = await this.getMember(memberId);
    return member.points;
  }

  async getTransactionHistory(memberId: string): Promise<PointsTransaction[]> {
    return mockTransactions.filter((t) => t.memberId === memberId);
  }

  async earnPoints(memberId: string, points: number, description: string, orderId?: string): Promise<PointsTransaction> {
    const member = await this.getMember(memberId);
    member.points += points;
    member.lifetimePoints += points;
    const txn: PointsTransaction = {
      id: `PT${Date.now()}`,
      memberId,
      type: 'earn',
      points,
      description,
      date: new Date().toISOString().split('T')[0],
      orderId,
    };
    mockTransactions.unshift(txn);
    return txn;
  }

  async redeemPoints(memberId: string, rewardId: string): Promise<PointsTransaction> {
    const member = await this.getMember(memberId);
    const reward = mockRewards.find((r) => r.id === rewardId);
    if (!reward) throw new Error(`Reward ${rewardId} not found`);
    if (!reward.available) throw new Error(`Reward ${rewardId} is not available`);
    if (member.points < reward.pointsCost) throw new Error('Insufficient points');
    member.points -= reward.pointsCost;
    const txn: PointsTransaction = {
      id: `PT${Date.now()}`,
      memberId,
      type: 'redeem',
      points: reward.pointsCost,
      description: `Redeemed: ${reward.name}`,
      date: new Date().toISOString().split('T')[0],
    };
    mockTransactions.unshift(txn);
    return txn;
  }

  async getRewardsCatalog(): Promise<Reward[]> {
    return mockRewards;
  }

  async getTierStatus(memberId: string): Promise<TierStatus> {
    const member = await this.getMember(memberId);
    const info = tierThresholds[member.tier];
    return {
      current: member.tier,
      pointsToNext: info.next ? info.pointsNeeded - member.lifetimePoints : 0,
      nextTier: info.next,
      benefits: info.benefits,
    };
  }
}
