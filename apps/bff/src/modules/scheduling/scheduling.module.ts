import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulingPort } from './ports/scheduling.port';
import { GoogleCalendarAdapter } from './adapters/google-calendar.adapter';
import { SchedulingController } from './scheduling.controller';

@Module({
  controllers: [SchedulingController],
  providers: [{
    provide: SchedulingPort,
    useFactory: (config: ConfigService) => {
      const provider = config.get<string>('SCHEDULING_PROVIDER', 'google');
      switch (provider) {
        case 'google': return new GoogleCalendarAdapter(config);
        // case 'outlook': return new OutlookCalendarAdapter(config);
        // case 'calendly': return new CalendlyAdapter(config);
        default: throw new Error(`Unknown scheduling provider: ${provider}`);
      }
    },
    inject: [ConfigService],
  }],
  exports: [SchedulingPort],
})
export class SchedulingModule {}
