import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { Plan } from '../../generated/prisma/client';

/** Límites de peticiones por minuto según el plan de la API key. */
const LIMIT_BY_PLAN: Record<Plan, number> = {
  FREE: 30,
  PRO: 120,
};

/** Límite para tráfico anónimo (sin API key), trackeado por IP. */
const ANONYMOUS_LIMIT = 60;

/**
 * Resuelve el límite por defecto según el plan de la key autenticada
 * (o el límite anónimo si no hay key). Se registra como `limit` dinámico
 * del ThrottlerModule, de modo que un `@Throttle()` puntual por ruta
 * (p. ej. la creación de API keys) lo sobreescribe con normalidad.
 */
export function planLimitResolver(context: ExecutionContext): number {
  const req = context.switchToHttp().getRequest<Request>();
  const plan = req.apiKey?.plan;
  return plan ? LIMIT_BY_PLAN[plan] : ANONYMOUS_LIMIT;
}

/**
 * Rate limiting trackeado por API key cuando existe (resuelta antes por
 * `ApiKeyGuard`), o por IP en tráfico anónimo/rutas públicas.
 */
@Injectable()
export class PlanThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    const tracker = req.apiKey ? `key:${req.apiKey.id}` : `ip:${req.ip}`;
    return Promise.resolve(tracker);
  }
}
