import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaperPortfolio, Order, OrderStatus, PlaceOrderRequest, Alert, CreateAlertRequest } from '@dxp/contracts';
import { PaperTradingPort } from '../ports/paper-trading.port';
import { MarketDataPort } from '../../market-data/ports/market-data.port';
import { randomUUID } from 'crypto';

const STARTING_CASH = 100_000; // SGD

function computeCommission(estimatedValue: number): number {
  // Standard brokerage: 0.08% with min $2.50
  return Math.max(2.50, estimatedValue * 0.0008);
}

// Seed initial orders per user (limit orders pending + filled history)
function buildInitialOrders(): Order[] {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 86400 * 1000);

  return [
    // Pending limit orders
    {
      id: 'ord-001', symbol: 'D05.SI', name: 'DBS Group Holdings Ltd', exchange: 'SGX', currency: 'SGD',
      side: 'buy', type: 'limit', qty: 100, price: 37.80, filledQty: 0,
      status: 'pending', validity: 'GTC', createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString(),
      estimatedValue: 3780.00, commission: computeCommission(3780), isPaper: true,
    },
    {
      id: 'ord-002', symbol: '0700.HK', name: 'Tencent Holdings Ltd', exchange: 'HKEX', currency: 'HKD',
      side: 'buy', type: 'limit', qty: 50, price: 410.00, filledQty: 0,
      status: 'pending', validity: 'GTC', createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString(),
      estimatedValue: 20500.00, commission: computeCommission(20500), isPaper: true,
    },
    {
      id: 'ord-003', symbol: 'BHP.AX', name: 'BHP Group Ltd', exchange: 'ASX', currency: 'AUD',
      side: 'sell', type: 'limit', qty: 100, price: 52.00, filledQty: 0,
      status: 'pending', validity: 'GTC', createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString(),
      estimatedValue: 5200.00, commission: computeCommission(5200), isPaper: true,
    },
    // Historical filled orders
    {
      id: 'ord-101', symbol: 'D05.SI', name: 'DBS Group Holdings Ltd', exchange: 'SGX', currency: 'SGD',
      side: 'buy', type: 'market', qty: 200, filledQty: 200, avgFillPrice: 36.80,
      status: 'filled', validity: 'DAY', createdAt: lastWeek.toISOString(), updatedAt: lastWeek.toISOString(),
      estimatedValue: 7360.00, commission: computeCommission(7360), pnl: 330.00, isPaper: true,
    },
    {
      id: 'ord-102', symbol: '9988.HK', name: 'Alibaba Group Holding Ltd', exchange: 'HKEX', currency: 'HKD',
      side: 'buy', type: 'market', qty: 100, filledQty: 100, avgFillPrice: 88.20,
      status: 'filled', validity: 'DAY', createdAt: lastWeek.toISOString(), updatedAt: lastWeek.toISOString(),
      estimatedValue: 8820.00, commission: computeCommission(8820), pnl: 920.00, isPaper: true,
    },
    {
      id: 'ord-103', symbol: '7203.T', name: 'Toyota Motor Corporation', exchange: 'TSE', currency: 'JPY',
      side: 'buy', type: 'limit', qty: 50, price: 2980.00, filledQty: 50, avgFillPrice: 2980.00,
      status: 'filled', validity: 'GTC', createdAt: lastWeek.toISOString(), updatedAt: lastWeek.toISOString(),
      estimatedValue: 149000.00, commission: computeCommission(149000), pnl: 7200.00, isPaper: true,
    },
    {
      id: 'ord-104', symbol: 'M44U.SI', name: 'Mapletree Pan Asia Commercial Trust', exchange: 'SGX', currency: 'SGD',
      side: 'buy', type: 'market', qty: 3000, filledQty: 3000, avgFillPrice: 1.64,
      status: 'filled', validity: 'DAY', createdAt: lastWeek.toISOString(), updatedAt: lastWeek.toISOString(),
      estimatedValue: 4920.00, commission: computeCommission(4920), pnl: -180.00, isPaper: true,
    },
    {
      id: 'ord-105', symbol: '9984.T', name: 'SoftBank Group Corp', exchange: 'TSE', currency: 'JPY',
      side: 'sell', type: 'limit', qty: 20, price: 9100.00, filledQty: 20, avgFillPrice: 9100.00,
      status: 'filled', validity: 'GTC', createdAt: lastWeek.toISOString(), updatedAt: lastWeek.toISOString(),
      estimatedValue: 182000.00, commission: computeCommission(182000), pnl: 12800.00, isPaper: true,
    },
  ] as Order[];
}

function buildInitialAlerts(): Alert[] {
  return [
    { id: 'alr-001', symbol: 'D05.SI', name: 'DBS Group Holdings Ltd', exchange: 'SGX', type: 'price-above', threshold: 40.00, isActive: true, createdAt: new Date().toISOString() },
    { id: 'alr-002', symbol: '0700.HK', name: 'Tencent Holdings Ltd', exchange: 'HKEX', type: 'price-below', threshold: 400.00, isActive: true, createdAt: new Date().toISOString() },
    { id: 'alr-003', symbol: 'BHP.AX', name: 'BHP Group Ltd', exchange: 'ASX', type: 'price-above', threshold: 52.00, isActive: true, createdAt: new Date().toISOString() },
  ];
}

// In-memory state per user
const ORDER_STORE = new Map<string, Order[]>();
const ALERT_STORE = new Map<string, Alert[]>();

