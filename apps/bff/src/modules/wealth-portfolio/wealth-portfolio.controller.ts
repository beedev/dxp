import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { WealthPortfolioPort } from './ports/wealth-portfolio.port';
import { PortfolioFilters, Transaction } from '@dxp/contracts';

@ApiTags('wealth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wealth')
export class WealthPortfolioController {
  constructor(private readonly portfolio: WealthPortfolioPort) {}

  @Get('portfolio')
  @ApiOperation({ summary: 'Get portfolio summary for the authenticated user' })
  getPortfolio(
    @DxpContext() ctx: DxpRequestContext,
    @Query('baseCurrency') baseCurrency: string = 'SGD',
  ) {
    return this.portfolio.getPortfolio(ctx.userId, baseCurrency);
  }

  @Get('holdings')
  @ApiOperation({ summary: 'Get individual holdings with optional filters' })
  getHoldings(
    @DxpContext() ctx: DxpRequestContext,
    @Query('baseCurrency') baseCurrency: string = 'SGD',
    @Query('exchange') exchange?: string,
    @Query('sector') sector?: string,
    @Query('currency') currency?: string,
  ) {
    const filters: PortfolioFilters = { exchange, sector, currency };
    return this.portfolio.getHoldings(ctx.userId, baseCurrency, filters);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history for the authenticated user' })
  getTransactions(
    @DxpContext() ctx: DxpRequestContext,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.portfolio.getTransactions(ctx.userId, parseInt(page, 10), parseInt(pageSize, 10));
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Record a new transaction' })
  addTransaction(
    @DxpContext() ctx: DxpRequestContext,
    @Body() tx: Omit<Transaction, 'id'>,
  ) {
    return this.portfolio.addTransaction(ctx.userId, tx);
  }
}
