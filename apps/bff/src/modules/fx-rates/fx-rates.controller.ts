import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FxRatesPort } from './ports/fx-rates.port';

@ApiTags('fx')
@Controller('fx')
export class FxRatesController {
  constructor(private readonly fx: FxRatesPort) {}

  @Get('rates')
  @ApiOperation({ summary: 'Get FX rates for a given base currency' })
  @ApiQuery({ name: 'base', example: 'USD', required: false })
  getRates(@Query('base') base: string = 'USD') {
    return this.fx.getRates(base);
  }

  @Get('apac')
  @ApiOperation({ summary: 'Get all APAC currency rates vs USD with daily change' })
  getApacRates() {
    return this.fx.getApacRates();
  }

  @Get('convert')
  @ApiOperation({ summary: 'Convert an amount from one currency to another' })
  @ApiQuery({ name: 'from', example: 'USD' })
  @ApiQuery({ name: 'to', example: 'SGD' })
  @ApiQuery({ name: 'amount', example: '1000' })
  convert(
    @Query('from') from: string = 'USD',
    @Query('to') to: string = 'SGD',
    @Query('amount') amount: string = '1',
  ) {
    return this.fx.convert(from, to, parseFloat(amount) || 1);
  }

  @Get('sgd')
  @ApiOperation({ summary: 'Get MAS-style SGD buy/sell rates for APAC currencies' })
  getSgdRates() {
    return this.fx.getSgdRates();
  }
}
