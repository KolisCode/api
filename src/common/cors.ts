import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * Allowlist de CORS por env `CORS_ORIGINS` (CSV de orígenes exactos).
 * Sin la variable, cae a los dominios propios de koliscode. En cualquier
 * entorno que no sea production se aceptan además localhost/127.0.0.1 en
 * cualquier puerto (dev del portafolio, playgrounds locales).
 *
 * Las peticiones sin header `Origin` (curl, server-to-server, same-origin)
 * no participan en CORS y siempre pasan; a un origen no listado simplemente
 * no se le emiten headers CORS (el navegador bloquea, la API no responde 500).
 */
const DEFAULT_ORIGINS = 'https://koliscode.com,https://api.koliscode.com';
const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function buildCorsOptions(
  env: Record<string, string | undefined> = process.env,
): CorsOptions {
  const allowlist = (env.CORS_ORIGINS ?? DEFAULT_ORIGINS)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowLocalhost = env.NODE_ENV !== 'production';

  return {
    origin(origin, callback) {
      const allowed =
        !origin ||
        allowlist.includes(origin) ||
        (allowLocalhost && LOCALHOST_RE.test(origin));
      callback(null, allowed);
    },
  };
}
