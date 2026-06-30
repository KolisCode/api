import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter';

/**
 * Configuración global compartida por el bootstrap real (`main.ts`) y los
 * tests e2e, para que ambos apliquen el mismo versionado, validación y
 * formato de errores. No incluye CORS, logging ni assets estáticos: eso
 * vive solo en `main.ts`.
 */
export function configureApp(app: INestApplication): void {
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter());
}
