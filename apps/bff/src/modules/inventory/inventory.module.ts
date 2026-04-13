import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InventoryPort } from './ports/inventory.port';
import { MockInventoryAdapter } from './adapters/mock.adapter';
import { InventoryController } from './inventory.controller';

@Module({
  controllers: [InventoryController],
  providers: [
    {
      provide: InventoryPort,
      useFactory: (config: ConfigService) => {
        const adapter = config.get<string>('INVENTORY_ADAPTER', 'mock');
        switch (adapter) {
          case 'mock':
            return new MockInventoryAdapter();
          default:
            throw new Error(`Unknown inventory adapter: ${adapter}. Supported: mock`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [InventoryPort],
})
export class InventoryModule {}
