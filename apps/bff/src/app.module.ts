import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { CmsModule } from './modules/cms/cms.module';
import { StorageModule } from './modules/storage/storage.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { IdentityModule } from './modules/identity/identity.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { ESignatureModule } from './modules/esignature/esignature.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ChatModule } from './modules/chat/chat.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    AuthModule,
    HealthModule,
    CmsModule,
    StorageModule,
    NotificationsModule,
    SearchModule,
    DocumentsModule,
    IdentityModule,
    IntegrationModule,
    ESignatureModule,
    SchedulingModule,
    PaymentsModule,
    ChatModule,
    WorkflowModule,
    AuditModule,
  ],
})
export class AppModule {}
