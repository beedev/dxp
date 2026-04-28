/**
 * ProductsPort — agent-friendly merchant catalog search.
 *
 * UCP itself is *only* the commerce protocol (checkout sessions). Product
 * discovery is a separate concern that UCP-aware agents *consult* before
 * placing items into a session. This port abstracts however the catalog
 * search is fulfilled (proxy to conv-assistant pgvector, direct DB, hosted
 * Algolia, etc.).
 */

export interface ProductSearchQuery {
  q: string;
  max_price?: number;
  min_rating?: number;
  limit?: number;
}

export interface CatalogProduct {
  id: string;
  sku?: string | null;
  name: string;
  brand?: string | null;
  category?: string | null;
  /** Minor units (cents) — drops directly into UCP LineItemRef.price */
  price_cents: number | null;
  description?: string | null;
  rating?: number | null;
  review_count?: number | null;
  image_url?: string | null;
}

export interface ProductSearchResult {
  count: number;
  products: CatalogProduct[];
}

export abstract class ProductsPort {
  abstract search(query: ProductSearchQuery): Promise<ProductSearchResult>;
}
