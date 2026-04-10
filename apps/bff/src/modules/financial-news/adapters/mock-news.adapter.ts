import { Injectable, Logger } from '@nestjs/common';
import { NewsArticle, NewsFilters } from '@dxp/contracts';
import { FinancialNewsPort } from '../ports/financial-news.port';

const MOCK_ARTICLES: NewsArticle[] = [
  {
    id: 'news-001',
    title: 'DBS Group Reports Record Q1 Profits Amid Strong Regional Lending',
    source: 'The Business Times',
    author: 'Sarah Lim',
    url: 'https://www.businesstimes.com.sg/articles/dbs-record-q1-profits',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    summary: 'DBS Group Holdings has reported record first-quarter profits driven by strong net interest margins and robust loan growth across ASEAN markets. CEO Piyush Gupta highlighted exceptional performance in wealth management and transaction banking divisions.',
    publishedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    sentiment: 'positive',
    tags: ['banking', 'earnings', 'Singapore', 'DBS'],
    country: 'SG',
  },
  {
    id: 'news-002',
    title: 'Hang Seng Index Rallies as China Stimulus Measures Take Effect',
    source: 'South China Morning Post',
    author: 'Michael Chen',
    url: 'https://www.scmp.com/articles/hang-seng-rallies-china-stimulus',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    summary: 'Hong Kong equities surged more than 2% on Monday following news that Beijing\'s latest fiscal stimulus package is showing early signs of effectiveness, with retail sales and manufacturing PMI data beating consensus estimates.',
    publishedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    sentiment: 'positive',
    tags: ['equities', 'China', 'stimulus', 'Hang Seng', 'HSI'],
    country: 'HK',
  },
  {
    id: 'news-003',
    title: 'Bank of Japan Signals Gradual Rate Normalisation Path',
    source: 'Nikkei Asia',
    author: 'Yuki Tanaka',
    url: 'https://asia.nikkei.com/articles/boj-rate-normalisation',
    imageUrl: 'https://images.unsplash.com/photo-1542744095-291d1f67b221?w=800',
    summary: 'Bank of Japan Governor Kazuo Ueda reiterated the central bank\'s commitment to a gradual and data-dependent approach to monetary policy normalisation, keeping markets cautious about the pace of future rate hikes amid mixed economic signals.',
    publishedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    sentiment: 'neutral',
    tags: ['BOJ', 'monetary policy', 'Japan', 'rates'],
    country: 'JP',
  },
  {
    id: 'news-004',
    title: 'RBA Holds Cash Rate at 4.35% as Inflation Eases Towards Target Band',
    source: 'Australian Financial Review',
    author: 'James Robertson',
    url: 'https://www.afr.com/articles/rba-holds-rate-april-2026',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    summary: 'The Reserve Bank of Australia held the cash rate unchanged at 4.35% at its April board meeting, citing progress towards its 2-3% inflation target band while noting that the labour market remains resilient with unemployment at 3.8%.',
    publishedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    sentiment: 'neutral',
    tags: ['RBA', 'interest rates', 'Australia', 'inflation'],
    country: 'AU',
  },
  {
    id: 'news-005',
    title: 'Tencent Beats Revenue Forecasts on Gaming and Cloud Recovery',
    source: 'Reuters',
    author: 'Linda Wei',
    url: 'https://www.reuters.com/articles/tencent-beats-revenue-forecasts',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
    summary: 'Tencent Holdings exceeded analyst revenue expectations in its latest quarterly results, with its gaming division recovering strongly following regulatory approvals of new titles and its cloud business posting double-digit growth as enterprise clients accelerate AI adoption.',
    publishedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    sentiment: 'positive',
    tags: ['Tencent', 'gaming', 'cloud', 'China', 'earnings'],
    country: 'HK',
  },
  {
    id: 'news-006',
    title: 'HDFC Bank Sees Surge in Digital Payments Volume Across India',
    source: 'Economic Times',
    author: 'Priya Sharma',
    url: 'https://economictimes.indiatimes.com/articles/hdfc-digital-payments-surge',
    imageUrl: 'https://images.unsplash.com/photo-1616514197671-15d99ce7a6f8?w=800',
    summary: 'HDFC Bank reported a 34% year-on-year increase in UPI transaction volumes, reflecting India\'s rapid digital payment adoption. The bank processed over 2.1 billion digital transactions in Q1, driven by its mobile banking app and merchant QR network expansion.',
    publishedAt: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
    sentiment: 'positive',
    tags: ['HDFC', 'digital payments', 'India', 'fintech'],
    country: 'IN',
  },
  {
    id: 'news-007',
    title: 'Singapore REITs Face Headwinds as Interest Rates Remain Elevated',
    source: 'The Straits Times',
    author: 'David Tan',
    url: 'https://www.straitstimes.com/articles/singapore-reits-headwinds',
    imageUrl: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=800',
    summary: 'Singapore Real Estate Investment Trusts (S-REITs) are facing sustained pressure from elevated financing costs as global interest rates remain higher for longer. Several major REITs have flagged potential distribution per unit (DPU) compression in their latest updates.',
    publishedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    sentiment: 'negative',
    tags: ['REITs', 'Singapore', 'property', 'interest rates'],
    country: 'SG',
  },
  {
    id: 'news-008',
    title: 'BHP Reports Strong Iron Ore Shipments to China for Q1',
    source: 'The Australian',
    author: 'Mark Thompson',
    url: 'https://www.theaustralian.com.au/articles/bhp-iron-ore-shipments',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
    summary: 'Mining giant BHP has reported record iron ore shipments to China for the March quarter, as Chinese steel mills ramped up production ahead of the summer construction season. The company maintained its full-year iron ore guidance of 255-265 million tonnes.',
    publishedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    sentiment: 'positive',
    tags: ['BHP', 'iron ore', 'Australia', 'China', 'commodities'],
    country: 'AU',
  },
  {
    id: 'news-009',
    title: 'ASEAN Central Banks Coordinate on Currency Stability Amid USD Strength',
    source: 'Nikkei Asia',
    author: 'Rachel Ng',
    url: 'https://asia.nikkei.com/articles/asean-central-banks-coordinate',
    imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800',
    summary: 'Finance ministers and central bank governors from ASEAN member states met in Kuala Lumpur to discuss coordinated responses to the strengthening US dollar, which has put pressure on regional currencies. The meeting reaffirmed commitment to orderly currency markets.',
    publishedAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    sentiment: 'neutral',
    tags: ['ASEAN', 'central banks', 'currency', 'FX', 'regional'],
    country: undefined,
  },
  {
    id: 'news-010',
    title: 'SoftBank Portfolio Companies Show Recovery After AI Investment Surge',
    source: 'Nikkei Asia',
    author: 'Kenji Nakamura',
    url: 'https://asia.nikkei.com/articles/softbank-portfolio-recovery',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    summary: 'SoftBank Group\'s Vision Fund portfolio is showing signs of recovery, with several AI-focused investments reporting strong revenue growth. Chief executive Masayoshi Son expressed renewed optimism about the artificial intelligence investment theme, signalling potential new large-scale AI infrastructure bets.',
    publishedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    sentiment: 'positive',
    tags: ['SoftBank', 'AI', 'venture capital', 'Japan', 'technology'],
    country: 'JP',
  },
];

