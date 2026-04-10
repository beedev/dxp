import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type { StockQuote, ApacIndex, PriceBar, SymbolSearchResult } from '@dxp/contracts';

export function useStockQuote(symbol: string, opts?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['market', 'quote', symbol],
    queryFn: () => apiFetch<StockQuote>(`/market/quote/${symbol}`),
    enabled: !!symbol,
    staleTime: 30_000,
    refetchInterval: opts?.refetchInterval,
  });
}

export function useStockQuotes(symbols: string[], opts?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['market', 'quotes', symbols],
    queryFn: () => {
      const qs = new URLSearchParams({ symbols: symbols.join(',') });
      return apiFetch<StockQuote[]>(`/market/quotes?${qs}`);
    },
    enabled: symbols.length > 0,
    staleTime: 30_000,
    refetchInterval: opts?.refetchInterval,
  });
}

export function useApacIndices(opts?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['market', 'indices'],
    queryFn: () => apiFetch<ApacIndex[]>('/market/indices'),
    staleTime: 30_000,
    refetchInterval: opts?.refetchInterval,
  });
}

export function useSymbolSearch(query: string) {
  return useQuery({
    queryKey: ['market', 'search', query],
    queryFn: () => {
      const qs = new URLSearchParams({ q: query });
      return apiFetch<SymbolSearchResult[]>(`/market/search?${qs}`);
    },
    enabled: !!query && query.length > 1,
  });
}

export function usePriceHistory(symbol: string, range = '1m') {
  return useQuery({
    queryKey: ['market', 'history', symbol, range],
    queryFn: () => {
      const qs = new URLSearchParams({ range });
      return apiFetch<PriceBar[]>(`/market/history/${symbol}?${qs}`);
    },
    enabled: !!symbol,
    staleTime: 30_000,
  });
}
