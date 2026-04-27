import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UcpCheckoutPort } from './ports/ucp-checkout.port';

/**
 * UCP Discovery doc — mounted at the server root per UCP spec, NOT under the
 * /api/v1 global prefix. The prefix exclusion is configured in main.ts.
 *
 * Public, no auth: discovery is open by design (any agent can read it before
 * deciding whether to authenticate for a checkout flow).
 */
@ApiTags('ucp-discovery')
@Controller('.well-known/ucp')
export class WellKnownUcpController {
  constructor(private readonly ucp: UcpCheckoutPort) {}

  @Get()
  @ApiOperation({ summary: 'UCP profile (capabilities + transports)' })
  profile() {
    return this.ucp.getProfile();
  }
}
