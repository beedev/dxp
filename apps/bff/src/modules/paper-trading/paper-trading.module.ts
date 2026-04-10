import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaperTradingPort } from './ports/paper-trading.port';
import { PaperEngineAdapter } from './adapters/paper-engine.adapter';
import { PaperTradingController } from './paper-trading.controller';
import { MarketDataModule } from '../market-data/market-data.module';
import { MarketDataPort } from '../market-data/ports/market-data.port';

@Module({
  imports: [MarketDataModule],
  controllers: [PaperTradingController],
  providers: [
    {
      provide: PaperTradingPort,
      useFactory: (config: ConfigService, market: MarketDataPort) => {
        const adapter = config.get<string>('TRADING_ADAPTER', 'paper');
        switch (adapter) {
          case 'paper':
            return new PaperEngineAdapter(market);
          case 'broker':
            // When TRADING_ADAPTER=broker, the broker-gateway module handles real orders.
            // PaperTradingPort still provides the paper engine as a fallback/simulation layer.
            return new PaperEngineAdapter(market);
          default:
            throw new Error(`Unknown trading adapter: ${adapter}. Supported: paper, broker`);
        }
      },
      inject: [ConfigService, MarketDataPort],
    },
  ],
  exports: [PaperTradingPort],
})
export class PaperTradingModule {}
