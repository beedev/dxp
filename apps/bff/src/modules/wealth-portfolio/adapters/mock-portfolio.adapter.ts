import { Injectable, Logger } from '@nestjs/common';
import { PortfolioSummary, Holding, Transaction, PortfolioFilters } from '@dxp/contracts';
import { WealthPortfolioPort } from '../ports/wealth-portfolio.port';
import { randomUUID } from 'crypto';

// FX rates to SGD (base currency)
const FX_TO_SGD: Record<string, number> = {
  SGD: 1.000,
  HKD: 0.172,
  JPY: 0.009,
  AUD: 0.870,
  INR: 0.016,
  TWD: 0.042,
};

interface HoldingSpec {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  qty: number;
  avgCost: number;
  currentPrice: number;
  sector: string;
  country: string;
  withholdingTaxRate: number;
  dividendYield?: number;
}

const HOLDING_SPECS: HoldingSpec[] = [
  { id: 'h001', symbol: 'D05.SI',       name: 'DBS Group Holdings Ltd',              exchange: 'SGX',  currency: 'SGD', qty: 500,  avgCost: 32.40, currentPrice: 38.45, sector: 'Financials',              country: 'SG', withholdingTaxRate: 0,       dividendYield: 5.1 },
  { id: 'h002', symbol: '0700.HK',      name: 'Tencent Holdings Ltd',               exchange: 'HKEX', currency: 'HKD', qty: 200,  avgCost: 315.00, currentPrice: 425.60, sector: 'Technology',             country: 'HK', withholdingTaxRate: 0,       dividendYield: 0.8 },
  { id: 'h003', symbol: '7203.T',       name: 'Toyota Motor Corporation',            exchange: 'TSE',  currency: 'JPY', qty: 100,  avgCost: 2850.00, currentPrice: 3124.00, sector: 'Consumer Discretionary', country: 'JP', withholdingTaxRate: 15.315, dividendYield: 2.3 },
  { id: 'h004', symbol: 'BHP.AX',       name: 'BHP Group Ltd',                      exchange: 'ASX',  currency: 'AUD', qty: 300,  avgCost: 43.20, currentPrice: 49.50, sector: 'Materials',               country: 'AU', withholdingTaxRate: 15,      dividendYield: 4.7 },
  { id: 'h005', symbol: 'HDFCBANK.NS',  name: 'HDFC Bank Ltd',                      exchange: 'NSE',  currency: 'INR', qty: 100,  avgCost: 1720.00, currentPrice: 1965.00, sector: 'Financials',             country: 'IN', withholdingTaxRate: 20,      dividendYield: 1.2 },
  { id: 'h006', symbol: '9988.HK',      name: 'Alibaba Group Holding Ltd',          exchange: 'HKEX', currency: 'HKD', qty: 150,  avgCost: 79.20, currentPrice: 97.40, sector: 'Technology',              country: 'HK', withholdingTaxRate: 0,       dividendYield: 0.0 },
  { id: 'h007', symbol: 'M44U.SI',      name: 'Mapletree Pan Asia Commercial Trust', exchange: 'SGX', currency: 'SGD', qty: 5000, avgCost: 1.72, currentPrice: 1.58, sector: 'REITs',                    country: 'SG', withholdingTaxRate: 0,       dividendYield: 7.8 },
  { id: 'h008', symbol: '9984.T',       name: 'SoftBank Group Corp',                exchange: 'TSE',  currency: 'JPY', qty: 50,   avgCost: 8450.00, currentPrice: 9280.00, sector: 'Technology',             country: 'JP', withholdingTaxRate: 15.315, dividendYield: 0.5 },
];

