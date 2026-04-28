import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestContextInterceptor } from './common/interceptors/request-context.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // UCP discovery doc must live at the unprefixed `/.well-known/ucp` per spec.
  app.setGlobalPrefix('api/v1', {
    exclude: ['.well-known/ucp', '.well-known/(.*)'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestContextInterceptor());

  app.enableCors({
    origin: [
      // Portals
      'http://localhost:4200', // insurance
      'http://localhost:4300', // payer
      'http://localhost:4400', // wealth
      'http://localhost:4500', // ace-hardware
      'http://localhost:4501', // meijer-retail
      // Dev tools (standalone vite dev servers)
      'http://localhost:4600', // playground
      'http://localhost:4700', // storybook
      'http://localhost:4800', // docs
    ],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DXP Platform API')
    .setDescription('Digital Experience Platform — Backend for Frontend API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('health', 'Health checks')
    .addTag('cms', 'Content Management')
    .addTag('storage', 'File Storage')
    .addTag('notifications', 'Notifications')
    .addTag('search', 'Search')
    .addTag('workflow', 'Workflow Orchestration')
    .addTag('rules', 'Rules Engine')
    .addTag('analytics', 'Analytics & Feature Flags')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.BFF_PORT || 4201;
  await app.listen(port);
  console.log(`DXP BFF running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
