import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FinancialNewsPort } from './ports/financial-news.port';
import { NewsApiAdapter } from './adapters/newsapi.adapter';
import { MockNewsAdapter } from './adapters/mock-news.adapter';
import { BraveNewsAdapter } from './adapters/brave-news.adapter';
import { GoogleNewsAdapter } from './adapters/google-news.adapter';
import { FinancialNewsController } from './financial-news.controller';

@Module({
  controllers: [FinancialNewsController],
  providers: [
    {
      provide: FinancialNewsPort,
      useFactory: (config: ConfigService) => {
        const adapter = config.get<string>('NEWS_ADAPTER', 'mock');
        switch (adapter) {
          case 'newsapi':
            return new NewsApiAdapter(config);
          case 'brave':
            return new BraveNewsAdapter(config);
          case 'google-news':
            return new GoogleNewsAdapter();
          case 'mock':
            return new MockNewsAdapter();
          default:
            throw new Error(`Unknown news adapter: ${adapter}. Supported: newsapi, brave, google-news, mock`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [FinancialNewsPort],
})
export class FinancialNewsModule {}
