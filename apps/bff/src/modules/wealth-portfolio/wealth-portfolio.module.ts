import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WealthPortfolioPort } from './ports/wealth-portfolio.port';
import { MockPortfolioAdapter } from './adapters/mock-portfolio.adapter';
import { WealthPortfolioController } from './wealth-portfolio.controller';

@Module({
  controllers: [WealthPortfolioController],
  providers: [
    {
      provide: WealthPortfolioPort,
      useFactory: (config: ConfigService) => {
        const adapter = config.get<string>('PORTFOLIO_ADAPTER', 'mock');
        switch (adapter) {
          case 'db':
            // Production: inject TypeORM / Prisma repository here
            throw new Error('DB adapter for wealth-portfolio not yet configured. Use PORTFOLIO_ADAPTER=mock or implement a DB-backed adapter.');
          case 'mock':
            return new MockPortfolioAdapter();
          default:
            throw new Error(`Unknown portfolio adapter: ${adapter}. Supported: db, mock`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [WealthPortfolioPort],
})
export class WealthPortfolioModule {}
