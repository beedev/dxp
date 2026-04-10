import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { WatchlistPort } from './ports/watchlist.port';

@ApiTags('watchlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlist: WatchlistPort) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user\'s watchlist' })
  getWatchlist(@DxpContext() ctx: DxpRequestContext) {
    return this.watchlist.getWatchlist(ctx.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a symbol to the watchlist' })
  addToWatchlist(
    @DxpContext() ctx: DxpRequestContext,
    @Body() body: { symbol: string; exchange: string },
  ) {
    return this.watchlist.addToWatchlist(ctx.userId, body.symbol, body.exchange);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a symbol from the watchlist by item ID' })
  removeFromWatchlist(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
  ) {
    return this.watchlist.removeFromWatchlist(ctx.userId, id);
  }
}
