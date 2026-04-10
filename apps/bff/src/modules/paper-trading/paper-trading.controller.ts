import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { PaperTradingPort } from './ports/paper-trading.port';
import { PlaceOrderRequest, CreateAlertRequest, OrderStatus } from '@dxp/contracts';

@ApiTags('paper-trading')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('paper')
export class PaperTradingController {
  constructor(private readonly paperTrading: PaperTradingPort) {}

  @Get('portfolio')
  @ApiOperation({ summary: 'Get the paper trading portfolio summary' })
  getPaperPortfolio(@DxpContext() ctx: DxpRequestContext) {
    return this.paperTrading.getPaperPortfolio(ctx.userId);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get paper trading orders with optional status filter' })
  getOrders(
    @DxpContext() ctx: DxpRequestContext,
    @Query('status') status?: string,
  ) {
    return this.paperTrading.getOrders(ctx.userId, status as OrderStatus | undefined);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Place a new paper trading order' })
  placeOrder(
    @DxpContext() ctx: DxpRequestContext,
    @Body() req: PlaceOrderRequest,
  ) {
    return this.paperTrading.placeOrder(ctx.userId, req);
  }

  @Delete('orders/:id')
  @ApiOperation({ summary: 'Cancel a pending paper trading order' })
  cancelOrder(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
  ) {
    return this.paperTrading.cancelOrder(ctx.userId, id);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get price alerts for the authenticated user' })
  getAlerts(@DxpContext() ctx: DxpRequestContext) {
    return this.paperTrading.getAlerts(ctx.userId);
  }

  @Post('alerts')
  @ApiOperation({ summary: 'Create a new price alert' })
  createAlert(
    @DxpContext() ctx: DxpRequestContext,
    @Body() req: CreateAlertRequest,
  ) {
    return this.paperTrading.createAlert(ctx.userId, req);
  }

  @Delete('alerts/:id')
  @ApiOperation({ summary: 'Delete a price alert' })
  deleteAlert(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
  ) {
    return this.paperTrading.deleteAlert(ctx.userId, id);
  }
}
