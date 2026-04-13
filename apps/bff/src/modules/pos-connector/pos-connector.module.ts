import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PosConnectorPort } from './ports/pos-connector.port';
import { MockPosAdapter } from './adapters/mock.adapter';
import { PosConnectorController } from './pos-connector.controller';

@Module({
  controllers: [PosConnectorController],
  providers: [
    {
      provide: PosConnectorPort,
      useFactory: (config: ConfigService) => {
        const adapter = config.get<string>('POS_ADAPTER', 'mock');
        switch (adapter) {
          case 'mock':
            return new MockPosAdapter();
          default:
            throw new Error(`Unknown POS adapter: ${adapter}. Supported: mock`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [PosConnectorPort],
})
export class PosConnectorModule {}
