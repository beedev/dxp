import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MarketDataPort } from './ports/market-data.port';

@ApiTags('market')
@Controller('market')
export class MarketDataController {
  constructor(private readonly marketData: MarketDataPort) {}

  @Get('quote/:symbol')
  @ApiOperation({ summary: 'Get real-time quote for a single symbol' })
  getQuote(@Param('symbol') symbol: string) {
    return this.marketData.getQuote(symbol);
  }

  @Get('quotes')
  @ApiOperation({ summary: 'Get real-time quotes for multiple symbols (comma-separated)' })
  @ApiQuery({ name: 'symbols', example: 'D05.SI,0700.HK,7203.T' })
  getQuotes(@Query('symbols') symbols: string) {
    const list = (symbols || '').split(',').map(s => s.trim()).filter(Boolean);
    return this.marketData.getQuotes(list);
  }

  @Get('indices')
  @ApiOperation({ summary: 'Get all major APAC market indices' })
  getApacIndices() {
    return this.marketData.getApacIndices();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for symbols by name or ticker' })
  @ApiQuery({ name: 'q', example: 'toyota' })
  searchSymbols(@Query('q') q: string) {
    return this.marketData.searchSymbols(q || '');
  }

  @Get('history/:symbol')
  @ApiOperation({ summary: 'Get OHLCV price history for a symbol' })
  @ApiQuery({ name: 'range', enum: ['1m', '3m', '6m', '1y', '5y'], required: false })
  getPriceHistory(
    @Param('symbol') symbol: string,
    @Query('range') range: string = '1m',
  ) {
    return this.marketData.getPriceHistory(symbol, range);
  }
}
