// FinancialNewsPort — contract that all financial-news adapters must implement.

import { NewsArticle, NewsFilters } from '@dxp/contracts';

export abstract class FinancialNewsPort {
  abstract getApacNews(filters: NewsFilters): Promise<{ articles: NewsArticle[]; total: number }>;
  abstract getCompanyNews(symbol: string): Promise<NewsArticle[]>;
}
