import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StockQuote, ApacIndex, SymbolSearchResult, PriceBar } from '@dxp/contracts';
import { MarketDataPort } from '../ports/market-data.port';

// Exchange open hours in UTC for isMarketOpen computation
const EXCHANGE_HOURS: Record<string, { open: number; close: number; tz: string }> = {
  HKD: { open: 1, close: 9, tz: 'Asia/Hong_Kong' },    // 09:00–17:00 HKT = 01:00–09:00 UTC
  JPY: { open: 0, close: 6, tz: 'Asia/Tokyo' },         // 09:00–15:30 JST = 00:00–06:30 UTC
  AUD: { open: 23, close: 5, tz: 'Australia/Sydney' },  // 10:00–16:00 AEST = 00:00–06:00 UTC
  SGD: { open: 1, close: 9, tz: 'Asia/Singapore' },     // 09:00–17:00 SGT = 01:00–09:00 UTC
};

const APAC_INDEX_SYMBOLS = [
  '^HSI', '^N225', '^AXJO', '^STI', '^KS11',
  '^BSESN', '^NSEI', '^KLSE', '^SET.BK', '^JKSE', '^TWII', '000001.SS',
];

const INDEX_META: Record<string, Omit<ApacIndex, 'value' | 'change' | 'changePercent' | 'isMarketOpen'>> = {
  '^HSI':    { symbol: '^HSI',    name: 'Hang Seng Index', exchange: 'HKEX', country: 'Hong Kong', flag: '🇭🇰', timezone: 'Asia/Hong_Kong',    sessionOpen: '09:30', sessionClose: '16:00' },
  '^N225':   { symbol: '^N225',   name: 'Nikkei 225',      exchange: 'TSE',  country: 'Japan',     flag: '🇯🇵', timezone: 'Asia/Tokyo',          sessionOpen: '09:00', sessionClose: '15:30' },
  '^AXJO':   { symbol: '^AXJO',   name: 'S&P/ASX 200',     exchange: 'ASX',  country: 'Australia', flag: '🇦🇺', timezone: 'Australia/Sydney',    sessionOpen: '10:00', sessionClose: '16:00' },
  '^STI':    { symbol: '^STI',    name: 'Straits Times Index', exchange: 'SGX', country: 'Singapore', flag: '🇸🇬', timezone: 'Asia/Singapore', sessionOpen: '09:00', sessionClose: '17:00' },
  '^KS11':   { symbol: '^KS11',   name: 'KOSPI',           exchange: 'KRX',  country: 'South Korea', flag: '🇰🇷', timezone: 'Asia/Seoul',      sessionOpen: '09:00', sessionClose: '15:30' },
  '^BSESN':  { symbol: '^BSESN',  name: 'BSE Sensex',      exchange: 'BSE',  country: 'India',     flag: '🇮🇳', timezone: 'Asia/Kolkata',        sessionOpen: '09:15', sessionClose: '15:30' },
  '^NSEI':   { symbol: '^NSEI',   name: 'NIFTY 50',        exchange: 'NSE',  country: 'India',     flag: '🇮🇳', timezone: 'Asia/Kolkata',        sessionOpen: '09:15', sessionClose: '15:30' },
  '^KLSE':   { symbol: '^KLSE',   name: 'FTSE Bursa Malaysia KLCI', exchange: 'BURSA', country: 'Malaysia', flag: '🇲🇾', timezone: 'Asia/Kuala_Lumpur', sessionOpen: '09:00', sessionClose: '17:00' },
  '^SET.BK': { symbol: '^SET.BK', name: 'SET Index',       exchange: 'SET',  country: 'Thailand',  flag: '🇹🇭', timezone: 'Asia/Bangkok',        sessionOpen: '10:00', sessionClose: '16:30' },
  '^JKSE':   { symbol: '^JKSE',   name: 'Jakarta Composite Index', exchange: 'IDX', country: 'Indonesia', flag: '🇮🇩', timezone: 'Asia/Jakarta', sessionOpen: '09:00', sessionClose: '16:00' },
  '^TWII':   { symbol: '^TWII',   name: 'Taiwan Weighted Index', exchange: 'TWSE', country: 'Taiwan', flag: '🇹🇼', timezone: 'Asia/Taipei',     sessionOpen: '09:00', sessionClose: '13:30' },
  '000001.SS': { symbol: '000001.SS', name: 'SSE Composite Index', exchange: 'SSE', country: 'China', flag: '🇨🇳', timezone: 'Asia/Shanghai',   sessionOpen: '09:30', sessionClose: '15:00' },
};

