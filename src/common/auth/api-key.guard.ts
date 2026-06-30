import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { hashApiKey } from './api-key.util';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Guard global: exige una API key válida vía `Authorization: Bearer <key>`
 * o `x-api-key`, salvo en rutas marcadas con `@Public()`.
 * Adjunta la key autenticada a `request.apiKey`.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const raw = this.extractKey(request);

    // En rutas públicas, si viene una key la resolvemos igual (best-effort)
    // para poder aplicar el rate limit por plan; si no, seguimos sin auth.
    if (isPublic && !raw) {
      return true;
    }

    if (!raw) {
      throw new UnauthorizedException(
        'Falta la API key. Usa el header "Authorization: Bearer <key>" o "x-api-key".',
      );
    }

    const key = await this.prisma.apiKey.findUnique({
      where: { hash: hashApiKey(raw) },
      select: { id: true, prefix: true, plan: true, revokedAt: true },
    });

    if (!key || key.revokedAt) {
      if (isPublic) return true;
      throw new UnauthorizedException('API key inválida o revocada.');
    }

    request.apiKey = { id: key.id, prefix: key.prefix, plan: key.plan };

    void this.prisma.apiKey
      .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);

    return true;
  }

  private extractKey(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      return header.slice(7).trim();
    }
    const xApiKey = request.headers['x-api-key'];
    if (typeof xApiKey === 'string' && xApiKey.length > 0) {
      return xApiKey;
    }
    return undefined;
  }
}
