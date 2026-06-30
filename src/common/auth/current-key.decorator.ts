import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedKey } from './authenticated-key';

/** Inyecta la API key autenticada (`request.apiKey`) en el handler. */
export const CurrentKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedKey => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.apiKey as AuthenticatedKey;
  },
);
