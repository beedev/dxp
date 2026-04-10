import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WatchlistPort } from './ports/watchlist.port';
import { MockWatchlistAdapter } from './adapters/mock-watchlist.adapter';
import { WatchlistController } from './watchlist.controller';

@Module({
  controllers: [WatchlistController],
  providers: [
    {
      provide: WatchlistPort,
      useFactory: (config: ConfigService) => {
        const adapter = config.get<string>('WATCHLIST_ADAPTER', 'mock');
        switch (adapter) {
          case 'mock':
            return new MockWatchlistAdapter();
          default:
            throw new Error(`Unknown watchlist adapter: ${adapter}. Supported: mock`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [WatchlistPort],
})
export class WatchlistModule {}
