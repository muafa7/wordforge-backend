import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // strip unknown properties
      transform: true,       // auto-cast payloads to DTO types
      forbidNonWhitelisted: false, // silently strip, don't error on extra fields
    }),
  );

  app.enableCors({
    origin: [
      "https://wordforge-frontend.pages.dev",
      "http://localhost:5173",
    ],
    credentials: true,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
