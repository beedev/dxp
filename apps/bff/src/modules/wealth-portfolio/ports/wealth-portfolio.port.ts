// WealthPortfolioPort — contract that all portfolio adapters must implement.

import { PortfolioSummary, Holding, Transaction, PortfolioFilters } from '@dxp/contracts';

export abstract class WealthPortfolioPort {
  abstract getPortfolio(userId: string, baseCurrency: string): Promise<PortfolioSummary>;
  abstract getHoldings(userId: string, baseCurrency: string, filters: PortfolioFilters): Promise<Holding[]>;
  abstract getTransactions(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Transaction[]; total: number }>;
  abstract addTransaction(userId: string, tx: Omit<Transaction, 'id'>): Promise<Transaction>;
}
