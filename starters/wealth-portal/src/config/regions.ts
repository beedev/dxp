// ─────────────────────────────────────────────────────────────────────────────
// Region Configuration
//
// Every page in the wealth portal reads from this file (and region-mock.ts)
// to render locale-correct, jurisdiction-correct content.
//
// ADDING A NEW REGION (e.g. US, UK, AU, JP):
//   1. Define a new const `US: RegionConfig = { ... }` below
//   2. Add `US` to the `REGIONS` map at the bottom
//   3. Add a matching entry in `src/data/region-mock.ts` REGION_MOCK
//   → Zero page-level changes required.
// ─────────────────────────────────────────────────────────────────────────────

export type RegionId = 'SG' | 'IN';

export interface RetirementAccount {
  key: 'oa' | 'sa' | 'ma' | 'ra';
  label: string;
  color: string;       // tailwind bg class
  desc: string;
  rate: string;        // display label e.g. "2.5%"
}

export interface RetirementConfig {
  scheme: string;                      // "CPF" | "NPS / EPF"
  investmentSchemeLabel: string;       // "CPF Investment Scheme (CPFIS-OA)"
  monthlyContributionDefault: number;  // native currency units
  projectionReturnPct: number;         // e.g. 0.05 for 5%
  accounts: RetirementAccount[];
}

export interface TaxConfig {
  year: string;                        // "YA 2026" | "FY2026-27"
  hasCapitalGainsTax: boolean;
  capitalGainsLabel: string;           // "LTCG / STCG" | "None — no capital gains tax"
  sectionLabel: string;                // "SRS" | "Section 80C"
  sectionAnnualLimit: number;
  /** Withholding tax rate by foreign dividend source country (0-100 pct) */
  dividendWhtByCountry: Record<string, number>;
  /** Bullet points shown on the Tax Summary page */
  rules: string[];
}

export interface MacroConfig {
  centralBank: string;
  policyRate: number;
  gdpGrowthYoY: number;
  inflationYoY: number;
  unemploymentRate: number;
  currencyStrengthYtd: number;  // % vs USD
  /** Peer countries to render in the macro comparison table */
  peerCountries: string[];
}

export interface RegionConfig {
  // ── Identity ─────────────────────────────────────────────────────────────
  id: RegionId;
  name: string;
  flag: string;
  timezone: string;               // IANA tz, e.g. 'Asia/Kolkata'

  // ── Currency ─────────────────────────────────────────────────────────────
  currency: {
    code: string;                 // ISO 4217: 'INR'
    symbol: string;               // display symbol: '₹'
    locale: string;               // BCP-47: 'en-IN'
  };

  // ── Markets & exchanges ──────────────────────────────────────────────────
  defaultExchanges: string[];     // pre-selected in Screener
  allExchanges: string[];         // full Screener filter option list
  pulseIndices: string[];         // shown in dashboard market-pulse strip
  benchmarkIndex: string;         // symbol used for Analytics benchmark chart
  benchmarkLabel: string;         // e.g. 'Sensex' or 'STI'

  // ── Trading ──────────────────────────────────────────────────────────────
  defaultSymbol: string;          // TradingTerminal initial scrip
  defaultOrderExchange: string;   // submitted with every new order

  // ── FX ───────────────────────────────────────────────────────────────────
  fxBaseCurrency: string;
  fxReferencePairs: { pair: string; from: string }[];
  availableCurrencies: string[];  // Settings base-currency dropdown options

  // ── News ─────────────────────────────────────────────────────────────────
  newsDefaultCountry: string;
  newsDefaultKeyword: string;
  newsCountries: string[];        // News page country dropdown

  // ── Retirement scheme (country-specific pension system) ──────────────────
  retirement: RetirementConfig;

  // ── Tax regime ───────────────────────────────────────────────────────────
  tax: TaxConfig;

  // ── Macro indicators ─────────────────────────────────────────────────────
  macro: MacroConfig;

  // ── UI labels ────────────────────────────────────────────────────────────
  marketLabel: string;            // "SGX" | "NSE/BSE"
  marketHeadline: string;         // "APAC Markets" | "Indian Markets"
}

// ─────────────────────────────────────────────────────────────────────────────
// 🇸🇬 Singapore
// ─────────────────────────────────────────────────────────────────────────────

