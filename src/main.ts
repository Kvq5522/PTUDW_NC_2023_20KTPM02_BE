import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://qvk-hhdh-ptudw-nc-2023-20ktpm02.vercel.app/',
    ],
    methods: 'GET,PATCH,DELETE,POST,PUT',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Allow-Access-Control-Origin',
    ],
    preflightContinue: false,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  await app.listen(1507);
}
bootstrap();
