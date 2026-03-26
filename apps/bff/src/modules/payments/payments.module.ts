import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsPort } from './ports/payments.port';
import { StripeAdapter } from './adapters/stripe.adapter';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [{
    provide: PaymentsPort,
    useFactory: (config: ConfigService) => {
      const provider = config.get<string>('PAYMENTS_PROVIDER', 'stripe');
      switch (provider) {
        case 'stripe': return new StripeAdapter(config);
        // case 'paypal': return new PayPalAdapter(config);
        default: throw new Error(`Unknown payments provider: ${provider}`);
      }
    },
    inject: [ConfigService],
  }],
  exports: [PaymentsPort],
})
export class PaymentsModule {}
