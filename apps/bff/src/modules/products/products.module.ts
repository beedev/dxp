import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductsPort } from './ports/products.port';
import { ConvAssistantProductsAdapter } from './adapters/conv-assistant.adapter';
import { ProductsController } from './products.controller';

/**
 * Products module — port + adapter pattern.
 *
 * Selection via `PRODUCTS_ADAPTER` env var (default: `conv-assistant`,
 * which proxies to the running conv-assistant's pgvector search).
 */
@Module({
  controllers: [ProductsController],
  providers: [
    {
      provide: ProductsPort,
      useFactory: (config: ConfigService) => {
        const adapter = config.get<string>('PRODUCTS_ADAPTER', 'conv-assistant');
        switch (adapter) {
          case 'conv-assistant':
            return new ConvAssistantProductsAdapter(config);
          default:
            throw new Error(`Unknown PRODUCTS_ADAPTER: ${adapter}`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [ProductsPort],
})
export class ProductsModule {}
