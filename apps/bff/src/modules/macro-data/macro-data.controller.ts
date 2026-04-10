import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MacroDataPort } from './ports/macro-data.port';
import { MacroFilters } from '@dxp/contracts';

@ApiTags('macro')
@Controller('macro')
export class MacroDataController {
  constructor(private readonly macroData: MacroDataPort) {}

  @Get('countries')
  @ApiOperation({ summary: 'Get APAC country macroeconomic profiles' })
  getCountryProfiles() {
    return this.macroData.getCountryProfiles();
  }

  @Get(':countryCode')
  @ApiOperation({ summary: 'Get macro indicators for a specific APAC country' })
  @ApiQuery({ name: 'years', required: false, example: '5' })
  @ApiQuery({ name: 'indicator', required: false, example: 'NY.GDP.MKTP.KD.ZG' })
  getMacroIndicators(
    @Param('countryCode') countryCode: string,
    @Query('years') years?: string,
    @Query('indicator') indicator?: string,
  ) {
    const filters: MacroFilters = {
      indicator,
      years: years ? parseInt(years, 10) : 5,
    };
    return this.macroData.getMacroIndicators(countryCode, filters);
  }
}
