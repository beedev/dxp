import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdentityPort } from './ports/identity.port';
import { KeycloakAdminAdapter } from './adapters/keycloak-admin.adapter';
import { AzureAdAdapter } from './adapters/azure-ad.adapter';
import { IdentityController } from './identity.controller';

@Module({
  controllers: [IdentityController],
  providers: [{
    provide: IdentityPort,
    useFactory: (config: ConfigService) => {
      const provider = config.get<string>('IDENTITY_PROVIDER', 'keycloak');
      switch (provider) {
        case 'keycloak': return new KeycloakAdminAdapter(config);
        case 'azure-ad': return new AzureAdAdapter(config);
        default: throw new Error(`Unknown identity provider: ${provider}`);
      }
    },
    inject: [ConfigService],
  }],
  exports: [IdentityPort],
})
export class IdentityModule {}
