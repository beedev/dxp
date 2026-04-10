import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NewsArticle, NewsFilters, NewsSentiment } from '@dxp/contracts';
import { FinancialNewsPort } from '../ports/financial-news.port';

const POSITIVE_KEYWORDS = ['rally', 'surge', 'gain', 'rise', 'bull', 'record', 'profit', 'beat', 'growth', 'recovery', 'strong'];
const NEGATIVE_KEYWORDS = ['crash', 'drop', 'fall', 'loss', 'bear', 'decline', 'miss', 'risk', 'concern', 'headwind', 'weak'];

interface NewsApiArticle {
  title: string;
  source: { name: string };
  author: string | null;
  url: string;
  urlToImage: string | null;
  description: string | null;
  content: string | null;
  publishedAt: string;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

@Injectable()
export class NewsApiAdapter extends FinancialNewsPort {
  private readonly logger = new Logger(NewsApiAdapter.name);
  private readonly baseUrl = 'https://newsapi.org/v2';
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.apiKey = this.config.get<string>('NEWSAPI_KEY', '');
  }

  async getApacNews(filters: NewsFilters): Promise<{ articles: NewsArticle[]; total: number }> {
    try {
      const query = filters.query
        || 'APAC OR Singapore OR "Hong Kong" OR Japan OR China OR Australia';
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 10;
      const params = new URLSearchParams({
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        page: String(page),
        pageSize: String(pageSize),
        apiKey: this.apiKey,
      });
      if (filters.country) params.set('q', `${query} ${filters.country}`);

      const res = await fetch(`${this.baseUrl}/everything?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as NewsApiResponse;

      let articles = (data.articles || []).map((a, i) => this.mapArticle(a, i));
      if (filters.sentiment) {
        articles = articles.filter(a => a.sentiment === filters.sentiment);
      }
      return { articles, total: data.totalResults };
    } catch (err) {
      this.logger.error(`getApacNews failed: ${(err as Error).message}`);
      throw new HttpException('Failed to fetch APAC news', HttpStatus.BAD_GATEWAY);
    }
  }

  async getCompanyNews(symbol: string): Promise<NewsArticle[]> {
    try {
      const params = new URLSearchParams({
        q: symbol,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: '10',
        apiKey: this.apiKey,
      });
      const res = await fetch(`${this.baseUrl}/everything?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as NewsApiResponse;
      return (data.articles || []).map((a, i) => this.mapArticle(a, i));
    } catch (err) {
      this.logger.error(`getCompanyNews failed for ${symbol}: ${(err as Error).message}`);
      throw new HttpException(`Failed to fetch news for ${symbol}`, HttpStatus.BAD_GATEWAY);
    }
  }

  private mapArticle(a: NewsApiArticle, index: number): NewsArticle {
    const text = `${a.title} ${a.description || ''} ${a.content || ''}`.toLowerCase();
    const sentiment = this.detectSentiment(text);
    return {
      id: `newsapi-${Date.now()}-${index}`,
      title: a.title,
      source: a.source.name,
      author: a.author || undefined,
      url: a.url,
      imageUrl: a.urlToImage || undefined,
      summary: a.description || a.content?.slice(0, 200) || '',
      publishedAt: a.publishedAt,
      sentiment,
      tags: [],
    };
  }

  private detectSentiment(text: string): NewsSentiment {
    const positiveScore = POSITIVE_KEYWORDS.filter(kw => text.includes(kw)).length;
    const negativeScore = NEGATIVE_KEYWORDS.filter(kw => text.includes(kw)).length;
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }
}
