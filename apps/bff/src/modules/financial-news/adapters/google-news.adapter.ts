import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { NewsArticle, NewsFilters, NewsSentiment } from '@dxp/contracts';
import { FinancialNewsPort } from '../ports/financial-news.port';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
}

// ---------------------------------------------------------------------------
// Sentiment keywords
// ---------------------------------------------------------------------------

const POSITIVE_KEYWORDS = [
  'profit', 'surge', 'rally', 'gain', 'growth', 'record', 'beat', 'upgrade',
  'rise', 'bull', 'recovery', 'strong', 'expand',
];

const NEGATIVE_KEYWORDS = [
  'loss', 'fall', 'drop', 'crash', 'decline', 'cut', 'miss', 'downgrade',
  'warning', 'risk', 'concern', 'weak', 'slump', 'plunge',
];

// ---------------------------------------------------------------------------
// Country → Yahoo Finance RSS symbols to aggregate news from
// ---------------------------------------------------------------------------

// Use US-listed stocks/ADRs with APAC exposure — these have daily news unlike local-exchange tickers
const COUNTRY_SYMBOLS: Record<string, string[]> = {
  SG: ['SE', 'GRAB', 'EWS'],             // Sea Limited, Grab (Singapore HQ), iShares Singapore
  HK: ['BABA', 'TCEHY', 'HSBC'],        // Alibaba, Tencent, HSBC (HK-listed majors)
  JP: ['TM', 'SONY', 'EWJ'],            // Toyota, Sony, iShares Japan ETF
  AU: ['BHP', 'RIO', 'ANZ'],            // BHP, Rio Tinto, ANZ (dual-listed)
  IN: ['INFY', 'HDB', 'WIT'],           // Infosys, HDFC Bank, Wipro
  CN: ['BABA', 'TCEHY', 'MCHI'],        // Alibaba, Tencent, iShares China ETF
  KR: ['EWY', 'SKM'],                   // iShares Korea ETF, SK Telecom
};

// Default APAC mix — these indices/ETFs have fresh daily news
const APAC_DEFAULT_SYMBOLS = ['EWJ', 'BABA', 'BHP'];

// Sector → representative APAC-exposed US-listed symbols with daily news
const SECTOR_SYMBOLS: Record<string, string[]> = {
  Technology:    ['TSM', 'BABA', 'SONY'],        // TSMC, Alibaba, Sony
  Financials:    ['HSBC', 'HDB', 'SE'],           // HSBC, HDFC Bank, Sea
  Energy:        ['BHP', 'RIO', 'PTR'],            // BHP, Rio Tinto, PetroChina
  Materials:     ['BHP', 'RIO', 'NEM'],            // BHP, Rio Tinto, Newmont
  Healthcare:    ['SNY', 'NVS', 'TAK'],            // Sanofi, Novartis, Takeda
  'Consumer Discretionary': ['TM', 'HMC', 'BABA'], // Toyota, Honda, Alibaba
  'Consumer Staples':       ['KO', 'UL', 'NSRGY'], // proxy global staples
  REITs:         ['SE', 'GRAB', 'VNQ'],             // SE, Grab, Vanguard REIT
  Industrials:   ['TM', 'HMC', 'HON'],              // Toyota, Honda, Honeywell
  Utilities:     ['EWJ', 'EWA', 'EWS'],             // APAC ETFs proxy
  'Macro / FX':  ['FXI', 'EWJ', 'EWA'],             // China/Japan/Australia ETFs
};

const COUNTRY_NAME: Record<string, string> = {
  SG: 'Singapore', HK: 'Hong Kong', JP: 'Japan',
  AU: 'Australia', IN: 'India', CN: 'China', KR: 'South Korea',
};

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

@Injectable()
export class GoogleNewsAdapter extends FinancialNewsPort {
  private readonly logger = new Logger(GoogleNewsAdapter.name);

  // -------------------------------------------------------------------------
  // Public interface
  // -------------------------------------------------------------------------

  async getApacNews(filters: NewsFilters = {}): Promise<{ articles: NewsArticle[]; total: number }> {
    // Symbol filter: fetch news for a specific ticker directly
    if (filters.symbol) {
      const items = await this.fetchYahooRss(filters.symbol).catch(() => []);
      const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
      let articles = items
        .map((item, idx) => this.mapArticle(item, idx, filters.country))
        .filter(a => new Date(a.publishedAt).getTime() >= cutoff)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      if (filters.sentiment) articles = articles.filter(a => a.sentiment === filters.sentiment);
      const total = articles.length;
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 10;
      return { articles: articles.slice((page - 1) * pageSize, page * pageSize), total };
    }

    // Sector filter: use sector-mapped symbols; intersect with country if both set
    let symbols: string[];
    if (filters.sector && SECTOR_SYMBOLS[filters.sector]) {
      symbols = SECTOR_SYMBOLS[filters.sector];
    } else if (filters.country) {
      symbols = COUNTRY_SYMBOLS[filters.country] ?? APAC_DEFAULT_SYMBOLS;
    } else {
      symbols = APAC_DEFAULT_SYMBOLS;
    }

    const countryCode = filters.country ?? undefined;

    // Fetch RSS feeds for each symbol concurrently, cap at 3 symbols to stay fast
    const symbolsToFetch = symbols.slice(0, 3);
    const results = await Promise.allSettled(
      symbolsToFetch.map(s => this.fetchYahooRss(s)),
    );

    const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000; // current day - 2

    const seen = new Set<string>();
    let articles: NewsArticle[] = [];

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      for (const [idx, item] of result.value.entries()) {
        const article = this.mapArticle(item, idx, countryCode);
        // Deduplicate by URL
        if (seen.has(article.url)) continue;
        seen.add(article.url);
        // Only articles from current day - 2
        if (new Date(article.publishedAt).getTime() < cutoff) continue;
        articles.push(article);
      }
    }

