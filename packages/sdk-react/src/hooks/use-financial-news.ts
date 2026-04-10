import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type { NewsArticle, NewsFilters } from '@dxp/contracts';

export function useApacNews(filters?: NewsFilters & { refetchInterval?: number }) {
  const { refetchInterval, ...queryFilters } = filters ?? {};
  return useQuery({
    queryKey: ['news', 'apac', queryFilters],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (queryFilters.symbol) qs.set('symbol', queryFilters.symbol);
      if (queryFilters.sector) qs.set('sector', queryFilters.sector);
      if (queryFilters.category) qs.set('category', queryFilters.category);
      if (queryFilters.country) qs.set('country', queryFilters.country);
      if (queryFilters.dateFrom) qs.set('dateFrom', queryFilters.dateFrom);
      if (queryFilters.dateTo) qs.set('dateTo', queryFilters.dateTo);
      if (queryFilters.page) qs.set('page', String(queryFilters.page));
      if (queryFilters.pageSize) qs.set('pageSize', String(queryFilters.pageSize));
      const query = qs.toString();
      return apiFetch<{ articles: NewsArticle[]; total: number } | NewsArticle[]>(query ? `/news?${qs}` : '/news')
        .then((r) => (Array.isArray(r) ? r : r.articles));
    },
    staleTime: 300_000,
    refetchInterval,
  });
}

export function useCompanyNews(symbol: string) {
  return useQuery({
    queryKey: ['news', symbol],
    queryFn: () => apiFetch<NewsArticle[]>(`/news/${symbol}`),
    enabled: !!symbol,
    staleTime: 300_000,
  });
}
