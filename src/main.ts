import 'dotenv/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  // Necesario para que req.ip sea correcto tras el proxy (nginx/Cloudflare).
  app.set('trust proxy', 1);

  app.enableCors();
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter());

  // ---- OpenAPI + Scalar --------------------------------------------------
  const config = new DocumentBuilder()
    .setTitle('KolisKit API')
    .setDescription(
      'Toolbox de utilidades para desarrolladores: enlaces cortos con ' +
        'analytics, QR y más. Crea una API key en `POST /v1/keys` y úsala ' +
        'como `Authorization: Bearer <key>`.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', description: 'Tu API key de KolisKit' },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  app.use('/openapi.json', (_req: ExpressRequest, res: ExpressResponse) =>
    res.json(document),
  );
  app.use(
    '/reference',
    apiReference({
      content: document,
      cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  app.get(Logger).log(`KolisKit API en http://localhost:${port}/reference`);
}
void bootstrap();
