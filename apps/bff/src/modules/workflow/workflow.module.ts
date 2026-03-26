import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WorkflowPort } from './ports/workflow.port';
import { N8nAdapter } from './adapters/n8n.adapter';
import { WorkflowController } from './workflow.controller';

@Module({
  controllers: [WorkflowController],
  providers: [{
    provide: WorkflowPort,
    useFactory: (config: ConfigService) => {
      const provider = config.get<string>('WORKFLOW_PROVIDER', 'n8n');
      switch (provider) {
        case 'n8n': return new N8nAdapter(config);
        // case 'temporal': return new TemporalAdapter(config);
        // case 'camunda': return new CamundaAdapter(config);
        default: throw new Error(`Unknown workflow provider: ${provider}`);
      }
    },
    inject: [ConfigService],
  }],
  exports: [WorkflowPort],
})
export class WorkflowModule {}
