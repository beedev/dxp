import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { UcpCheckoutPort } from './ports/ucp-checkout.port';
import {
  CompleteSessionRequest,
  CreateSessionRequest,
  UpdateSessionRequest,
} from '@dxp/contracts';

/**
 * UCP Shopping Checkout — the inbound REST surface.
 *
 * Per UCP spec the discovery doc lives at the unprefixed `/.well-known/ucp`
 * (mounted by `WellKnownUcpController`); checkout endpoints sit under
 * `/api/v1/ucp/...` to align with the rest of the BFF.
 */
@ApiTags('ucp-checkout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ucp/checkout-sessions')
export class UcpCheckoutController {
  constructor(private readonly ucp: UcpCheckoutPort) {}

  @Post()
  @ApiOperation({ summary: 'Create a new UCP checkout session' })
  create(
    @DxpContext() ctx: DxpRequestContext,
    @Body() body: CreateSessionRequest,
  ) {
    return this.ucp.createSession(ctx.tenantId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an existing checkout session' })
  get(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
  ) {
    return this.ucp.getSession(ctx.tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a checkout session (line items, buyer, fulfillment)' })
  update(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
    @Body() body: UpdateSessionRequest,
  ) {
    return this.ucp.updateSession(ctx.tenantId, id, body);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a checkout session with payment data' })
  complete(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
    @Body() body: CompleteSessionRequest,
  ) {
    return this.ucp.completeSession(ctx.tenantId, id, body);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an open checkout session' })
  cancel(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
  ) {
    return this.ucp.cancelSession(ctx.tenantId, id);
  }
}
