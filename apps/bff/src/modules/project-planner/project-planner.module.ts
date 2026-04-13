import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProjectPlannerPort } from './ports/project-planner.port';
import { MockProjectPlannerAdapter } from './adapters/mock.adapter';
import { ProjectPlannerController } from './project-planner.controller';

@Module({
  controllers: [ProjectPlannerController],
  providers: [
    {
      provide: ProjectPlannerPort,
      useFactory: (config: ConfigService) => {
        const adapter = config.get<string>('PROJECT_PLANNER_ADAPTER', 'mock');
        switch (adapter) {
          case 'mock':
            return new MockProjectPlannerAdapter();
          default:
            throw new Error(`Unknown project planner adapter: ${adapter}. Supported: mock`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [ProjectPlannerPort],
})
export class ProjectPlannerModule {}
