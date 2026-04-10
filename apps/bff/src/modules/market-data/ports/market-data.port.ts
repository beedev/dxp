// MarketDataPort — contract that all market-data adapters must implement.
// Consumers inject MarketDataPort and never know which adapter is active.

import { StockQuote, ApacIndex, SymbolSearchResult, PriceBar } from '@dxp/contracts';

export abstract class MarketDataPort {
  abstract getQuote(symbol: string): Promise<StockQuote>;
  abstract getQuotes(symbols: string[]): Promise<StockQuote[]>;
  abstract getApacIndices(): Promise<ApacIndex[]>;
  abstract searchSymbols(query: string): Promise<SymbolSearchResult[]>;
  abstract getPriceHistory(symbol: string, range: string): Promise<PriceBar[]>;
}
