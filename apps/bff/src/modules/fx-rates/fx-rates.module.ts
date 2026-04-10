import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FxRatesPort } from './ports/fx-rates.port';
import { ExchangeRateApiAdapter } from './adapters/exchangerate-api.adapter';
import { MockFxAdapter } from './adapters/mock-fx.adapter';
import { FxRatesController } from './fx-rates.controller';

@Module({
  controllers: [FxRatesController],
  providers: [
    {
      provide: FxRatesPort,
      useFactory: (config: ConfigService) => {
        const adapter = config.get<string>('FX_ADAPTER', 'mock');
        switch (adapter) {
          case 'exchangerate-api':
            return new ExchangeRateApiAdapter();
          case 'mock':
            return new MockFxAdapter();
          default:
            throw new Error(`Unknown fx adapter: ${adapter}. Supported: exchangerate-api, mock`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [FxRatesPort],
})
export class FxRatesModule {}
