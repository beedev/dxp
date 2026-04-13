import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';

export function useProducts(query?: { search?: string; category?: string; page?: number }) {
  return useQuery({
    queryKey: ['inventory', 'products', query],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (query?.search) qs.set('search', query.search);
      if (query?.category) qs.set('category', query.category);
      if (query?.page) qs.set('page', String(query.page));
      return apiFetch(`/inventory/products?${qs}`);
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['inventory', 'products', id],
    queryFn: () => apiFetch(`/inventory/products/${id}`),
    enabled: !!id,
  });
}

export function useStockLevels(storeId: string) {
  return useQuery({
    queryKey: ['inventory', 'stock', storeId],
    queryFn: () => apiFetch(`/inventory/stock/${storeId}`),
    enabled: !!storeId,
  });
}

export function useBarcodeLookup(barcode: string) {
  return useQuery({
    queryKey: ['inventory', 'barcode', barcode],
    queryFn: () => apiFetch(`/inventory/barcode/${barcode}`),
    enabled: !!barcode,
  });
}
