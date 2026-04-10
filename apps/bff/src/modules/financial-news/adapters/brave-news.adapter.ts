import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NewsArticle, NewsFilters, NewsSentiment } from '@dxp/contracts';
import { FinancialNewsPort } from '../ports/financial-news.port';

const POSITIVE_KEYWORDS = ['rally', 'surge', 'gain', 'rise', 'bull', 'record', 'profit', 'beat', 'growth', 'recovery', 'strong'];
const NEGATIVE_KEYWORDS = ['crash', 'drop', 'fall', 'loss', 'bear', 'decline', 'miss', 'risk', 'concern', 'headwind', 'weak'];

// Map portal country codes to Brave Search country codes
const COUNTRY_CODE_MAP: Record<string, string> = {
  SG: 'sg',
  HK: 'hk',
  JP: 'jp',
  AU: 'au',
  IN: 'in',
  CN: 'cn',
  KR: 'kr',
};

const DEFAULT_QUERY = '"APAC finance markets Singapore Hong Kong"';

// Typed interfaces for Brave Search News API response
interface BraveNewsMetaUrl {
  netloc?: string;
  path?: string;
  scheme?: string;
}

interface BraveNewsThumbnail {
  src?: string;
}

interface BraveNewsResult {
  title: string;
  url: string;
  description?: string;
  age?: string;
  meta_url?: BraveNewsMetaUrl;
  thumbnail?: BraveNewsThumbnail;
}

interface BraveNewsResponse {
  results?: BraveNewsResult[];
  query?: { original: string };
}

@Injectable()
export class BraveNewsAdapter extends FinancialNewsPort {
  private readonly logger = new Logger(BraveNewsAdapter.name);
  private readonly baseUrl = 'https://api.search.brave.com/res/v1/news/search';
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.apiKey = this.config.get<string>('BRAVE_SEARCH_KEY', '');
  }

  async getApacNews(filters: NewsFilters): Promise<{ articles: NewsArticle[]; total: number }> {
    this.assertApiKey();
    try {
      const query = filters.query ?? DEFAULT_QUERY;
      const pageSize = Math.min(filters.pageSize ?? 10, 20);
      const page = filters.page ?? 1;

      // Brave news doesn't support offset pagination — fetch more and slice client-side
      const fetchCount = Math.min(pageSize * page, 20);

      const params = new URLSearchParams({
        q: filters.country ? `${query} ${filters.country}` : query,
        count: String(fetchCount),
        search_lang: 'en',
      });

      if (filters.country) {
        const braveCountry = COUNTRY_CODE_MAP[filters.country] ?? 'en';
        params.set('country', braveCountry);
      }

      const results = await this.fetchNews(params);

      // Slice to requested page
      const start = (page - 1) * pageSize;
      const pageResults = results.slice(start, start + pageSize);

      const articles = pageResults.map((r, i) =>
        this.mapResult(r, start + i, filters),
      );

      // Filter by sentiment if requested (client-side since Brave doesn't provide it)
      const filtered = filters.sentiment
        ? articles.filter(a => a.sentiment === filters.sentiment)
        : articles;

      return { articles: filtered, total: results.length };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`getApacNews failed: ${(err as Error).message}`);
      throw new HttpException('Failed to fetch APAC news from Brave Search', HttpStatus.BAD_GATEWAY);
    }
  }

  async getCompanyNews(symbol: string): Promise<NewsArticle[]> {
    this.assertApiKey();
    try {
      const query = `"${symbol}" stock earnings results`;
      const params = new URLSearchParams({
        q: query,
        count: '5',
        search_lang: 'en',
      });

      const results = await this.fetchNews(params);
      return results.map((r, i) => this.mapResult(r, i, { tags: [symbol, 'Markets'] }));
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`getCompanyNews failed for ${symbol}: ${(err as Error).message}`);
      throw new HttpException(`Failed to fetch news for ${symbol}`, HttpStatus.BAD_GATEWAY);
    }
  }

  // ── Private helpers ──────────────────────────────────────────────

  private assertApiKey(): void {
    if (!this.apiKey) {
      throw new HttpException(
        'Brave Search API key not configured. Set BRAVE_SEARCH_KEY in .env',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async fetchNews(params: URLSearchParams): Promise<BraveNewsResult[]> {
    const url = `${this.baseUrl}?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        'X-Subscription-Token': this.apiKey,
        'Accept': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json() as BraveNewsResponse;
    return data.results ?? [];
  }

  private mapResult(
    result: BraveNewsResult,
    index: number,
    filters: Pick<NewsFilters, 'country'> & { tags?: string[] },
  ): NewsArticle {
    const text = `${result.title} ${result.description ?? ''}`.toLowerCase();
    const sentiment = this.detectSentiment(text);

    return {
      id: `brave-${index}-${this.hashUrl(result.url)}`,
      title: result.title,
      source: result.meta_url?.netloc ?? 'Unknown',
      url: result.url,
      imageUrl: result.thumbnail?.src,
      summary: result.description ?? '',
      publishedAt: this.parseAge(result.age),
      sentiment,
      tags: filters.tags ?? ['APAC', 'Markets'],
      country: filters.country ?? 'APAC',
    };
  }

  private parseAge(age: string | undefined): string {
    if (!age) return new Date().toISOString();

    // If it looks like an ISO date string, return it directly
    if (/^\d{4}-\d{2}-\d{2}/.test(age)) return new Date(age).toISOString();

    // Parse relative strings like "2 hours ago", "3 days ago", "1 minute ago"
    const relativeMatch = age.match(/^(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i);
    if (relativeMatch) {
      const amount = parseInt(relativeMatch[1], 10);
      const unit = relativeMatch[2].toLowerCase();
      const msMap: Record<string, number> = {
        second: 1_000,
        minute: 60_000,
        hour: 3_600_000,
        day: 86_400_000,
        week: 604_800_000,
        month: 2_592_000_000,
        year: 31_536_000_000,
      };
      const ms = (msMap[unit] ?? 3_600_000) * amount;
      return new Date(Date.now() - ms).toISOString();
    }

    // Fallback: try native Date parsing, otherwise use now
    const parsed = new Date(age);
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  private hashUrl(url: string): string {
    // Simple deterministic short hash for stable IDs
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = (hash * 31 + url.charCodeAt(i)) >>> 0;
    }
    return hash.toString(36);
  }

  private detectSentiment(text: string): NewsSentiment {
    const positiveScore = POSITIVE_KEYWORDS.filter(kw => text.includes(kw)).length;
    const negativeScore = NEGATIVE_KEYWORDS.filter(kw => text.includes(kw)).length;
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }
}
