import { Injectable, Logger } from '@nestjs/common';
import { FxRatesSnapshot, FxRate, FxConvertResult, SgdRate } from '@dxp/contracts';
import { FxRatesPort } from '../ports/fx-rates.port';

// Realistic APAC rates vs USD — April 2026
const USD_RATES: Record<string, number> = {
  SGD: 1.348, HKD: 7.786, JPY: 150.24, AUD: 0.645,
  NZD: 0.598, CNY: 7.245, KRW: 1334.5, INR: 83.47,
  MYR: 4.712, THB: 34.89, IDR: 15823.0, PHP: 57.34,
  TWD: 31.87, VND: 24985.0, EUR: 0.921, GBP: 0.789,
  USD: 1.000,
};

// Small daily changes to simulate movement (in pct)
const DAY_CHANGES: Record<string, number> = {
  SGD: 0.08, HKD: -0.01, JPY: -0.34, AUD: 0.21,
  NZD: 0.15, CNY: 0.04, KRW: 0.67, INR: -0.12,
  MYR: 0.23, THB: -0.18, IDR: 0.45, PHP: -0.09,
  TWD: 0.31, VND: 0.02,
};

const CURRENCY_NAMES: Record<string, string> = {
  SGD: 'Singapore Dollar', HKD: 'Hong Kong Dollar', JPY: 'Japanese Yen',
  AUD: 'Australian Dollar', NZD: 'New Zealand Dollar', CNY: 'Chinese Yuan Renminbi',
  KRW: 'South Korean Won', INR: 'Indian Rupee', MYR: 'Malaysian Ringgit',
  THB: 'Thai Baht', IDR: 'Indonesian Rupiah', PHP: 'Philippine Peso',
  TWD: 'Taiwan Dollar', VND: 'Vietnamese Dong',
};

const APAC_CURRENCIES = Object.keys(CURRENCY_NAMES);

@Injectable()
export class MockFxAdapter extends FxRatesPort {
  private readonly logger = new Logger(MockFxAdapter.name);

  async getRates(base: string): Promise<FxRatesSnapshot> {
    const baseUpper = base.toUpperCase();
    const baseRate = USD_RATES[baseUpper];
    if (!baseRate) {
      this.logger.warn(`Unknown base currency: ${baseUpper}, defaulting to USD`);
    }
    const usdBase = baseRate ?? 1;
    const rates: Record<string, number> = {};
    for (const [cur, usdRate] of Object.entries(USD_RATES)) {
      rates[cur] = parseFloat((usdRate / usdBase).toFixed(6));
    }
    return {
      base: baseUpper,
      rates,
      timestamp: new Date().toISOString(),
    };
  }

  async getApacRates(): Promise<FxRate[]> {
    const now = new Date().toISOString();
    return APAC_CURRENCIES.map(cur => {
      const rate = USD_RATES[cur] ?? 1;
      const changePct = DAY_CHANGES[cur] ?? 0;
      const change = parseFloat((rate * changePct / 100).toFixed(4));
      return {
        base: 'USD',
        target: cur,
        rate,
        change,
        changePercent: changePct,
        lastUpdated: now,
      };
    });
  }

  async convert(from: string, to: string, amount: number): Promise<FxConvertResult> {
    const fromRate = USD_RATES[from.toUpperCase()] ?? 1;
    const toRate = USD_RATES[to.toUpperCase()] ?? 1;
    const rate = parseFloat((toRate / fromRate).toFixed(6));
    return {
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount,
      result: parseFloat((amount * rate).toFixed(4)),
      rate,
    };
  }

  async getSgdRates(): Promise<SgdRate[]> {
    const sgdRate = USD_RATES['SGD'];
    const today = new Date().toISOString().split('T')[0];
    return APAC_CURRENCIES
      .filter(cur => cur !== 'SGD')
      .map(cur => {
        const usdRate = USD_RATES[cur] ?? 1;
        const rate = parseFloat((usdRate / sgdRate).toFixed(4));
        return {
          currency: cur,
          name: CURRENCY_NAMES[cur] ?? cur,
          buyRate: parseFloat((rate * 0.993).toFixed(4)),
          sellRate: parseFloat((rate * 1.007).toFixed(4)),
          date: today,
        };
      });
  }
}
