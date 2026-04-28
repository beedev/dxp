import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  CatalogProduct,
  ProductsPort,
  ProductSearchQuery,
  ProductSearchResult,
} from '../ports/products.port';

/**
 * Proxies catalog search to the conversational-assistant backend, which
 * already does pgvector + OpenAI embeddings against the same product table
 * the embedded chat uses. Single source of truth — ChatGPT and the in-portal
 * chat see identical results.
 *
 * Backend URL is per-tenant via env: `PRODUCTS_BACKEND_URL` (default
 * `http://localhost:8003`, which is the ACE Hardware persona's port).
 */
@Injectable()
export class ConvAssistantProductsAdapter extends ProductsPort {
  private readonly logger = new Logger(ConvAssistantProductsAdapter.name);
  private readonly client: AxiosInstance;

  constructor(config: ConfigService) {
    super();
    const baseURL =
      config.get<string>('PRODUCTS_BACKEND_URL') ?? 'http://localhost:8003';
    this.client = axios.create({ baseURL, timeout: 15_000 });
    this.logger.log(`Catalog search proxied to ${baseURL}`);
  }

  async search(query: ProductSearchQuery): Promise<ProductSearchResult> {
    const params: Record<string, string | number> = { q: query.q };
    // No category filter passthrough — vector search handles semantic
    // relevance, and an exact-match category filter from an external agent
    // (whose taxonomy ≠ ours) just zeroes out otherwise-good results.
    if (query.max_price != null) params.max_price = query.max_price;
    if (query.min_rating != null) params.min_rating = query.min_rating;
    if (query.limit != null) params.limit = query.limit;

    try {
      // Conv-assistant mounts the products router under `/api` (alongside
      // sessions, users, orders, etc.) — the prefix is set in src/main.py.
      const { data } = await this.client.get<{ count: number; products: CatalogProduct[] }>(
        '/api/products/search',
        { params },
      );
      return data;
    } catch (err) {
      this.logger.error(`Catalog backend unreachable: ${(err as Error).message}`);
      // Fail loud — agents need to know discovery is broken so they don't
      // fall back to hallucinating SKUs.
      throw new ServiceUnavailableException('Product catalog unavailable');
    }
  }
}
