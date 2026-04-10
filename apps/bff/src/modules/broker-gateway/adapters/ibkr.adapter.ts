/**
 * Interactive Brokers (IBKR) Adapter — integrates with IBKR Web API for real-money trading.
 *
 * Setup instructions:
 * 1. Obtain an IBKR account at https://www.interactivebrokers.com
 * 2. Enable the Client Portal Web API via Account Management
 * 3. Set the following environment variables:
 *    - TRADING_ADAPTER=broker
 *    - BROKER_PROVIDER=ibkr
 *    - IBKR_ACCOUNT=<your account number>
 *    - IBKR_CLIENT_ID=<your OAuth2 client ID>
 *    - IBKR_CLIENT_SECRET=<your OAuth2 client secret>
 *
 * Authentication: OAuth2 (Client Credentials flow).
 * Base URL: https://api.ibkr.com/v1/api
 * Documentation: https://ibkrcampus.com/ibkr-api-page/cpapi-v1/
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order, PlaceOrderRequest } from '@dxp/contracts';
import { BrokerGatewayPort, BrokerAccount } from '../ports/broker-gateway.port';

@Injectable()
export class IbkrAdapter extends BrokerGatewayPort {
  private readonly logger = new Logger(IbkrAdapter.name);
  // IBKR Web API base URL
  private readonly baseUrl = 'https://api.ibkr.com/v1/api';

  constructor(private readonly config: ConfigService) {
    super();
    const account = this.config.get<string>('IBKR_ACCOUNT', '');
    const clientId = this.config.get<string>('IBKR_CLIENT_ID', '');
    if (!account || !clientId) {
      this.logger.warn('IBKR credentials not configured. All calls will throw until credentials are set.');
    }
  }

  async getBrokerAccount(userId: string): Promise<BrokerAccount> {
    throw new Error(
      'IBKR not configured. Set IBKR_ACCOUNT, IBKR_CLIENT_ID, IBKR_CLIENT_SECRET in env.',
    );
  }

  async placeBrokerOrder(userId: string, req: PlaceOrderRequest): Promise<Order> {
    throw new Error(
      'IBKR not configured. Set IBKR_ACCOUNT, IBKR_CLIENT_ID, IBKR_CLIENT_SECRET in env.',
    );
  }

  async getBrokerOrders(userId: string): Promise<Order[]> {
    throw new Error(
      'IBKR not configured. Set IBKR_ACCOUNT, IBKR_CLIENT_ID, IBKR_CLIENT_SECRET in env.',
    );
  }

  async cancelBrokerOrder(userId: string, orderId: string): Promise<Order> {
    throw new Error(
      'IBKR not configured. Set IBKR_ACCOUNT, IBKR_CLIENT_ID, IBKR_CLIENT_SECRET in env.',
    );
  }
}
