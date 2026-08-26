import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not declared on the DTO
      forbidNonWhitelisted: true, // reject requests that send extra fields
      transform: true, // turn plain JSON into DTO class instances
    }),
  );

  const corsOrigins = config.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(',');
  app.enableCors({ origin: corsOrigins, credentials: true });

  app.setGlobalPrefix('api');

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  Logger.log(`KAKSAM API listening on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
