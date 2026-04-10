import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { StockQuote, ApacIndex, SymbolSearchResult, PriceBar } from '@dxp/contracts';
import { MarketDataPort } from '../ports/market-data.port';

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

const YAHOO_RANGE_MAP: Record<string, string> = {
  '1m': '1mo', '3m': '3mo', '6m': '6mo', '1y': '1y', '5y': '5y',
};

const USER_AGENT = 'Mozilla/5.0 (compatible; DXP/1.0)';

// Typed interfaces for Yahoo Finance v8 chart API response
interface YahooChartMeta {
  symbol: string;
  regularMarketPrice: number;
  previousClose?: number;
  chartPreviousClose?: number;
  regularMarketVolume: number;
  currency: string;
  exchangeName: string;
  regularMarketTime: number;
  marketState: string;
  shortName?: string;
  longName?: string;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

interface YahooQuoteData {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

interface YahooChartResult {
  meta: YahooChartMeta;
  timestamp?: number[];
  indicators?: {
    quote: YahooQuoteData[];
  };
}

interface YahooChartResponse {
  chart: {
    result: YahooChartResult[] | null;
    error: { code: string; description: string } | null;
  };
}

// Typed interface for Yahoo Finance search API response
interface YahooSearchQuote {
  symbol: string;
  longname?: string;
  shortname?: string;
  exchDisp?: string;
  typeDisp?: string;
  currency?: string;
  exchange?: string;
}

interface YahooSearchResponse {
  quoteResponse?: {
    result: YahooSearchQuote[];
  };
  quotes?: YahooSearchQuote[];
}

@Injectable()
export class YahooFinanceAdapter extends MarketDataPort {
  private readonly logger = new Logger(YahooFinanceAdapter.name);
  private readonly chartBaseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
  private readonly searchBaseUrl = 'https://query2.finance.yahoo.com/v1/finance/search';

  async getQuote(symbol: string): Promise<StockQuote> {
    try {
      const url = `${this.chartBaseUrl}/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as YahooChartResponse;

      const result = data.chart?.result?.[0];
      if (!result?.meta) {
        throw new HttpException(`No quote data for symbol: ${symbol}`, HttpStatus.NOT_FOUND);
      }

      return this.mapChartMetaToQuote(result.meta, symbol);
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
          isMarketOpen: this.isExchangeOpen(meta.timezone, meta.sessionOpen, meta.sessionClose),
        } as ApacIndex;
      }),
    );
    return results
      .filter((r): r is PromiseFulfilledResult<ApacIndex | null> => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value as ApacIndex);
  }

  /** Timezone-aware market hours check — works for all APAC exchanges */
  private isExchangeOpen(timezone: string, sessionOpen: string, sessionClose: string): boolean {
    try {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = fmt.formatToParts(now);
      const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
      const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
      const nowMins = h * 60 + m;

      const [oh, om] = sessionOpen.split(':').map(Number);
      const [ch, cm] = sessionClose.split(':').map(Number);
      const openMins = oh * 60 + om;
      const closeMins = ch * 60 + cm;

      // Skip weekends
      const dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' });
      const day = dayFmt.format(now);
      if (day === 'Sat' || day === 'Sun') return false;

      return nowMins >= openMins && nowMins < closeMins;
    } catch {
      return false;
    }
  }

  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        quotesCount: '10',
        newsCount: '0',
      });
      const url = `${this.searchBaseUrl}?${params.toString()}`;
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as YahooSearchResponse;

      // Yahoo Finance search may return results under either key depending on version
      const quotes: YahooSearchQuote[] = data.quotes ?? data.quoteResponse?.result ?? [];

      return quotes.map(q => ({
        symbol: q.symbol,
        name: q.longname ?? q.shortname ?? q.symbol,
        type: q.typeDisp ?? 'Equity',
        exchange: q.exchDisp ?? q.exchange ?? '',
        currency: q.currency ?? 'USD',
        country: q.exchDisp ?? '',
      }));
    } catch (err) {
      this.logger.error(`searchSymbols failed for "${query}": ${(err as Error).message}`);
      throw new HttpException('Symbol search failed', HttpStatus.BAD_GATEWAY);
    }
  }

  async getPriceHistory(symbol: string, range: string): Promise<PriceBar[]> {
    try {
      const yahooRange = YAHOO_RANGE_MAP[range] ?? '1mo';
      const url = `${this.chartBaseUrl}/${encodeURIComponent(symbol)}?interval=1d&range=${yahooRange}`;
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as YahooChartResponse;

      const result = data.chart?.result?.[0];
      if (!result?.timestamp || !result.indicators?.quote?.[0]) return [];

      const timestamps = result.timestamp;
      const ohlcv = result.indicators.quote[0];

      return timestamps
        .map((ts, i) => {
          const open = ohlcv.open?.[i];
          const high = ohlcv.high?.[i];
          const low = ohlcv.low?.[i];
          const close = ohlcv.close?.[i];
          const volume = ohlcv.volume?.[i];
          // Skip bars where Yahoo returned nulls (market closed days)
          if (open == null || high == null || low == null || close == null) return null;
          return {
            date: new Date(ts * 1000).toISOString().split('T')[0],
            open: parseFloat(open.toFixed(4)),
            high: parseFloat(high.toFixed(4)),
            low: parseFloat(low.toFixed(4)),
            close: parseFloat(close.toFixed(4)),
            volume: volume ?? 0,
          } as PriceBar;
        })
        .filter((bar): bar is PriceBar => bar !== null);
    } catch (err) {
      this.logger.error(`getPriceHistory failed for ${symbol}: ${(err as Error).message}`);
      throw new HttpException(`Failed to fetch price history for ${symbol}`, HttpStatus.BAD_GATEWAY);
    }
  }

  // ── Private helpers ──────────────────────────────────────────────

  private mapChartMetaToQuote(meta: YahooChartMeta, symbol: string): StockQuote {
    const price = meta.regularMarketPrice ?? 0;
    // Indices return chartPreviousClose; equities return previousClose
    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return {
      symbol: meta.symbol ?? symbol,
      name: meta.longName ?? meta.shortName ?? meta.symbol ?? symbol,
      exchange: meta.exchangeName ?? 'UNKNOWN',
      currency: meta.currency ?? 'USD',
      price,
      change: parseFloat(change.toFixed(4)),
      changePercent: parseFloat(changePercent.toFixed(4)),
      volume: meta.regularMarketVolume ?? 0,
      high52w: meta.fiftyTwoWeekHigh,
      low52w: meta.fiftyTwoWeekLow,
      isMarketOpen: meta.marketState === 'REGULAR',
      lastUpdated: meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : new Date().toISOString(),
    };
  }
}
