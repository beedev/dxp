import React, { useState } from 'react';
import { Card, StatsDisplay, Tabs, DataTable, Badge, Button, Chart, ProgressTracker } from '@dxp/ui';
import { Award, Gift, TrendingUp, Star } from 'lucide-react';
import { currentMember, pointsHistory, rewardsCatalog } from '../../data/mock-loyalty';

const tierThresholds: Record<string, number> = {
  Bronze: 0,
  Silver: 5000,
  Gold: 15000,
  Platinum: 30000,
};

const nextTier: Record<string, string> = {
  Bronze: 'Silver',
  Silver: 'Gold',
  Gold: 'Platinum',
  Platinum: 'Platinum',
};

interface HistoryRow {
  date: string;
  description: string;
  points: string;
  type: string;
}

const rewardCategories = ['All', ...new Set(rewardsCatalog.map((r) => r.category))];

// Chart data: monthly points earned over last 6 months
const monthlyPoints = [
  { month: 'Nov', points: 480 },
  { month: 'Dec', points: 720 },
  { month: 'Jan', points: 290 },
  { month: 'Feb', points: 460 },
  { month: 'Mar', points: 1604 },
  { month: 'Apr', points: 450 },
];

export function LoyaltyRewards() {
  const [activeTab, setActiveTab] = useState('history');
  const [rewardCategory, setRewardCategory] = useState('All');

  const nextTierName = nextTier[currentMember.tier];
  const nextThreshold = tierThresholds[nextTierName];
  const currentThreshold = tierThresholds[currentMember.tier];
  const pointsToNext = nextThreshold - currentMember.lifetimePoints;
  const isMaxTier = currentMember.tier === 'Platinum';

  // Running balance for history
  let runningBalance = currentMember.points;
  const historyWithBalance = [...pointsHistory].map((tx) => {
    const row = { ...tx, balance: runningBalance };
    runningBalance -= tx.points; // reverse to show historical balance
    return row;
  });

  const tableData: HistoryRow[] = historyWithBalance.map((tx) => ({
    date: tx.date,
    description: tx.description,
    points: tx.points > 0 ? `+${tx.points}` : `${tx.points}`,
    type: tx.type,
  }));

  const filteredRewards = rewardCategory === 'All'
    ? rewardsCatalog
    : rewardsCatalog.filter((r) => r.category === rewardCategory);

  // Stats for this month
  const thisMonth = pointsHistory
    .filter((t) => t.date.startsWith('2026-04') && t.type === 'earn')
    .reduce((s, t) => s + t.points, 0);

  const tierColors: Record<string, string> = {
    Bronze: 'bg-orange-100 text-orange-700 border-orange-300',
    Silver: 'bg-gray-100 text-gray-700 border-gray-300',
    Gold: 'bg-amber-100 text-amber-700 border-amber-300',
    Platinum: 'bg-purple-100 text-purple-700 border-purple-300',
  };

  return (
    <div>
      {/* Hero Card */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-red-700 via-red-600 to-amber-500 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Award size={28} />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">ACE Rewards</p>
                <h1 className="text-2xl font-extrabold">{currentMember.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierColors[currentMember.tier]}`}>
                {currentMember.tier} Member
              </span>
              <span className="text-xs opacity-80">Since {new Date(currentMember.memberSince).getFullYear()}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-5xl font-black">{currentMember.points.toLocaleString()}</p>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mt-1">Available Points</p>
          </div>
        </div>
      </Card>

      {/* Tier Progress */}
      {!isMaxTier && (
        <div className="mb-6">
          <ProgressTracker
            title="Tier Progress"
            steps={[
              { label: 'Bronze', status: currentMember.lifetimePoints >= tierThresholds.Silver ? 'completed' : currentMember.tier === 'Bronze' ? 'in-progress' : 'pending' },
              { label: 'Silver', status: currentMember.lifetimePoints >= tierThresholds.Gold ? 'completed' : currentMember.tier === 'Silver' ? 'in-progress' : 'pending' },
              { label: 'Gold', status: currentMember.lifetimePoints >= tierThresholds.Platinum ? 'completed' : currentMember.tier === 'Gold' ? 'in-progress' : 'pending' },
              { label: 'Platinum', status: currentMember.tier === 'Platinum' ? 'completed' : 'pending' },
            ]}
            estimatedCompletion={`${pointsToNext.toLocaleString()} points to ${nextTierName}`}
          />
        </div>
      )}

      {/* Stats */}
      <div className="mb-6">
        <StatsDisplay
          stats={[
            { label: 'Current Points', value: currentMember.points, format: 'number' },
            { label: 'Lifetime Points', value: currentMember.lifetimePoints, format: 'number' },
            { label: 'Points This Month', value: thisMonth, format: 'number' },
            { label: 'Rewards Redeemed', value: 12, format: 'number' },
          ]}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={[
            { key: 'history', label: 'Earn & Burn History' },
            { key: 'catalog', label: 'Rewards Catalog' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
          variant="pill"
        />
      </div>

      {activeTab === 'history' && (
        <div>
          {/* Points chart */}
          <div className="mb-6">
            <Chart
              type="bar"
              data={monthlyPoints}
              xKey="month"
              yKeys={['points']}
              title="Monthly Points Earned"
              description="Points earned over the last 6 months"
              height={250}
            />
          </div>

          {/* Transaction table */}
          <DataTable<HistoryRow>
            columns={[
              { key: 'date', header: 'Date', sortable: true },
              { key: 'description', header: 'Description' },
              {
                key: 'points',
                header: 'Points',
                render: (val: unknown) => {
                  const v = val as string;
                  const isPositive = v.startsWith('+');
                  return (
                    <span className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                      {v}
                    </span>
                  );
                },
                sortable: true,
              },
              {
                key: 'type',
                header: 'Type',
                render: (val: unknown) => (
                  <Badge variant={(val as string) === 'earn' ? 'success' : 'warning'}>
                    {(val as string) === 'earn' ? 'Earned' : 'Redeemed'}
                  </Badge>
                ),
              },
            ]}
            data={tableData}
          />
        </div>
      )}

      {activeTab === 'catalog' && (
        <div>
          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {rewardCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setRewardCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  rewardCategory === cat
                    ? 'bg-[var(--dxp-brand)] text-white'
                    : 'bg-[var(--dxp-border-light)] text-[var(--dxp-text)] hover:bg-[var(--dxp-border)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Rewards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRewards.map((reward) => {
              const canAfford = currentMember.points >= reward.pointsCost;
              return (
                <Card key={reward.id} className="p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="info">{reward.category}</Badge>
                    <Gift size={16} className="text-[var(--dxp-text-muted)]" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-1">{reward.name}</h3>
                  <p className="text-xs text-[var(--dxp-text-secondary)] mb-3 flex-1">{reward.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-[var(--dxp-text)]">{reward.pointsCost.toLocaleString()} pts</span>
                    </div>
                    <Button
                      variant={canAfford ? 'primary' : 'secondary'}
                      size="sm"
                      disabled={!canAfford}
                    >
                      {canAfford ? 'Redeem' : 'Need more pts'}
                    </Button>
                  </div>
                  {!canAfford && (
                    <p className="text-[10px] text-[var(--dxp-text-muted)] mt-1.5 text-right">
                      {(reward.pointsCost - currentMember.points).toLocaleString()} more points needed
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
