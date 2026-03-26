import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditPort } from './ports/audit.port';
import { PostgresAuditAdapter } from './adapters/postgres-audit.adapter';
import { AuditController } from './audit.controller';

@Module({
  controllers: [AuditController],
  providers: [{
    provide: AuditPort,
    useFactory: (config: ConfigService) => {
      const provider = config.get<string>('AUDIT_PROVIDER', 'postgres');
      switch (provider) {
        case 'postgres': return new PostgresAuditAdapter(config);
        // case 'datadog': return new DatadogAuditAdapter(config);
        // case 'splunk': return new SplunkAuditAdapter(config);
        default: throw new Error(`Unknown audit provider: ${provider}`);
      }
    },
    inject: [ConfigService],
  }],
  exports: [AuditPort],
})
export class AuditModule {}
