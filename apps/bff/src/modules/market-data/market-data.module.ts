import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketDataPort } from './ports/market-data.port';
import { AlphaVantageAdapter } from './adapters/alpha-vantage.adapter';
import { MockMarketAdapter } from './adapters/mock-market.adapter';
import { YahooFinanceAdapter } from './adapters/yahoo-finance.adapter';
import { MarketDataController } from './market-data.controller';

@Module({
  controllers: [MarketDataController],
  providers: [
    {
      provide: MarketDataPort,
      useFactory: (config: ConfigService) => {
        const adapter = config.get<string>('MARKET_DATA_ADAPTER', 'mock');
        switch (adapter) {
          case 'alpha-vantage':
            return new AlphaVantageAdapter(config);
          case 'yahoo-finance':
            return new YahooFinanceAdapter();
          case 'mock':
            return new MockMarketAdapter();
          default:
            throw new Error(`Unknown market-data adapter: ${adapter}. Supported: alpha-vantage, yahoo-finance, mock`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [MarketDataPort],
})
export class MarketDataModule {}
