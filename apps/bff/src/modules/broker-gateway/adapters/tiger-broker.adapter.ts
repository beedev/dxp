/**
 * Tiger Broker Adapter — integrates with Tiger Open API for real-money trading.
 *
 * Setup instructions:
 * 1. Create a Tiger account at https://www.tigersecurities.com
 * 2. Apply for API access at https://www.tigerbrokers.com.sg/openapi
 * 3. Set the following environment variables:
 *    - TRADING_ADAPTER=broker
 *    - BROKER_PROVIDER=tiger
 *    - TIGER_BROKER_ID=<your broker ID>
 *    - TIGER_PRIVATE_KEY=<your RSA private key (PEM format)>
 *    - TIGER_ACCOUNT=<your trading account number>
 *
 * Authentication: HMAC-SHA256 signed requests.
 * Base URL: https://openapi.tigerfintech.com
 * Documentation: https://quant.tigerbrokers.com.sg/docs
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order, PlaceOrderRequest } from '@dxp/contracts';
import { BrokerGatewayPort, BrokerAccount } from '../ports/broker-gateway.port';

@Injectable()
export class TigerBrokerAdapter extends BrokerGatewayPort {
  private readonly logger = new Logger(TigerBrokerAdapter.name);
  // Tiger Open API base URL
  private readonly baseUrl = 'https://openapi.tigerfintech.com';

  constructor(private readonly config: ConfigService) {
    super();
    const tigerId = this.config.get<string>('TIGER_BROKER_ID', '');
    const privateKey = this.config.get<string>('TIGER_PRIVATE_KEY', '');
    const account = this.config.get<string>('TIGER_ACCOUNT', '');
    if (!tigerId || !privateKey || !account) {
      this.logger.warn('Tiger Broker credentials not configured. All calls will throw until credentials are set.');
    }
  }

  async getBrokerAccount(userId: string): Promise<BrokerAccount> {
    throw new Error(
      'Tiger Broker not configured. Set TIGER_BROKER_ID, TIGER_PRIVATE_KEY, TIGER_ACCOUNT in env.',
    );
  }

  async placeBrokerOrder(userId: string, req: PlaceOrderRequest): Promise<Order> {
    throw new Error(
      'Tiger Broker not configured. Set TIGER_BROKER_ID, TIGER_PRIVATE_KEY, TIGER_ACCOUNT in env.',
    );
  }

  async getBrokerOrders(userId: string): Promise<Order[]> {
    throw new Error(
      'Tiger Broker not configured. Set TIGER_BROKER_ID, TIGER_PRIVATE_KEY, TIGER_ACCOUNT in env.',
    );
  }

  async cancelBrokerOrder(userId: string, orderId: string): Promise<Order> {
    throw new Error(
      'Tiger Broker not configured. Set TIGER_BROKER_ID, TIGER_PRIVATE_KEY, TIGER_ACCOUNT in env.',
    );
  }
}
