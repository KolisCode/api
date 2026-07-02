import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, seconds } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { ApiKeyGuard } from './common/auth/api-key.guard';
import {
  PlanThrottlerGuard,
  planLimitResolver,
} from './common/throttler/plan-throttler.guard';
import { KeysModule } from './modules/keys/keys.module';
import { LinksModule } from './modules/links/links.module';
import { QrModule } from './modules/qr/qr.module';
import { ToolsModule } from './modules/tools/tools.module';
import { ConvertModule } from './modules/convert/convert.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: process.env.NODE_ENV !== 'test',
        redact: ['req.headers.authorization', 'req.headers["x-api-key"]'],
      },
    }),
    ThrottlerModule.forRoot({
      // El límite por defecto se resuelve por plan (FREE/PRO) o por IP anónima;
      // las rutas con @Throttle() propio (p. ej. POST /v1/keys) lo sobreescriben.
      throttlers: [{ ttl: seconds(60), limit: planLimitResolver }],
      errorMessage:
        'Demasiadas solicitudes. Espera un momento e intenta de nuevo.',
    }),
    PrismaModule,
    KeysModule,
    LinksModule,
    QrModule,
    ToolsModule,
    ConvertModule,
    HealthModule,
  ],
  providers: [
    // Orden importante: la key se resuelve antes de aplicar el rate limit por plan.
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_GUARD, useClass: PlanThrottlerGuard },
  ],
})
export class AppModule {}
