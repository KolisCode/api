import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import helmet from 'helmet';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter';

/**
 * Configuración global compartida por el bootstrap real (`main.ts`) y los
 * tests e2e, para que ambos apliquen el mismo versionado, validación,
 * headers de seguridad y formato de errores. No incluye CORS, logging ni
 * assets estáticos: eso vive solo en `main.ts`.
 */
export function configureApp(app: INestApplication): void {
  app.use(
    helmet({
      // La landing (public/index.html) usa JS inline y /reference (Scalar)
      // carga desde cdn.jsdelivr.net: un CSP por defecto rompe ambos.
      contentSecurityPolicy: false,
      // Los PNG de QR deben poder consumirse desde otros orígenes.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
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
