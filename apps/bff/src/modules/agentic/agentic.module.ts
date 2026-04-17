import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgenticController } from './agentic.controller';
import { AgenticPort } from './ports/agentic.port';
import { LangGraphAdapter } from './adapters/langgraph.adapter';
import { MockAgenticAdapter } from './adapters/mock.adapter';

@Module({
  controllers: [AgenticController],
  providers: [
    {
      provide: AgenticPort,
      useFactory: (config: ConfigService) => {
        const adapter = config.get<string>('AGENTIC_ADAPTER', 'langgraph');
        switch (adapter) {
          case 'langgraph':
            return new LangGraphAdapter(config);
          case 'mock':
            return new MockAgenticAdapter();
          default:
            throw new Error(
              `Unknown agentic adapter: ${adapter}. Supported: langgraph, mock`,
            );
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [AgenticPort],
})
export class AgenticModule {}
