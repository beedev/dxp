import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { BrokerGatewayPort } from './ports/broker-gateway.port';
import { PlaceOrderRequest } from '@dxp/contracts';

@ApiTags('broker')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('broker')
export class BrokerGatewayController {
  constructor(private readonly brokerGateway: BrokerGatewayPort) {}

  @Get('account')
  @ApiOperation({ summary: 'Get live broker account balance and buying power' })
  getBrokerAccount(@DxpContext() ctx: DxpRequestContext) {
    return this.brokerGateway.getBrokerAccount(ctx.userId);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Place a live order through the connected broker' })
  placeBrokerOrder(
    @DxpContext() ctx: DxpRequestContext,
    @Body() req: PlaceOrderRequest,
  ) {
    return this.brokerGateway.placeBrokerOrder(ctx.userId, req);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get live orders from the connected broker' })
  getBrokerOrders(@DxpContext() ctx: DxpRequestContext) {
    return this.brokerGateway.getBrokerOrders(ctx.userId);
  }

  @Delete('orders/:id')
  @ApiOperation({ summary: 'Cancel a live order at the connected broker' })
  cancelBrokerOrder(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
  ) {
    return this.brokerGateway.cancelBrokerOrder(ctx.userId, id);
  }
}
