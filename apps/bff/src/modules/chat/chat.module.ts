import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatPort } from './ports/chat.port';
import { IntercomAdapter } from './adapters/intercom.adapter';
import { ChatController } from './chat.controller';

@Module({
  controllers: [ChatController],
  providers: [{
    provide: ChatPort,
    useFactory: (config: ConfigService) => {
      const provider = config.get<string>('CHAT_PROVIDER', 'intercom');
      switch (provider) {
        case 'intercom': return new IntercomAdapter(config);
        // case 'zendesk': return new ZendeskAdapter(config);
        // case 'freshdesk': return new FreshdeskAdapter(config);
        default: throw new Error(`Unknown chat provider: ${provider}`);
      }
    },
    inject: [ConfigService],
  }],
  exports: [ChatPort],
})
export class ChatModule {}
