// PaperTradingPort — contract that all paper-trading adapters must implement.

import { PaperPortfolio, Order, OrderStatus, PlaceOrderRequest, Alert, CreateAlertRequest } from '@dxp/contracts';

export abstract class PaperTradingPort {
  abstract getPaperPortfolio(userId: string): Promise<PaperPortfolio>;
  abstract getOrders(userId: string, status?: OrderStatus): Promise<Order[]>;
  abstract placeOrder(userId: string, req: PlaceOrderRequest): Promise<Order>;
  abstract cancelOrder(userId: string, orderId: string): Promise<Order>;
  abstract getAlerts(userId: string): Promise<Alert[]>;
  abstract createAlert(userId: string, req: CreateAlertRequest): Promise<Alert>;
  abstract deleteAlert(userId: string, alertId: string): Promise<void>;
}
