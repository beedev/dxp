// BrokerGatewayPort — contract that all real-broker adapters must implement.

import { Order, PlaceOrderRequest } from '@dxp/contracts';

export interface BrokerAccount {
  balance: number;
  buyingPower: number;
  currency: string;
}

export abstract class BrokerGatewayPort {
  abstract getBrokerAccount(userId: string): Promise<BrokerAccount>;
  abstract placeBrokerOrder(userId: string, req: PlaceOrderRequest): Promise<Order>;
  abstract getBrokerOrders(userId: string): Promise<Order[]>;
  abstract cancelBrokerOrder(userId: string, orderId: string): Promise<Order>;
}
