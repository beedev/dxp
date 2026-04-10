export interface CurrencyInfo {
  code: string;
  name: string;
  flag: string;
  country: string;
  rateVsUsd: number;
  change: number;
  changePct: number;
}

export const APAC_CURRENCIES: CurrencyInfo[] = [
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', country: 'Singapore', rateVsUsd: 1.348, change: 0.002, changePct: 0.15 },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰', country: 'Hong Kong', rateVsUsd: 7.786, change: 0.001, changePct: 0.01 },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', country: 'Japan', rateVsUsd: 150.24, change: -0.34, changePct: -0.23 },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', country: 'Australia', rateVsUsd: 0.645, change: 0.003, changePct: 0.47 },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿', country: 'New Zealand', rateVsUsd: 0.598, change: -0.002, changePct: -0.33 },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', country: 'China', rateVsUsd: 7.245, change: 0.012, changePct: 0.17 },
  { code: 'KRW', name: 'Korean Won', flag: '🇰🇷', country: 'South Korea', rateVsUsd: 1334.5, change: -4.5, changePct: -0.34 },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', country: 'India', rateVsUsd: 83.47, change: 0.12, changePct: 0.14 },
  { code: 'MYR', name: 'Malaysian Ringgit', flag: '🇲🇾', country: 'Malaysia', rateVsUsd: 4.712, change: -0.023, changePct: -0.49 },
  { code: 'THB', name: 'Thai Baht', flag: '🇹🇭', country: 'Thailand', rateVsUsd: 34.89, change: 0.15, changePct: 0.43 },
  { code: 'IDR', name: 'Indonesian Rupiah', flag: '🇮🇩', country: 'Indonesia', rateVsUsd: 15823, change: 45, changePct: 0.28 },
  { code: 'PHP', name: 'Philippine Peso', flag: '🇵🇭', country: 'Philippines', rateVsUsd: 57.34, change: -0.23, changePct: -0.40 },
  { code: 'TWD', name: 'Taiwan Dollar', flag: '🇹🇼', country: 'Taiwan', rateVsUsd: 31.87, change: -0.12, changePct: -0.38 },
  { code: 'VND', name: 'Vietnamese Dong', flag: '🇻🇳', country: 'Vietnam', rateVsUsd: 24985, change: 35, changePct: 0.14 },
];
