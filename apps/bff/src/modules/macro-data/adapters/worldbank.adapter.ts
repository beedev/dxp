import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { CountryProfile, MacroIndicator, MacroFilters } from '@dxp/contracts';
import { MacroDataPort } from '../ports/macro-data.port';

const APAC_COUNTRIES = ['SG', 'HK', 'JP', 'AU', 'CN', 'KR', 'IN', 'MY', 'TH', 'ID'];

const COUNTRY_META: Record<string, Omit<CountryProfile, 'centralBankRate' | 'gdpGrowth' | 'inflation' | 'gdpUsd' | 'population'>> = {
  SG: { code: 'SG', name: 'Singapore',    flag: '🇸🇬', currency: 'SGD' },
  HK: { code: 'HK', name: 'Hong Kong',    flag: '🇭🇰', currency: 'HKD' },
  JP: { code: 'JP', name: 'Japan',        flag: '🇯🇵', currency: 'JPY' },
  AU: { code: 'AU', name: 'Australia',    flag: '🇦🇺', currency: 'AUD' },
  CN: { code: 'CN', name: 'China',        flag: '🇨🇳', currency: 'CNY' },
  KR: { code: 'KR', name: 'South Korea',  flag: '🇰🇷', currency: 'KRW' },
  IN: { code: 'IN', name: 'India',        flag: '🇮🇳', currency: 'INR' },
  MY: { code: 'MY', name: 'Malaysia',     flag: '🇲🇾', currency: 'MYR' },
  TH: { code: 'TH', name: 'Thailand',     flag: '🇹🇭', currency: 'THB' },
  ID: { code: 'ID', name: 'Indonesia',    flag: '🇮🇩', currency: 'IDR' },
};

const INDICATORS = [
  { code: 'NY.GDP.MKTP.CD', name: 'GDP (current USD)', unit: 'USD' },
  { code: 'NY.GDP.MKTP.KD.ZG', name: 'GDP Growth Rate', unit: '%' },
  { code: 'FP.CPI.TOTL.ZG', name: 'Inflation (CPI)', unit: '%' },
];

interface WorldBankResponse extends Array<unknown> {
  0: { page: number; pages: number; total: number };
  1: Array<{ country: { value: string }; value: number | null; date: string }>;
}

@Injectable()
export class WorldBankAdapter extends MacroDataPort {
  private readonly logger = new Logger(WorldBankAdapter.name);
  private readonly baseUrl = 'https://api.worldbank.org/v2';

  async getCountryProfiles(): Promise<CountryProfile[]> {
    const results = await Promise.allSettled(
      APAC_COUNTRIES.map(code => this.buildCountryProfile(code)),
    );
    return results
      .filter((r): r is PromiseFulfilledResult<CountryProfile> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  async getMacroIndicators(countryCode: string, filters: MacroFilters): Promise<MacroIndicator[]> {
    const years = filters.years ?? 5;
    const allIndicators: MacroIndicator[] = [];

    for (const ind of INDICATORS) {
      if (filters.indicator && !ind.code.includes(filters.indicator)) continue;
      try {
        const url = `${this.baseUrl}/country/${countryCode.toLowerCase()}/indicator/${ind.code}?format=json&mrv=${years}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as WorldBankResponse;
        const entries = data[1] || [];
        for (const entry of entries) {
          if (entry.value === null) continue;
          allIndicators.push({
            country: entry.country.value,
            countryCode: countryCode.toUpperCase(),
            indicator: ind.name,
            indicatorCode: ind.code,
            value: entry.value,
            unit: ind.unit,
            year: parseInt(entry.date, 10),
            source: 'World Bank',
          });
        }
      } catch (err) {
        this.logger.error(`Failed to fetch indicator ${ind.code} for ${countryCode}: ${(err as Error).message}`);
      }
    }
    return allIndicators;
  }

  private async buildCountryProfile(code: string): Promise<CountryProfile> {
    const meta = COUNTRY_META[code];
    if (!meta) throw new Error(`Unknown country code: ${code}`);

    const [gdpData, growthData, inflationData] = await Promise.allSettled([
      this.fetchLatestIndicator(code, 'NY.GDP.MKTP.CD'),
      this.fetchLatestIndicator(code, 'NY.GDP.MKTP.KD.ZG'),
      this.fetchLatestIndicator(code, 'FP.CPI.TOTL.ZG'),
    ]);

    return {
      ...meta,
      gdpUsd: gdpData.status === 'fulfilled' ? gdpData.value : 0,
      gdpGrowth: growthData.status === 'fulfilled' ? growthData.value : 0,
      inflation: inflationData.status === 'fulfilled' ? inflationData.value : 0,
      centralBankRate: 0, // World Bank does not provide policy rates
      population: 0,
    };
  }

  private async fetchLatestIndicator(countryCode: string, indicatorCode: string): Promise<number> {
    const url = `${this.baseUrl}/country/${countryCode.toLowerCase()}/indicator/${indicatorCode}?format=json&mrv=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as WorldBankResponse;
    const entries = data[1] || [];
    const latest = entries.find(e => e.value !== null);
    if (!latest) throw new Error('No data');
    return latest.value ?? 0;
  }
}
