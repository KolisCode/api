import { Plan } from '../../generated/prisma/client';

/** Datos de la API key autenticada, adjuntados al request por el guard. */
export interface AuthenticatedKey {
  id: string;
  prefix: string;
  plan: Plan;
}

declare module 'express' {
  interface Request {
    apiKey?: AuthenticatedKey;
  }
}
