import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoyaltyPort } from './ports/loyalty.port';
import { MockLoyaltyAdapter } from './adapters/mock.adapter';
import { LoyaltyController } from './loyalty.controller';

@Module({
  controllers: [LoyaltyController],
  providers: [
    {
      provide: LoyaltyPort,
      useFactory: (config: ConfigService) => {
        const adapter = config.get<string>('LOYALTY_ADAPTER', 'mock');
        switch (adapter) {
          case 'mock':
            return new MockLoyaltyAdapter();
          default:
            throw new Error(`Unknown loyalty adapter: ${adapter}. Supported: mock`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [LoyaltyPort],
})
export class LoyaltyModule {}
