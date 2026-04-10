import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WatchlistItem } from '@dxp/contracts';
import { WatchlistPort } from '../ports/watchlist.port';
import { randomUUID } from 'crypto';

const INITIAL_WATCHLIST: WatchlistItem[] = [
  {
    id: 'wl001', symbol: 'OCBC.SI', name: 'Oversea-Chinese Banking Corp', exchange: 'SGX', currency: 'SGD',
    addedAt: '2024-11-01T09:00:00.000Z', notes: 'Watching for dividend yield entry point',
    currentPrice: 14.34, change: 0.12, changePercent: 0.84,
  },
  {
    id: 'wl002', symbol: '1299.HK', name: 'AIA Group Ltd', exchange: 'HKEX', currency: 'HKD',
    addedAt: '2024-11-15T09:00:00.000Z', notes: 'ASEAN insurance exposure',
    currentPrice: 78.25, change: -0.45, changePercent: -0.57,
  },
  {
    id: 'wl003', symbol: '6758.T', name: 'Sony Group Corporation', exchange: 'TSE', currency: 'JPY',
    addedAt: '2024-12-01T09:00:00.000Z', notes: 'PlayStation + semiconductor play',
    currentPrice: 14280.00, change: 234.00, changePercent: 1.67,
  },
  {
    id: 'wl004', symbol: 'CBA.AX', name: 'Commonwealth Bank of Australia', exchange: 'ASX', currency: 'AUD',
    addedAt: '2025-01-10T09:00:00.000Z', notes: 'Largest Australian bank by market cap',
    currentPrice: 124.56, change: -0.89, changePercent: -0.71,
  },
  {
    id: 'wl005', symbol: '2330.TW', name: 'Taiwan Semiconductor Manufacturing', exchange: 'TWSE', currency: 'TWD',
    addedAt: '2025-02-01T09:00:00.000Z', notes: 'AI chip demand beneficiary',
    currentPrice: 1045.00, change: 25.00, changePercent: 2.45,
  },
];

// In-memory store keyed by userId
const STORES: Map<string, WatchlistItem[]> = new Map();

function getStore(userId: string): WatchlistItem[] {
  if (!STORES.has(userId)) {
    STORES.set(userId, INITIAL_WATCHLIST.map(item => ({ ...item })));
  }
  return STORES.get(userId)!;
}

const SYMBOL_META: Record<string, { name: string; currency: string }> = {
  'OCBC.SI':  { name: 'Oversea-Chinese Banking Corp', currency: 'SGD' },
  '1299.HK':  { name: 'AIA Group Ltd', currency: 'HKD' },
  '6758.T':   { name: 'Sony Group Corporation', currency: 'JPY' },
  'CBA.AX':   { name: 'Commonwealth Bank of Australia', currency: 'AUD' },
  '2330.TW':  { name: 'Taiwan Semiconductor Manufacturing', currency: 'TWD' },
  'D05.SI':   { name: 'DBS Group Holdings Ltd', currency: 'SGD' },
  '0700.HK':  { name: 'Tencent Holdings Ltd', currency: 'HKD' },
  'BHP.AX':   { name: 'BHP Group Ltd', currency: 'AUD' },
  '9988.HK':  { name: 'Alibaba Group Holding Ltd', currency: 'HKD' },
  '7203.T':   { name: 'Toyota Motor Corporation', currency: 'JPY' },
};

@Injectable()
export class MockWatchlistAdapter extends WatchlistPort {
  private readonly logger = new Logger(MockWatchlistAdapter.name);

  async getWatchlist(userId: string): Promise<WatchlistItem[]> {
    return getStore(userId);
  }

  async addToWatchlist(userId: string, symbol: string, exchange: string): Promise<WatchlistItem> {
    const store = getStore(userId);
    const meta = SYMBOL_META[symbol] ?? { name: symbol, currency: 'USD' };
    const item: WatchlistItem = {
      id: randomUUID(),
      symbol,
      name: meta.name,
      exchange,
      currency: meta.currency,
      addedAt: new Date().toISOString(),
    };
    store.push(item);
    this.logger.log(`Mock: added ${symbol} to watchlist for user ${userId}`);
    return item;
  }

  async removeFromWatchlist(userId: string, itemId: string): Promise<void> {
    const store = getStore(userId);
    const index = store.findIndex(i => i.id === itemId);
    if (index === -1) {
      throw new NotFoundException(`Watchlist item ${itemId} not found`);
    }
    store.splice(index, 1);
    this.logger.log(`Mock: removed watchlist item ${itemId} for user ${userId}`);
  }
}
