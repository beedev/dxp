import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsPort, CreatePaymentDto } from './ports/payments.port';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsPort) {}

  @Post()
  @ApiOperation({ summary: 'Create payment intent' })
  create(@Body() dto: CreatePaymentDto) { return this.payments.createPayment(dto); }

  @Get()
  @ApiOperation({ summary: 'List payments' })
  list(@Query('customerId') customerId?: string) { return this.payments.listPayments(customerId); }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment' })
  get(@Param('id') id: string) { return this.payments.getPayment(id); }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund payment' })
  refund(@Param('id') id: string, @Body('amount') amount?: number) { return this.payments.refundPayment(id, amount); }

  @Post('subscriptions')
  @ApiOperation({ summary: 'Create subscription' })
  subscribe(@Body() body: { customerId: string; planId: string }) { return this.payments.createSubscription(body.customerId, body.planId); }

  @Get('subscriptions/:customerId')
  @ApiOperation({ summary: 'List subscriptions' })
  listSubs(@Param('customerId') customerId: string) { return this.payments.listSubscriptions(customerId); }
}