// FX P&L mock values per holding (small realistic amounts in SGD)
const FX_PNL_MAP: Record<string, number> = {
  'h001': 0,
  'h002': 420.50,
  'h003': -180.30,
  'h004': 890.20,
  'h005': -95.40,
  'h006': 310.80,
  'h007': 0,
  'h008': -220.60,
};

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx001', symbol: 'D05.SI',      name: 'DBS Group Holdings Ltd',              exchange: 'SGX',  side: 'buy',      qty: 300, price: 31.20, currency: 'SGD', fxRate: 1.000, baseCurrencyAmount: 9360.00,  fee: 9.36,   date: '2024-01-15' },
  { id: 'tx002', symbol: 'D05.SI',      name: 'DBS Group Holdings Ltd',              exchange: 'SGX',  side: 'buy',      qty: 200, price: 34.20, currency: 'SGD', fxRate: 1.000, baseCurrencyAmount: 6840.00,  fee: 6.84,   date: '2024-03-20' },
  { id: 'tx003', symbol: '0700.HK',     name: 'Tencent Holdings Ltd',               exchange: 'HKEX', side: 'buy',      qty: 200, price: 315.00, currency: 'HKD', fxRate: 0.172, baseCurrencyAmount: 10836.00, fee: 10.84,  date: '2024-02-10' },
  { id: 'tx004', symbol: '7203.T',      name: 'Toyota Motor Corporation',            exchange: 'TSE',  side: 'buy',      qty: 100, price: 2850.00, currency: 'JPY', fxRate: 0.009, baseCurrencyAmount: 2565.00, fee: 2.57,   date: '2024-04-05' },
  { id: 'tx005', symbol: 'BHP.AX',      name: 'BHP Group Ltd',                      exchange: 'ASX',  side: 'buy',      qty: 300, price: 43.20, currency: 'AUD', fxRate: 0.870, baseCurrencyAmount: 11275.20, fee: 11.28,  date: '2024-01-28' },
  { id: 'tx006', symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd',                      exchange: 'NSE',  side: 'buy',      qty: 100, price: 1720.00, currency: 'INR', fxRate: 0.016, baseCurrencyAmount: 2752.00,  fee: 2.75,   date: '2024-05-12' },
  { id: 'tx007', symbol: '9988.HK',     name: 'Alibaba Group Holding Ltd',          exchange: 'HKEX', side: 'buy',      qty: 150, price: 79.20, currency: 'HKD', fxRate: 0.172, baseCurrencyAmount: 2043.36,  fee: 2.04,   date: '2024-06-01' },
  { id: 'tx008', symbol: 'M44U.SI',     name: 'Mapletree Pan Asia Commercial Trust', exchange: 'SGX', side: 'buy',      qty: 5000, price: 1.72, currency: 'SGD', fxRate: 1.000, baseCurrencyAmount: 8600.00,  fee: 8.60,   date: '2024-02-14' },
  { id: 'tx009', symbol: 'D05.SI',      name: 'DBS Group Holdings Ltd',              exchange: 'SGX',  side: 'dividend', qty: 500, price: 0.54, currency: 'SGD', fxRate: 1.000, baseCurrencyAmount: 270.00,   fee: 0,      date: '2024-08-23', note: 'Q2 2024 dividend' },
  { id: 'tx010', symbol: '0700.HK',     name: 'Tencent Holdings Ltd',               exchange: 'HKEX', side: 'dividend', qty: 200, price: 3.40, currency: 'HKD', fxRate: 0.172, baseCurrencyAmount: 116.96,   fee: 0,      date: '2024-07-15', note: 'FY2023 final dividend' },
];

function buildHolding(spec: HoldingSpec): Holding {
  const fxRate = FX_TO_SGD[spec.currency] ?? 1;
  const localValue = parseFloat((spec.qty * spec.currentPrice).toFixed(2));
  const localCost = spec.qty * spec.avgCost;
  const localPnl = parseFloat((localValue - localCost).toFixed(2));
  const localPnlPct = parseFloat(((localPnl / localCost) * 100).toFixed(2));
  const baseCurrencyValue = parseFloat((localValue * fxRate).toFixed(2));
  const baseCurrencyPnl = parseFloat((localPnl * fxRate).toFixed(2));
  const fxPnl = FX_PNL_MAP[spec.id] ?? 0;
  const totalPnlSgd = baseCurrencyPnl + fxPnl;
  const totalCostSgd = localCost * fxRate;
  const totalPnlPct = parseFloat(((totalPnlSgd / totalCostSgd) * 100).toFixed(2));

  return {
    id: spec.id,
    symbol: spec.symbol,
    name: spec.name,
    exchange: spec.exchange,
    currency: spec.currency,
    qty: spec.qty,
    avgCost: spec.avgCost,
    currentPrice: spec.currentPrice,
    localValue,
    localPnl,
    localPnlPct,
    baseCurrencyValue,
    baseCurrencyPnl,
    fxPnl,
    totalPnlPct,
    sector: spec.sector,
    country: spec.country,
    withholdingTaxRate: spec.withholdingTaxRate,
    dividendYield: spec.dividendYield,
  };
}

