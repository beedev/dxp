import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FinancialNewsPort } from './ports/financial-news.port';
import { NewsFilters, NewsSentiment } from '@dxp/contracts';

@ApiTags('news')
@Controller('news')
export class FinancialNewsController {
  constructor(private readonly news: FinancialNewsPort) {}

  @Get()
  @ApiOperation({ summary: 'Get APAC financial news with optional filters' })
  @ApiQuery({ name: 'country', required: false, example: 'SG' })
  @ApiQuery({ name: 'sector', required: false, example: 'Technology' })
  @ApiQuery({ name: 'symbol', required: false, example: 'BABA' })
  @ApiQuery({ name: 'sentiment', required: false, enum: ['positive', 'negative', 'neutral'] })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'pageSize', required: false, example: '10' })
  getApacNews(
    @Query('country') country?: string,
    @Query('sector') sector?: string,
    @Query('symbol') symbol?: string,
    @Query('sentiment') sentiment?: string,
    @Query('query') query?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const filters: NewsFilters = {
      country,
      sector,
      symbol,
      sentiment: sentiment as NewsSentiment | undefined,
      query,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
    };
    return this.news.getApacNews(filters);
  }

  @Get(':symbol')
  @ApiOperation({ summary: 'Get news articles related to a specific stock symbol' })
  getCompanyNews(@Param('symbol') symbol: string) {
    return this.news.getCompanyNews(symbol);
  }
}
