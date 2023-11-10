import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,PATCH,DELETE,POST,PUT',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Access-Control-Allow-Origin',
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