function getOrderStore(userId: string): Order[] {
  if (!ORDER_STORE.has(userId)) {
    ORDER_STORE.set(userId, buildInitialOrders());
  }
  return ORDER_STORE.get(userId)!;
}

function getAlertStore(userId: string): Alert[] {
  if (!ALERT_STORE.has(userId)) {
    ALERT_STORE.set(userId, buildInitialAlerts());
  }
  return ALERT_STORE.get(userId)!;
}

@Injectable()
export class PaperEngineAdapter extends PaperTradingPort {
  private readonly logger = new Logger(PaperEngineAdapter.name);

  constructor(private readonly market: MarketDataPort) {
    super();
  }

  async getPaperPortfolio(userId: string): Promise<PaperPortfolio> {
    const orders = getOrderStore(userId);
    const filledOrders = orders.filter(o => o.status === 'filled');

    // Compute net P&L from filled orders
    const totalPnl = filledOrders.reduce((sum, o) => sum + (o.pnl ?? 0), 0);
    // Compute cash spent on buys / received from sells (in local currency, simplified)
    const cashSpent = filledOrders
      .filter(o => o.side === 'buy')
      .reduce((sum, o) => sum + (o.avgFillPrice ?? o.price ?? 0) * o.filledQty + o.commission, 0);
    const cashReceived = filledOrders
      .filter(o => o.side === 'sell')
      .reduce((sum, o) => sum + (o.avgFillPrice ?? o.price ?? 0) * o.filledQty - o.commission, 0);
    const cashBalance = parseFloat((STARTING_CASH - cashSpent + cashReceived).toFixed(2));

    return {
      cashBalance,
      totalValue: parseFloat((cashBalance + totalPnl + cashSpent - cashReceived).toFixed(2)),
      totalPnl: parseFloat(totalPnl.toFixed(2)),
      currency: 'SGD',
    };
  }

  async getOrders(userId: string, status?: OrderStatus): Promise<Order[]> {
    const orders = getOrderStore(userId);
    if (status) return orders.filter(o => o.status === status);
    return orders;
  }

  async placeOrder(userId: string, req: PlaceOrderRequest): Promise<Order> {
    const store = getOrderStore(userId);

    // Fetch live quote; fall back gracefully if market data unavailable
    const liveQuote = await this.market.getQuote(req.symbol).catch(() => null);
    const livePrice = liveQuote?.price ?? req.price ?? 100;
    const currency = liveQuote?.currency ?? 'SGD';
    const name = liveQuote?.name ?? req.symbol;
    const exchange = liveQuote?.exchange ?? req.exchange;

    const estimatedPrice = req.price ?? livePrice;
    const estimatedValue = estimatedPrice * req.qty;
    const commission = computeCommission(estimatedValue);

    const now = new Date().toISOString();
    const order: Order = {
      id: randomUUID(),
      symbol: req.symbol,
      name,
      exchange,
      currency,
      side: req.side,
      type: req.type,
      qty: req.qty,
      price: req.price,
      stopPrice: req.stopPrice,
      filledQty: 0,
      status: 'pending',
      validity: req.validity,
      createdAt: now,
      updatedAt: now,
      estimatedValue,
      commission,
      isPaper: true,
    };

    // Immediately fill market orders at live price ± 0.1% slippage
    if (req.type === 'market') {
      const slippage = req.side === 'buy' ? 1.001 : 0.999;
      const fillPrice = parseFloat((livePrice * slippage).toFixed(4));
      order.avgFillPrice = fillPrice;
      order.filledQty = req.qty;
      order.status = 'filled';
      order.updatedAt = new Date().toISOString();
      order.pnl = 0; // Calculated on close
    }

    store.push(order);
    this.logger.log(`Paper order placed: ${order.id} ${req.side} ${req.qty}x${req.symbol} type=${req.type} fillPrice=${livePrice}`);
    return order;
  }

  async cancelOrder(userId: string, orderId: string): Promise<Order> {
    const store = getOrderStore(userId);
    const order = store.find(o => o.id === orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    if (order.status !== 'pending' && order.status !== 'partial') {
      throw new BadRequestException(`Cannot cancel order with status: ${order.status}`);
    }
    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString();
    this.logger.log(`Paper order cancelled: ${orderId}`);
    return order;
  }

  async getAlerts(userId: string): Promise<Alert[]> {
    return getAlertStore(userId);
  }

  async createAlert(userId: string, req: CreateAlertRequest): Promise<Alert> {
    const alerts = getAlertStore(userId);
    const liveQuote = await this.market.getQuote(req.symbol).catch(() => null);
    const alert: Alert = {
      id: randomUUID(),
      symbol: req.symbol,
      name: liveQuote?.name ?? req.symbol,
      exchange: liveQuote?.exchange ?? req.exchange,
      type: req.type,
      threshold: req.threshold,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    alerts.push(alert);
    this.logger.log(`Alert created: ${alert.id} for ${req.symbol} type=${req.type}`);
    return alert;
  }

  async deleteAlert(userId: string, alertId: string): Promise<void> {
    const alerts = getAlertStore(userId);
    const index = alerts.findIndex(a => a.id === alertId);
    if (index === -1) throw new NotFoundException(`Alert ${alertId} not found`);
    alerts.splice(index, 1);
    this.logger.log(`Alert deleted: ${alertId}`);
  }
}