const SG: RegionConfig = {
  id: 'SG',
  name: 'Singapore',
  flag: '🇸🇬',
  timezone: 'Asia/Singapore',

  currency: { code: 'SGD', symbol: 'S$', locale: 'en-SG' },

  defaultExchanges: ['SGX', 'HKEX'],
  allExchanges: ['SGX', 'HKEX', 'TSE', 'ASX', 'NSE', 'BSE', 'KRX', 'SSE'],
  pulseIndices: ['^STI', '^HSI', '^N225', '^AXJO', '^BSESN', '^KS11'],
  benchmarkIndex: '^STI',
  benchmarkLabel: 'STI',

  defaultSymbol: 'D05.SI',
  defaultOrderExchange: 'SGX',

  fxBaseCurrency: 'SGD',
  fxReferencePairs: [
    { pair: 'USD/SGD', from: 'USD' },
    { pair: 'EUR/SGD', from: 'EUR' },
    { pair: 'JPY/SGD', from: 'JPY' },
    { pair: 'CNY/SGD', from: 'CNY' },
    { pair: 'AUD/SGD', from: 'AUD' },
    { pair: 'GBP/SGD', from: 'GBP' },
    { pair: 'MYR/SGD', from: 'MYR' },
    { pair: 'INR/SGD', from: 'INR' },
  ],
  availableCurrencies: ['SGD', 'USD', 'HKD', 'AUD', 'JPY', 'INR'],

  newsDefaultCountry: 'SG',
  newsDefaultKeyword: 'STI',
  newsCountries: ['All', 'SG', 'HK', 'JP', 'AU', 'IN'],

  retirement: {
    scheme: 'CPF',
    investmentSchemeLabel: 'CPF Investment Scheme (CPFIS-OA)',
    monthlyContributionDefault: 1000,
    projectionReturnPct: 0.05,
    accounts: [
      { key: 'oa', label: 'Ordinary Account',   color: 'bg-amber-400',   desc: 'Housing, education & investments', rate: '2.5%' },
      { key: 'sa', label: 'Special Account',    color: 'bg-emerald-400', desc: 'Retirement savings',               rate: '4.0%' },
      { key: 'ma', label: 'Medisave Account',   color: 'bg-blue-400',    desc: 'Healthcare expenses',              rate: '4.0%' },
      { key: 'ra', label: 'Retirement Account', color: 'bg-purple-400',  desc: 'Created at age 55',                rate: '4.0%' },
    ],
  },

  tax: {
    year: 'YA 2026',
    hasCapitalGainsTax: false,
    capitalGainsLabel: 'None — Singapore does not tax capital gains',
    sectionLabel: 'SRS',
    sectionAnnualLimit: 15300,
    dividendWhtByCountry: { Singapore: 0, 'Hong Kong': 0, Japan: 15.315, Australia: 15, India: 20, China: 10 },
    rules: [
      'Singapore operates a territorial tax system — foreign-sourced income is generally exempt if received by a resident.',
      'Dividends from Singapore-resident companies are tax-exempt in the hands of shareholders (one-tier system).',
      'No capital gains tax on disposal of shares, including listed equities.',
      'Foreign dividends are exempt under Section 13(8) of the Income Tax Act if the headline rate in the source country is at least 15%.',
      'SRS contributions up to S$15,300 per year are tax-deductible.',
    ],
  },

  macro: {
    centralBank: 'MAS',
    policyRate: 3.50,
    gdpGrowthYoY: 3.2,
    inflationYoY: 2.8,
    unemploymentRate: 2.0,
    currencyStrengthYtd: 1.4,
    peerCountries: ['Hong Kong', 'Japan', 'Australia', 'South Korea'],
  },

  marketLabel: 'SGX',
  marketHeadline: 'APAC Markets',
};

// ─────────────────────────────────────────────────────────────────────────────
// 🇮🇳 India
// ─────────────────────────────────────────────────────────────────────────────