@Injectable()
export class MockPortfolioAdapter extends WealthPortfolioPort {
  private readonly logger = new Logger(MockPortfolioAdapter.name);

  async getPortfolio(userId: string, baseCurrency: string): Promise<PortfolioSummary> {
    const holdings = await this.getHoldings(userId, baseCurrency, {});
    const cashBalance = 50_000;

    const totalValue = holdings.reduce((s, h) => s + h.baseCurrencyValue, cashBalance);
    const totalCost = holdings.reduce((s, h) => s + h.avgCost * h.qty * (FX_TO_SGD[h.currency] ?? 1), 0);
    const totalPnl = parseFloat((totalValue - totalCost - cashBalance).toFixed(2));
    const totalPnlPct = parseFloat(((totalPnl / totalCost) * 100).toFixed(2));
    const fxPnl = holdings.reduce((s, h) => s + h.fxPnl, 0);

    // Day change — simulate a small daily movement
    const dayChange = parseFloat((totalValue * 0.0034).toFixed(2));
    const dayChangePct = 0.34;

    // Aggregate by country
    const countryMap = new Map<string, number>();
    for (const h of holdings) {
      countryMap.set(h.country, (countryMap.get(h.country) ?? 0) + h.baseCurrencyValue);
    }
    const investedValue = totalValue - cashBalance;
    const byCountry = Array.from(countryMap.entries()).map(([country, value]) => ({
      country,
      value: parseFloat(value.toFixed(2)),
      pct: parseFloat(((value / investedValue) * 100).toFixed(2)),
    }));

    // Aggregate by sector
    const sectorMap = new Map<string, number>();
    for (const h of holdings) {
      sectorMap.set(h.sector, (sectorMap.get(h.sector) ?? 0) + h.baseCurrencyValue);
    }
    const bySector = Array.from(sectorMap.entries()).map(([sector, value]) => ({
      sector,
      value: parseFloat(value.toFixed(2)),
      pct: parseFloat(((value / investedValue) * 100).toFixed(2)),
    }));

    // Aggregate by currency
    const currencyMap = new Map<string, number>();
    for (const h of holdings) {
      currencyMap.set(h.currency, (currencyMap.get(h.currency) ?? 0) + h.baseCurrencyValue);
    }
    const byCurrency = Array.from(currencyMap.entries()).map(([currency, value]) => ({
      currency,
      value: parseFloat(value.toFixed(2)),
      pct: parseFloat(((value / investedValue) * 100).toFixed(2)),
    }));

    return {
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalPnl,
      totalPnlPct,
      fxPnl: parseFloat(fxPnl.toFixed(2)),
      cashBalance,
      baseCurrency: baseCurrency || 'SGD',
      dayChange,
      dayChangePct,
      byCountry,
      bySector,
      byCurrency,
    };
  }

  async getHoldings(userId: string, baseCurrency: string, filters: PortfolioFilters): Promise<Holding[]> {
    let holdings = HOLDING_SPECS.map(buildHolding);

    if (filters.exchange) {
      holdings = holdings.filter(h => h.exchange === filters.exchange);
    }
    if (filters.sector) {
      holdings = holdings.filter(h => h.sector.toLowerCase() === filters.sector!.toLowerCase());
    }
    if (filters.currency) {
      holdings = holdings.filter(h => h.currency === filters.currency);
    }

    return holdings;
  }

  async getTransactions(userId: string, page: number, pageSize: number): Promise<{ data: Transaction[]; total: number }> {
    const total = MOCK_TRANSACTIONS.length;
    const start = (page - 1) * pageSize;
    const data = MOCK_TRANSACTIONS.slice(start, start + pageSize);
    return { data, total };
  }

  async addTransaction(userId: string, tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    const newTx: Transaction = { id: randomUUID(), ...tx };
    this.logger.log(`Mock: added transaction ${newTx.id} for user ${userId}`);
    return newTx;
  }
}
