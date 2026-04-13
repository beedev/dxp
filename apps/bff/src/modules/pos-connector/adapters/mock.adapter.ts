import { Injectable, Logger } from '@nestjs/common';
import {
  PosConnectorPort,
  DailySales,
  CategoryBreakdown,
  TopSeller,
  Transaction,
} from '../ports/pos-connector.port';

@Injectable()
export class MockPosAdapter extends PosConnectorPort {
  private readonly logger = new Logger(MockPosAdapter.name);

  async getDailySales(storeId: string, date: string): Promise<DailySales> {
    return {
      date,
      storeId,
      revenue: 14320,
      transactions: 98,
      avgTicket: 146,
    };
  }

  async getSalesRange(storeId: string, from: string, to: string): Promise<DailySales[]> {
    const days: DailySales[] = [];
    const start = new Date(from);
    const end = new Date(to);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const baseRevenue = isWeekend ? 16000 : 12000;
      const variance = (Math.random() - 0.5) * 4000;
      const revenue = Math.round(baseRevenue + variance);
      const avgTicket = Math.round(140 + (Math.random() - 0.5) * 50);
      days.push({
        date: d.toISOString().split('T')[0],
        storeId,
        revenue,
        transactions: Math.round(revenue / avgTicket),
        avgTicket,
      });
    }
    return days;
  }

  async getCategoryBreakdown(storeId: string): Promise<CategoryBreakdown[]> {
    return [
      { category: 'Paint & Stains', revenue: 3280, units: 42, pctOfTotal: 22.9 },
      { category: 'Power Tools', revenue: 2890, units: 18, pctOfTotal: 20.2 },
      { category: 'Plumbing', revenue: 1940, units: 35, pctOfTotal: 13.5 },
      { category: 'Electrical', revenue: 1670, units: 48, pctOfTotal: 11.7 },
      { category: 'Outdoor & Garden', revenue: 1850, units: 24, pctOfTotal: 12.9 },
    ];
  }

  async getTopSellers(storeId: string): Promise<TopSeller[]> {
    return [
      { productId: 'T001', name: 'DeWalt 20V MAX Drill/Driver Kit', category: 'Tools', unitsSold: 8, revenue: 792 },
      { productId: 'P002', name: 'Benjamin Moore Regal Select', category: 'Paint', unitsSold: 6, revenue: 378 },
      { productId: 'E003', name: 'Philips LED 60W 4-Pack', category: 'Electrical', unitsSold: 14, revenue: 112 },
    ];
  }

  async getTransactions(storeId: string, date: string): Promise<Transaction[]> {
    return [
      {
        id: 'TXN-001',
        storeId,
        timestamp: `${date}T10:15:00Z`,
        items: [{ productId: 'T001', name: 'DeWalt Drill', quantity: 1, price: 99.00 }],
        total: 99.00,
        paymentMethod: 'credit',
      },
    ];
  }
}
