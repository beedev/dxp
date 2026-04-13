// Loyalty Port — the contract that all loyalty adapters must implement.

export interface LoyaltyMember {
  id: string;
  name: string;
  email: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  points: number;
  lifetimePoints: number;
  joinDate: string;
}

export interface PointsTransaction {
  id: string;
  memberId: string;
  type: 'earn' | 'redeem';
  points: number;
  description: string;
  date: string;
  orderId?: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  available: boolean;
  imageUrl?: string;
}

export interface TierStatus {
  current: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  pointsToNext: number;
  nextTier: string | null;
  benefits: string[];
}

export interface EarnPointsDto {
  points: number;
  description: string;
  orderId?: string;
}

export interface RedeemPointsDto {
  rewardId: string;
}

export abstract class LoyaltyPort {
  abstract getMember(memberId: string): Promise<LoyaltyMember>;
  abstract getPointsBalance(memberId: string): Promise<number>;
  abstract getTransactionHistory(memberId: string): Promise<PointsTransaction[]>;
  abstract earnPoints(memberId: string, points: number, description: string, orderId?: string): Promise<PointsTransaction>;
  abstract redeemPoints(memberId: string, rewardId: string): Promise<PointsTransaction>;
  abstract getRewardsCatalog(): Promise<Reward[]>;
  abstract getTierStatus(memberId: string): Promise<TierStatus>;
}
