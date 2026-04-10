import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { FxRatesSnapshot, FxRate, FxConvertResult, SgdRate } from '@dxp/contracts';
import { FxRatesPort } from '../ports/fx-rates.port';

const APAC_CURRENCIES = ['SGD', 'HKD', 'JPY', 'AUD', 'NZD', 'CNY', 'KRW', 'INR', 'MYR', 'THB', 'IDR', 'PHP', 'TWD', 'VND'];

const CURRENCY_NAMES: Record<string, string> = {
  SGD: 'Singapore Dollar', HKD: 'Hong Kong Dollar', JPY: 'Japanese Yen',
  AUD: 'Australian Dollar', NZD: 'New Zealand Dollar', CNY: 'Chinese Yuan Renminbi',
  KRW: 'South Korean Won', INR: 'Indian Rupee', MYR: 'Malaysian Ringgit',
  THB: 'Thai Baht', IDR: 'Indonesian Rupiah', PHP: 'Philippine Peso',
  TWD: 'Taiwan Dollar', VND: 'Vietnamese Dong',
};

interface CachedSnapshot {
  snapshot: FxRatesSnapshot;
  expiresAt: number;
}

@Injectable()
export class ExchangeRateApiAdapter extends FxRatesPort {
  private readonly logger = new Logger(ExchangeRateApiAdapter.name);
  private readonly baseUrl = 'https://api.exchangerate-api.com/v4/latest';
  private readonly cache = new Map<string, CachedSnapshot>();
  private readonly ttlMs = 60_000;

  async getRates(base: string): Promise<FxRatesSnapshot> {
    const cached = this.cache.get(base);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.snapshot;
    }
    try {
      const res = await fetch(`${this.baseUrl}/${base.toUpperCase()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { base: string; rates: Record<string, number>; date: string };
      const snapshot: FxRatesSnapshot = {
        base: data.base,
        rates: data.rates,
        timestamp: new Date().toISOString(),
      };
      this.cache.set(base, { snapshot, expiresAt: Date.now() + this.ttlMs });
      return snapshot;
    } catch (err) {
      this.logger.error(`getRates failed for base ${base}: ${(err as Error).message}`);
      throw new HttpException('Failed to fetch FX rates', HttpStatus.BAD_GATEWAY);
    }
  }

  async getApacRates(): Promise<FxRate[]> {
    const snapshot = await this.getRates('USD');
    const now = snapshot.timestamp;
    return APAC_CURRENCIES
      .filter(cur => cur in snapshot.rates)
      .map(cur => ({
        base: 'USD',
        target: cur,
        rate: snapshot.rates[cur] ?? 0,
        change: 0,
        changePercent: 0,
        lastUpdated: now,
      }));
  }

  async convert(from: string, to: string, amount: number): Promise<FxConvertResult> {
    const snapshot = await this.getRates(from.toUpperCase());
    const rate = snapshot.rates[to.toUpperCase()];
    if (rate === undefined) {
      throw new HttpException(`Currency not found: ${to}`, HttpStatus.BAD_REQUEST);
    }
    return {
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount,
      result: parseFloat((amount * rate).toFixed(4)),
      rate,
    };
  }

  async getSgdRates(): Promise<SgdRate[]> {
    const snapshot = await this.getRates('SGD');
    const today = new Date().toISOString().split('T')[0];
    return APAC_CURRENCIES
      .filter(cur => cur !== 'SGD' && cur in snapshot.rates)
      .map(cur => {
        const rate = snapshot.rates[cur] ?? 1;
        return {
          currency: cur,
          name: CURRENCY_NAMES[cur] ?? cur,
          buyRate: parseFloat((rate * 0.995).toFixed(4)),
          sellRate: parseFloat((rate * 1.005).toFixed(4)),
          date: today,
        };
      });
  }
}
