import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UcpCheckoutPort } from './ports/ucp-checkout.port';
import { MockUcpCheckoutAdapter } from './adapters/mock.adapter';
import { StripeUcpCheckoutAdapter } from './adapters/stripe.adapter';
import { UcpCheckoutController } from './ucp-checkout.controller';
import { UcpMcpController } from './ucp-mcp.controller';
import { UcpOpenApiController } from './openapi.controller';
import { WellKnownUcpController } from './well-known.controller';

/**
 * UCP Checkout module — port + adapter pattern.
 *
 * Adapter selection via `UCP_ADAPTER` env var (default: `mock`).
 * Add a new adapter:
 *   1. Implement `UcpCheckoutPort` in `adapters/<name>.adapter.ts`
 *   2. Add a case to the switch below
 *   3. Set `UCP_ADAPTER=<name>` in `.env`
 *
 * No controller/caller change required.
 */
@Module({
  controllers: [UcpCheckoutController, UcpMcpController, UcpOpenApiController, WellKnownUcpController],
  providers: [
    {
      provide: UcpCheckoutPort,
      useFactory: (config: ConfigService) => {
        const adapter = config.get<string>('UCP_ADAPTER', 'mock');
        switch (adapter) {
          case 'mock':
            return new MockUcpCheckoutAdapter();
          case 'stripe':
            return new StripeUcpCheckoutAdapter();
          default:
            throw new Error(`Unknown UCP adapter: ${adapter}. Supported: mock, stripe`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [UcpCheckoutPort],
})
export class UcpCheckoutModule {}