@Injectable()
export class AlphaVantageAdapter extends MarketDataPort {
  private readonly logger = new Logger(AlphaVantageAdapter.name);
  private readonly baseUrl = 'https://www.alphavantage.co/query';
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.apiKey = this.config.get<string>('ALPHA_VANTAGE_KEY', 'demo');
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    try {
      const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${this.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as Record<string, unknown>;
      const gq = data['Global Quote'] as Record<string, string> | undefined;
      if (!gq || !gq['05. price']) {
        throw new HttpException(`No quote data for symbol: ${symbol}`, HttpStatus.NOT_FOUND);
      }
      return this.mapGlobalQuote(gq, symbol);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`getQuote failed for ${symbol}: ${(err as Error).message}`);
      throw new HttpException(`Failed to fetch quote for ${symbol}`, HttpStatus.BAD_GATEWAY);
    }
  }

  async getQuotes(symbols: string[]): Promise<StockQuote[]> {
    const results = await Promise.allSettled(symbols.map(s => this.getQuote(s)));
    return results
      .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  async getApacIndices(): Promise<ApacIndex[]> {
    const results = await Promise.allSettled(
      APAC_INDEX_SYMBOLS.map(async (sym) => {
        const quote = await this.getQuote(sym);
        const meta = INDEX_META[sym];
        if (!meta) return null;
        return {
          ...meta,
          value: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          isMarketOpen: quote.isMarketOpen,
        } as ApacIndex;
      }),
    );
    return results
      .filter((r): r is PromiseFulfilledResult<ApacIndex | null> => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value as ApacIndex);
  }

  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    try {
      const url = `${this.baseUrl}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${this.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as Record<string, unknown>;
      const matches = (data['bestMatches'] as Record<string, string>[]) || [];
      return matches.map(m => ({
        symbol: m['1. symbol'] || '',
        name: m['2. name'] || '',
        type: m['3. type'] || 'Equity',
        exchange: m['4. region'] || '',
        currency: m['8. currency'] || 'USD',
        country: m['4. region'] || '',
      }));
    } catch (err) {
      this.logger.error(`searchSymbols failed for "${query}": ${(err as Error).message}`);
      throw new HttpException('Symbol search failed', HttpStatus.BAD_GATEWAY);
    }
  }

  async getPriceHistory(symbol: string, range: string): Promise<PriceBar[]> {
    try {
      const outputsize = ['1m', '3m'].includes(range) ? 'compact' : 'full';
      const url = `${this.baseUrl}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=${outputsize}&apikey=${this.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as Record<string, unknown>;
      const series = data['Time Series (Daily)'] as Record<string, Record<string, string>> | undefined;
      if (!series) return [];

      const cutoff = this.getCutoffDate(range);
      return Object.entries(series)
        .filter(([date]) => date >= cutoff)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, bar]) => ({
          date,
          open: parseFloat(bar['1. open'] || '0'),
          high: parseFloat(bar['2. high'] || '0'),
          low: parseFloat(bar['3. low'] || '0'),
          close: parseFloat(bar['4. close'] || '0'),
          volume: parseInt(bar['5. volume'] || '0', 10),
        }));
    } catch (err) {
      this.logger.error(`getPriceHistory failed for ${symbol}: ${(err as Error).message}`);
      throw new HttpException(`Failed to fetch price history for ${symbol}`, HttpStatus.BAD_GATEWAY);
    }
  }

  // ── Private helpers ──────────────────────────────────────────────

  private mapGlobalQuote(gq: Record<string, string>, symbol: string): StockQuote {
    const price = parseFloat(gq['05. price'] || '0');
    const change = parseFloat(gq['09. change'] || '0');
    const changePct = parseFloat((gq['10. change percent'] || '0%').replace('%', ''));
    return {
      symbol,
      name: symbol,
      exchange: gq['07. latest trading day'] ? 'UNKNOWN' : 'UNKNOWN',
      currency: 'USD',
      price,
      change,
      changePercent: changePct,
      volume: parseInt(gq['06. volume'] || '0', 10),
      high52w: parseFloat(gq['03. high'] || '0'),
      low52w: parseFloat(gq['04. low'] || '0'),
      isMarketOpen: this.isMarketOpen('USD'),
      lastUpdated: gq['07. latest trading day'] || new Date().toISOString(),
    };
  }

  private isMarketOpen(currency: string): boolean {
    const hours = EXCHANGE_HOURS[currency];
    if (!hours) return false;
    const now = new Date();
    const utcHour = now.getUTCHours();
    if (hours.open < hours.close) {
      return utcHour >= hours.open && utcHour < hours.close;
    }
    // Overnight session (e.g. ASX)
    return utcHour >= hours.open || utcHour < hours.close;
  }

  private getCutoffDate(range: string): string {
    const now = new Date();
    const map: Record<string, number> = {
      '1m': 30, '3m': 90, '6m': 180, '1y': 365, '5y': 1825,
    };
    const days = map[range] ?? 30;
    now.setDate(now.getDate() - days);
    return now.toISOString().split('T')[0];
  }
}