const IN: RegionConfig = {
  id: 'IN',
  name: 'India',
  flag: '🇮🇳',
  timezone: 'Asia/Kolkata',

  currency: { code: 'INR', symbol: '₹', locale: 'en-IN' },

  defaultExchanges: ['NSE', 'BSE'],
  allExchanges: ['NSE', 'BSE', 'SGX', 'HKEX', 'TSE', 'ASX', 'KRX', 'SSE'],
  pulseIndices: ['^BSESN', '^NSEI', '^NSEBANK', '^CNXMIDCAP', '^STI', '^HSI'],
  benchmarkIndex: '^BSESN',
  benchmarkLabel: 'Sensex',

  defaultSymbol: 'RELIANCE.NS',
  defaultOrderExchange: 'NSE',

  fxBaseCurrency: 'INR',
  fxReferencePairs: [
    { pair: 'USD/INR', from: 'USD' },
    { pair: 'EUR/INR', from: 'EUR' },
    { pair: 'GBP/INR', from: 'GBP' },
    { pair: 'JPY/INR', from: 'JPY' },
    { pair: 'SGD/INR', from: 'SGD' },
    { pair: 'AUD/INR', from: 'AUD' },
    { pair: 'CNY/INR', from: 'CNY' },
    { pair: 'AED/INR', from: 'AED' },
  ],
  availableCurrencies: ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED'],

  newsDefaultCountry: 'IN',
  newsDefaultKeyword: 'Sensex',
  newsCountries: ['All', 'IN', 'US', 'SG', 'HK', 'JP'],

  retirement: {
    scheme: 'NPS / EPF',
    investmentSchemeLabel: 'NPS Tier-II · Direct Equity',
    monthlyContributionDefault: 50000,
    projectionReturnPct: 0.09,
    accounts: [
      { key: 'oa', label: 'NPS Tier-I',  color: 'bg-amber-400',   desc: 'Long-term pension corpus',      rate: '8–10%' },
      { key: 'sa', label: 'EPF',         color: 'bg-emerald-400', desc: 'Employee Provident Fund',       rate: '8.15%' },
      { key: 'ma', label: 'PPF',         color: 'bg-blue-400',    desc: 'Public Provident Fund',         rate: '7.1%' },
      { key: 'ra', label: 'Gratuity',    color: 'bg-purple-400',  desc: 'Employer gratuity fund',        rate: 'N/A' },
    ],
  },

  tax: {
    year: 'FY2026-27 (AY 2027-28)',
    hasCapitalGainsTax: true,
    capitalGainsLabel: 'LTCG 10% over ₹1L · STCG 15% on listed equities',
    sectionLabel: 'Section 80C',
    sectionAnnualLimit: 150000,
    dividendWhtByCountry: { India: 0, 'Hong Kong': 0, Singapore: 0, Japan: 15.315, Australia: 15, 'United States': 25 },
    rules: [
      'Dividend income is taxed at the investor\'s marginal slab rate (post FY2020-21). TDS of 10% applies above ₹5,000 per payer.',
      'Long Term Capital Gains (LTCG) on listed equities held >12 months: 10% on gains exceeding ₹1,00,000 per financial year.',
      'Short Term Capital Gains (STCG) on listed equities held ≤12 months: 15% flat.',
      'Section 80C allows up to ₹1,50,000 of deductions (ELSS, PPF, EPF, NPS Tier-I, life insurance premiums, home loan principal).',
      'Additional ₹50,000 deduction under Section 80CCD(1B) exclusively for NPS contributions.',
      'Securities Transaction Tax (STT): 0.1% on equity delivery trades, 0.025% on intraday sell legs.',
    ],
  },

  macro: {
    centralBank: 'RBI',
    policyRate: 6.50,
    gdpGrowthYoY: 7.1,
    inflationYoY: 4.8,
    unemploymentRate: 7.8,
    currencyStrengthYtd: -0.6,
    peerCountries: ['China', 'Indonesia', 'Vietnam', 'Thailand'],
  },

  marketLabel: 'NSE/BSE',
  marketHeadline: 'Indian Markets',
};

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

export const REGIONS: Record<RegionId, RegionConfig> = { SG, IN };

/** Resolve starting region: VITE_REGION env var → SG fallback */
export function resolveDefaultRegion(): RegionId {
  const env = (import.meta as any).env?.VITE_REGION as string | undefined;
  if (env && env in REGIONS) return env as RegionId;
  return 'SG';
}
