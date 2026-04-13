export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface LoyaltyMember {
  id: string; name: string; email: string; tier: LoyaltyTier;
  points: number; lifetimePoints: number; memberSince: string;
}

export interface PointsTransaction {
  date: string; description: string; points: number; type: 'earn' | 'redeem';
}

export interface Reward {
  id: string; name: string; description: string; pointsCost: number; category: string;
}
