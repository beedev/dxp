import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ESignaturePort } from './ports/esignature.port';
import { DocuSignAdapter } from './adapters/docusign.adapter';
import { ESignatureController } from './esignature.controller';

@Module({
  controllers: [ESignatureController],
  providers: [{
    provide: ESignaturePort,
    useFactory: (config: ConfigService) => {
      const provider = config.get<string>('ESIGNATURE_PROVIDER', 'docusign');
      switch (provider) {
        case 'docusign': return new DocuSignAdapter(config);
        default: throw new Error(`Unknown e-signature provider: ${provider}`);
      }
    },
    inject: [ConfigService],
  }],
  exports: [ESignaturePort],
})
export class ESignatureModule {}