    // Sort newest-first
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    if (filters.sentiment) {
      articles = articles.filter(a => a.sentiment === filters.sentiment);
    }

    const total = articles.length;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const paginated = articles.slice((page - 1) * pageSize, page * pageSize);

    return { articles: paginated, total };
  }

  async getCompanyNews(symbol: string): Promise<NewsArticle[]> {
    try {
      const items = await this.fetchYahooRss(symbol, 10);
      if (items.length > 0) return items.map((item, idx) => this.mapArticle(item, idx));
    } catch {
      this.logger.warn(`Yahoo Finance RSS unavailable for ${symbol}`);
    }
    return [];
  }

  // -------------------------------------------------------------------------
  // Yahoo Finance RSS fetch
  // -------------------------------------------------------------------------

  private async fetchYahooRss(symbol: string, maxItems?: number): Promise<RssItem[]> {
    const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(symbol)}&region=US&lang=en-US`;

    let xml: string;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DXP/1.0)' },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      xml = await res.text();
    } catch (err) {
      this.logger.warn(`Yahoo Finance RSS fetch failed for ${symbol}: ${(err as Error).message}`);
      throw new HttpException('Yahoo Finance RSS unavailable', HttpStatus.BAD_GATEWAY);
    }

    return this.parseRssItems(xml, maxItems);
  }

  // -------------------------------------------------------------------------
  // XML parsing — regex/string only, no external library
  // -------------------------------------------------------------------------

  private parseRssItems(xml: string, maxItems?: number): RssItem[] {
    const items: RssItem[] = [];
    const itemPattern = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;

    while ((match = itemPattern.exec(xml)) !== null) {
      if (maxItems !== undefined && items.length >= maxItems) break;
      try {
        const item = this.parseItemBlock(match[1]);
        if (item) items.push(item);
      } catch {
        // skip malformed items
      }
    }
    return items;
  }

  private parseItemBlock(block: string): RssItem | null {
    const title = this.extractTag(block, 'title');
    const link = this.extractTag(block, 'link');
    const pubDate = this.extractTag(block, 'pubDate');
    const description = this.extractTag(block, 'description');

    if (!title || !link) return null;

    return {
      title: this.decodeHtmlEntities(title),
      link: link.trim(),
      pubDate: pubDate?.trim() ?? new Date().toUTCString(),
      description: this.decodeHtmlEntities(description ?? ''),
      source: '',
    };
  }

  private extractTag(block: string, tag: string): string | null {
    const pattern = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`, 'i');
    const m = pattern.exec(block);
    if (!m) return null;
    return (m[1] ?? m[2] ?? '').trim() || null;
  }

  // -------------------------------------------------------------------------
  // Article mapping
  // -------------------------------------------------------------------------

  private mapArticle(item: RssItem, index: number, country?: string): NewsArticle {
    const { cleanTitle, sourceName } = this.parseTitle(item.title, item.source);
    const id = this.stableId(item.link);
    const sentiment = this.detectSentiment(`${cleanTitle} ${item.description}`);
    const publishedAt = this.parseDate(item.pubDate);

    return {
      id,
      title: cleanTitle,
      source: sourceName,
      url: item.link,
      summary: item.description || cleanTitle,
      publishedAt,
      sentiment,
      tags: [],
      ...(country ? { country } : {}),
    };
  }

  private parseTitle(rawTitle: string, xmlSource: string): { cleanTitle: string; sourceName: string } {
    // Yahoo Finance titles often end with " - Source Name"
    const dashIdx = rawTitle.lastIndexOf(' - ');
    if (dashIdx !== -1) {
      return {
        cleanTitle: rawTitle.slice(0, dashIdx).trim(),
        sourceName: xmlSource || rawTitle.slice(dashIdx + 3).trim(),
      };
    }
    return {
      cleanTitle: rawTitle.trim(),
      sourceName: xmlSource || 'Yahoo Finance',
    };
  }

  // -------------------------------------------------------------------------
  // Sentiment detection
  // -------------------------------------------------------------------------

  private detectSentiment(text: string): NewsSentiment {
    const lower = text.toLowerCase();
    const positiveScore = POSITIVE_KEYWORDS.filter(kw => lower.includes(kw)).length;
    const negativeScore = NEGATIVE_KEYWORDS.filter(kw => lower.includes(kw)).length;
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  // -------------------------------------------------------------------------
  // Utilities
  // -------------------------------------------------------------------------

  private stableId(url: string): string {
    return 'yf-' + Buffer.from(url).toString('base64').slice(0, 12);
  }

  private parseDate(pubDate: string): string {
    try {
      return new Date(pubDate).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }
}
