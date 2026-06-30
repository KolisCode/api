import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app-config';
import { PlanThrottlerGuard } from '../src/common/throttler/plan-throttler.guard';
import { PrismaService } from '../src/prisma/prisma.service';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  /** Servidor HTTP listo para pasar a supertest. */
  http: () => App;
}

/**
 * Arranca la app con la misma configuración que producción, pero desactivando
 * el rate limiting (`PlanThrottlerGuard`) para que la batería de tests no
 * choque contra los límites por minuto. El `ApiKeyGuard` se mantiene activo.
 */
export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideGuard(PlanThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();

  return {
    app,
    prisma: app.get(PrismaService),
    http: () => app.getHttpServer() as App,
  };
}

/** Crea una API key real vía la API y devuelve su id + clave completa. */
export async function createApiKey(
  http: App,
  name = 'e2e-key',
): Promise<{ id: string; key: string }> {
  const res = await request(http).post('/v1/keys').send({ name });
  return { id: res.body.id as string, key: res.body.key as string };
}
