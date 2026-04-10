// WatchlistPort — contract that all watchlist adapters must implement.

import { WatchlistItem } from '@dxp/contracts';

export abstract class WatchlistPort {
  abstract getWatchlist(userId: string): Promise<WatchlistItem[]>;
  abstract addToWatchlist(userId: string, symbol: string, exchange: string): Promise<WatchlistItem>;
  abstract removeFromWatchlist(userId: string, itemId: string): Promise<void>;
}