@Injectable()
export class MockNewsAdapter extends FinancialNewsPort {
  private readonly logger = new Logger(MockNewsAdapter.name);

  async getApacNews(filters: NewsFilters): Promise<{ articles: NewsArticle[]; total: number }> {
    let articles = [...MOCK_ARTICLES];

    if (filters.country) {
      articles = articles.filter(a => a.country === filters.country || !a.country);
    }
    if (filters.sentiment) {
      articles = articles.filter(a => a.sentiment === filters.sentiment);
    }
    if (filters.query) {
      const q = filters.query.toLowerCase();
      articles = articles.filter(
        a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q)),
      );
    }
    if (filters.sector) {
      const sector = filters.sector.toLowerCase();
      articles = articles.filter(a => a.tags.some(t => t.toLowerCase().includes(sector)));
    }

    const total = articles.length;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const paginated = articles.slice((page - 1) * pageSize, page * pageSize);

    return { articles: paginated, total };
  }

  async getCompanyNews(symbol: string): Promise<NewsArticle[]> {
    const sym = symbol.toLowerCase().replace(/\.[a-z]+$/, ''); // strip exchange suffix
    const nameMap: Record<string, string[]> = {
      'd05': ['dbs'], '0700': ['tencent'], '7203': ['toyota'],
      'bhp': ['bhp', 'iron ore'], 'hdfcbank': ['hdfc'],
      '9988': ['alibaba'], 'm44u': ['mapletree', 'reit'],
      '9984': ['softbank'],
    };
    const keywords = nameMap[sym] || [sym];
    return MOCK_ARTICLES.filter(a =>
      keywords.some(kw => a.title.toLowerCase().includes(kw) || a.tags.some(t => t.toLowerCase().includes(kw))),
    );
  }
}
