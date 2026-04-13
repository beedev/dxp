import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PosConnectorPort } from './ports/pos-connector.port';

@ApiTags('pos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pos')
export class PosConnectorController {
  constructor(private readonly pos: PosConnectorPort) {}

  @Get('sales/daily/:storeId')
  @ApiOperation({ summary: 'Get daily sales for a store' })
  getDailySales(@Param('storeId') storeId: string, @Query('date') date: string) {
    return this.pos.getDailySales(storeId, date || new Date().toISOString().split('T')[0]);
  }

  @Get('sales/range/:storeId')
  @ApiOperation({ summary: 'Get sales for a date range' })
  getSalesRange(
    @Param('storeId') storeId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.pos.getSalesRange(storeId, from, to);
  }

  @Get('categories/:storeId')
  @ApiOperation({ summary: 'Get category breakdown for a store' })
  getCategoryBreakdown(@Param('storeId') storeId: string) {
    return this.pos.getCategoryBreakdown(storeId);
  }

  @Get('top-sellers/:storeId')
  @ApiOperation({ summary: 'Get top sellers for a store' })
  getTopSellers(@Param('storeId') storeId: string) {
    return this.pos.getTopSellers(storeId);
  }
}
