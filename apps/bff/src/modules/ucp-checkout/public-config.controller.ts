import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UcpPublicConfig, UCP_VERSION } from '@dxp/contracts';
import { UcpCheckoutPort } from './ports/ucp-checkout.port';

/**
 * Public config — what the browser needs to drive the embedded checkout flow.
 *
 * Specifically the Stripe **publishable key** (safe to expose by design;
 * different from the secret key). Browsers fetch this once and pass the
 * publishable key into Stripe.js's `loadStripe()`.
 *
 * Mounted at /api/v1/ucp/public-config; no auth — discovery is public.
 */
@ApiTags('ucp-public-config')
@Controller('ucp/public-config')
export class UcpPublicConfigController {
  constructor(private readonly ucp: UcpCheckoutPort) {}

  @Get()
  @ApiOperation({ summary: 'Public config for client-side payment capture' })
  config(): UcpPublicConfig {
    return {
      ucp_version: UCP_VERSION,
      stripe_publishable_key: this.ucp.getPublishableKey() ?? undefined,
    };
  }
}
