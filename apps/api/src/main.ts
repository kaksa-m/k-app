import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import type { NextFunction, Request, Response } from 'express';

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
  app.enableCors({ origin: corsOrigins.map((x) => x.trim()).filter(Boolean), credentials: true, methods: ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] });

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  app.setGlobalPrefix('api');

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  Logger.log(`KAKSAM API listening on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
