import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });

  // ── Validation ────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Swagger ───────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Smart Market DVD API')
    .setDescription(
      'Marketplace API for DVD products with intelligent promotion engine.\n\n' +
        '**Promotion rules (per saga)**\n' +
        '| Distinct volumes | Discount |\n' +
        '|---|---|\n' +
        '| 1 | 0 % |\n' +
        '| 2 | 10 % |\n' +
        '| ≥ 3 | 20 % |',
    )
    .setVersion('1.0')
    .addTag('Products', 'Browse the DVD catalogue')
    .addTag('Cart', 'Price calculation with promotion engine')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 8000);
}
void bootstrap();
