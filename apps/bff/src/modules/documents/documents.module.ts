import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentPort } from './ports/document.port';
import { S3DocumentAdapter } from './adapters/s3.adapter';
import { SharePointAdapter } from './adapters/sharepoint.adapter';
import { DocumentsController } from './documents.controller';

@Module({
  controllers: [DocumentsController],
  providers: [{
    provide: DocumentPort,
    useFactory: (config: ConfigService) => {
      const provider = config.get<string>('DOCUMENT_PROVIDER', 's3');
      switch (provider) {
        case 's3': return new S3DocumentAdapter(config);
        case 'sharepoint': return new SharePointAdapter(config);
        default: throw new Error(`Unknown document provider: ${provider}`);
      }
    },
    inject: [ConfigService],
  }],
  exports: [DocumentPort],
})
export class DocumentsModule {}
