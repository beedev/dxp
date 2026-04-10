import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MacroDataPort } from './ports/macro-data.port';
import { WorldBankAdapter } from './adapters/worldbank.adapter';
import { MockMacroAdapter } from './adapters/mock-macro.adapter';
import { MacroDataController } from './macro-data.controller';

@Module({
  controllers: [MacroDataController],
  providers: [
    {
      provide: MacroDataPort,
      useFactory: (config: ConfigService) => {
        const adapter = config.get<string>('MACRO_ADAPTER', 'mock');
        switch (adapter) {
          case 'worldbank':
            return new WorldBankAdapter();
          case 'mock':
            return new MockMacroAdapter();
          default:
            throw new Error(`Unknown macro adapter: ${adapter}. Supported: worldbank, mock`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [MacroDataPort],
})
export class MacroDataModule {}
