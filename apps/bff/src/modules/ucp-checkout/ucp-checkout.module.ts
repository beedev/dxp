import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UcpCheckoutPort } from './ports/ucp-checkout.port';
import { MockUcpCheckoutAdapter } from './adapters/mock.adapter';
import { PaymentsBackedUcpCheckoutAdapter } from './adapters/payments-backed.adapter';
import { UcpCheckoutController } from './ucp-checkout.controller';
import { UcpMcpController } from './ucp-mcp.controller';
import { UcpOpenApiController } from './openapi.controller';
import { UcpPublicConfigController } from './public-config.controller';
import { WellKnownUcpController } from './well-known.controller';
import { PaymentsModule } from '../payments/payments.module';
import { PaymentsPort } from '../payments/ports/payments.port';

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
  imports: [PaymentsModule],
  controllers: [
    UcpCheckoutController,
    UcpMcpController,
    UcpOpenApiController,
    UcpPublicConfigController,
    WellKnownUcpController,
  ],
  providers: [
    {
      provide: UcpCheckoutPort,
      useFactory: (config: ConfigService, payments: PaymentsPort) => {
        // Default to the payments-backed adapter so any region/processor
        // wired through PaymentsPort (Stripe, Razorpay, MercadoPago, …)
        // automatically powers UCP without per-provider UCP code.
        const adapter = config.get<string>('UCP_ADAPTER', 'payments-backed');
        switch (adapter) {
          case 'mock':
            return new MockUcpCheckoutAdapter();
          case 'payments-backed':
          case 'stripe': // legacy alias — same adapter, payments processor chosen via PAYMENTS_PROVIDER
            return new PaymentsBackedUcpCheckoutAdapter(payments, config);
          default:
            throw new Error(
              `Unknown UCP_ADAPTER: ${adapter}. Supported: mock, payments-backed (default)`,
            );
        }
      },
      inject: [ConfigService, PaymentsPort],
    },
  ],
  exports: [UcpCheckoutPort],
})
export class UcpCheckoutModule {}
