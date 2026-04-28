import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsPort } from './ports/products.port';

/**
 * Merchant product catalog — search endpoint that UCP-aware agents call
 * before placing items into a checkout session. Public on purpose: catalog
 * data is shopfront-facing. Auth-gate in production by adding @UseGuards
 * here, same as the rest of the BFF.
 */
@ApiTags('catalog')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsPort) {}

  @Get('search')
  @ApiOperation({ summary: 'Search the merchant product catalog' })
  search(
    @Query('q') q: string,
    @Query('max_price') maxPrice?: string,
    @Query('min_rating') minRating?: string,
    @Query('limit') limit?: string,
  ) {
    return this.products.search({
      q: q ?? '',
      max_price: maxPrice ? Number(maxPrice) : undefined,
      min_rating: minRating ? Number(minRating) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
