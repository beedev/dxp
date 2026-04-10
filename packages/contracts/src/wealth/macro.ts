export interface MacroIndicator {
  country: string;
  countryCode: string;
  indicator: string;
  indicatorCode: string;
  value: number;
  unit: string;
  year: number;
  source: string;
}

export interface CountryProfile {
  code: string;
  name: string;
  flag: string;
  currency: string;
  centralBankRate: number;
  gdpGrowth: number;
  inflation: number;
  gdpUsd: number;
  population: number;
}

export interface MacroFilters {
  country?: string;
  indicator?: string;
  years?: number;
}
