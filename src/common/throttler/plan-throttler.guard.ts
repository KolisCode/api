import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
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
 * Rate limiting diferenciado por plan. Trackea por API key cuando existe
 * (resuelta antes por `ApiKeyGuard`), o por IP en rutas públicas.
 */
@Injectable()
export class PlanThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    if (req.apiKey) {
      return `key:${req.apiKey.id}`;
    }
    return `ip:${req.ip}`;
  }

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const req = requestProps.context.switchToHttp().getRequest<Request>();
    const plan = req.apiKey?.plan;
    const limit = plan ? LIMIT_BY_PLAN[plan] : ANONYMOUS_LIMIT;

    return super.handleRequest({ ...requestProps, limit });
  }
}
