import { Injectable, Logger } from '@nestjs/common';
import { CountryProfile, MacroIndicator, MacroFilters } from '@dxp/contracts';
import { MacroDataPort } from '../ports/macro-data.port';

const COUNTRY_PROFILES: CountryProfile[] = [
  { code: 'SG', name: 'Singapore',    flag: '🇸🇬', currency: 'SGD', centralBankRate: 3.68,  gdpGrowth: 3.2, inflation: 2.8, gdpUsd: 466e9,    population: 5_917_600 },
  { code: 'JP', name: 'Japan',        flag: '🇯🇵', currency: 'JPY', centralBankRate: 0.10,  gdpGrowth: 1.1, inflation: 2.9, gdpUsd: 4.2e12,   population: 125_124_000 },
  { code: 'AU', name: 'Australia',    flag: '🇦🇺', currency: 'AUD', centralBankRate: 4.35,  gdpGrowth: 1.8, inflation: 3.4, gdpUsd: 1.7e12,   population: 26_473_500 },
  { code: 'HK', name: 'Hong Kong',    flag: '🇭🇰', currency: 'HKD', centralBankRate: 5.25,  gdpGrowth: 2.1, inflation: 1.8, gdpUsd: 382e9,    population: 7_500_700 },
  { code: 'CN', name: 'China',        flag: '🇨🇳', currency: 'CNY', centralBankRate: 3.45,  gdpGrowth: 4.9, inflation: 0.7, gdpUsd: 17.8e12,  population: 1_412_600_000 },
  { code: 'KR', name: 'South Korea',  flag: '🇰🇷', currency: 'KRW', centralBankRate: 3.25,  gdpGrowth: 2.3, inflation: 2.3, gdpUsd: 1.7e12,   population: 51_712_000 },
  { code: 'IN', name: 'India',        flag: '🇮🇳', currency: 'INR', centralBankRate: 6.50,  gdpGrowth: 7.6, inflation: 5.1, gdpUsd: 3.7e12,   population: 1_428_600_000 },
  { code: 'MY', name: 'Malaysia',     flag: '🇲🇾', currency: 'MYR', centralBankRate: 3.00,  gdpGrowth: 4.4, inflation: 2.6, gdpUsd: 430e9,    population: 33_200_000 },
  { code: 'TH', name: 'Thailand',     flag: '🇹🇭', currency: 'THB', centralBankRate: 2.50,  gdpGrowth: 2.8, inflation: 0.8, gdpUsd: 512e9,    population: 71_697_000 },
  { code: 'ID', name: 'Indonesia',    flag: '🇮🇩', currency: 'IDR', centralBankRate: 6.00,  gdpGrowth: 5.0, inflation: 2.8, gdpUsd: 1.4e12,   population: 277_534_000 },
];

// Extended macro indicator data per country (5 years of data)
function buildIndicators(profile: CountryProfile): MacroIndicator[] {
  const baseYear = 2024;
  const indicators: MacroIndicator[] = [];
  const growthVariance = () => (Math.random() - 0.5) * 0.8;

  for (let i = 0; i < 5; i++) {
    const year = baseYear - i;
    indicators.push(
      {
        country: profile.name,
        countryCode: profile.code,
        indicator: 'GDP Growth Rate',
        indicatorCode: 'NY.GDP.MKTP.KD.ZG',
        value: parseFloat((profile.gdpGrowth + growthVariance()).toFixed(2)),
        unit: '%',
        year,
        source: 'World Bank / IMF',
      },
      {
        country: profile.name,
        countryCode: profile.code,
        indicator: 'Inflation (CPI)',
        indicatorCode: 'FP.CPI.TOTL.ZG',
        value: parseFloat((profile.inflation + growthVariance()).toFixed(2)),
        unit: '%',
        year,
        source: 'World Bank / IMF',
      },
      {
        country: profile.name,
        countryCode: profile.code,
        indicator: 'GDP (current USD)',
        indicatorCode: 'NY.GDP.MKTP.CD',
        value: profile.gdpUsd,
        unit: 'USD',
        year,
        source: 'World Bank',
      },
      {
        country: profile.name,
        countryCode: profile.code,
        indicator: 'Central Bank Policy Rate',
        indicatorCode: 'FR.INR.RINR',
        value: parseFloat((profile.centralBankRate + growthVariance() * 0.3).toFixed(2)),
        unit: '%',
        year,
        source: 'Central Bank',
      },
    );
  }
  return indicators;
}

@Injectable()
export class MockMacroAdapter extends MacroDataPort {
  private readonly logger = new Logger(MockMacroAdapter.name);

  async getCountryProfiles(): Promise<CountryProfile[]> {
    return COUNTRY_PROFILES;
  }

  async getMacroIndicators(countryCode: string, filters: MacroFilters): Promise<MacroIndicator[]> {
    const profile = COUNTRY_PROFILES.find(p => p.code === countryCode.toUpperCase());
    if (!profile) {
      this.logger.warn(`No mock data for country: ${countryCode}`);
      return [];
    }
    const years = filters.years ?? 5;
    let indicators = buildIndicators(profile).slice(0, years * 4);
    if (filters.indicator) {
      indicators = indicators.filter(i =>
        i.indicatorCode.includes(filters.indicator!) || i.indicator.toLowerCase().includes(filters.indicator!.toLowerCase()),
      );
    }
    return indicators;
  }
}
