import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InventoryPort, ProductQuery, AdjustStockDto } from './ports/inventory.port';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryPort) {}

  @Get('products')
  @ApiOperation({ summary: 'List products with optional filtering' })
  listProducts(@Query() query: ProductQuery) {
    return this.inventory.listProducts(query);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  getProduct(@Param('id') id: string) {
    return this.inventory.getProduct(id);
  }

  @Get('stock/:storeId')
  @ApiOperation({ summary: 'Get stock levels for a store' })
  getStockLevels(@Param('storeId') storeId: string) {
    return this.inventory.getStockLevels(storeId);
  }

  @Get('barcode/:code')
  @ApiOperation({ summary: 'Lookup product by barcode' })
  barcodeLookup(@Param('code') code: string) {
    return this.inventory.barcodeLookup(code);
  }

  @Patch('stock/:storeId/:productId')
  @ApiOperation({ summary: 'Adjust stock level for a product' })
  adjustStock(
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventory.adjustStock(storeId, productId, dto);
  }
}
