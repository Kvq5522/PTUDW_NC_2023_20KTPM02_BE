import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://qvk-hhdh-ptudw-nc-2023-20ktpm02.vercel.app/',
    ],
    methods: 'GET,PATCH,DELETE,POST,PUT',
    allowedHeaders: '*',
    preflightContinue: false,
    credentials: true,
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.headers.origin && req.method === 'OPTIONS') {
      return res.status(200).send('handled');
    } else {
      return next();
    }
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  await app.listen(1507);
}
bootstrap();
