export type NewsSentiment = 'positive' | 'negative' | 'neutral';

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  author?: string;
  url: string;
  imageUrl?: string;
  summary: string;
  publishedAt: string;
  sentiment: NewsSentiment;
  tags: string[];
  country?: string;
}

export interface NewsFilters {
  query?: string;
  symbol?: string;
  category?: string;
  country?: string;
  sector?: string;
  sentiment?: NewsSentiment;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
