import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrokerGatewayPort } from './ports/broker-gateway.port';
import { TigerBrokerAdapter } from './adapters/tiger-broker.adapter';
import { IbkrAdapter } from './adapters/ibkr.adapter';
import { BrokerGatewayController } from './broker-gateway.controller';
import { PaperTradingModule } from '../paper-trading/paper-trading.module';

@Module({
  imports: [PaperTradingModule],
  controllers: [BrokerGatewayController],
  providers: [
    {
      provide: BrokerGatewayPort,
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('BROKER_PROVIDER', 'tiger');
        switch (provider) {
          case 'tiger':
            return new TigerBrokerAdapter(config);
          case 'ibkr':
            return new IbkrAdapter(config);
          default:
            throw new Error(`Unknown broker provider: ${provider}. Supported: tiger, ibkr`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [BrokerGatewayPort],
})
export class BrokerGatewayModule {}
