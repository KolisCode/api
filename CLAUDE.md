# KolisKit API — contexto para Claude

API de portafolio con doble público: landing/playground en `/` para público general y API REST
para devs. **Producción: https://api.kolisevm.online** (droplet DO · PM2 `koliskit-api` :3007 ·
nginx + certbot · PostgreSQL local del droplet, DB `koliskit`). Repo: `KolisCode/api`.

## Stack y comandos

- NestJS 11 · Prisma 7 (generador `prisma-client` + adapter `pg`, config en `prisma.config.ts`,
  sin `url` en el schema) · PostgreSQL 17 · Scalar en `/reference`.
- DB local: `npm run db:up` → Docker **puerto 5434** (5432/5433 los usan otros proyectos).
- `npm run build` = `nest build` **+ `build:css`** (Tailwind v4 → `public/styles.css`, gitignored).
- Tests: `npm run test:e2e` (necesita la DB local arriba). Lint SIN `--fix` debe salir limpio
  (CI lo exige): `npx eslint "src/**/*.ts" "test/**/*.ts"`.
- Deploy: `./deploy.sh` (rsync desde local → build en droplet → `pm2 reload`). **No** usa git
  pull: el repo es privado y el droplet no tiene credenciales de GitHub.

## Arquitectura (lo no obvio)

- **Guards globales en orden**: `ApiKeyGuard` (resuelve `req.apiKey`, respeta `@Public()`)
  ANTES de `PlanThrottlerGuard`. El límite por plan es un `limit` **dinámico del
  ThrottlerModule** (`planLimitResolver`) — NO sobrescribir `handleRequest`, o los `@Throttle()`
  por ruta dejan de funcionar. `POST /v1/keys` tiene `@Throttle` 5/hora por IP (anti-abuso).
- Errores → RFC 7807 vía `ProblemDetailsFilter`. Config compartida app/tests en
  `src/app-config.ts` (`configureApp`).
- `public/` se sirve con `useStaticAssets` **fuera de los guards** (por eso la landing es
  pública). La landing crea su API key sola (localStorage + retry en 401).
- Redirect público de enlaces: `GET /r/:code` (302, registra clic).

## Gotchas que ya costaron tiempo

- **Tailwind v4 + estilos custom**: los `<style>` del HTML van en `@layer components`; sin capa
  pisan a las utilidades (`w-*`, `flex-1`) porque unlayered > layered. v4 también quitó
  `cursor:pointer` de botones (restaurado a mano).
- **Jest + Prisma 7**: el cliente generado usa specifiers `.js` → `moduleNameMapper`
  `^(\.{1,2}/.*)\.js$ → $1` en `test/jest-e2e.json`; `nanoid` (ESM) se transforma vía
  `transformIgnorePatterns`; `@faker-js/faker` (ESM) está stubbeado en `test/mocks/faker.ts`;
  tsconfig propio `test/tsconfig.spec.json` (commonjs + `resolvePackageJsonExports:false`).
- **Tras `pm2 reload` hay ~5 s de 502** (fork mode) — no es fallo de deploy.
- `curl -w '%{http_code}' … || echo "000"` duplica el 000 (curl ya lo imprime al fallar) —
  bug que rompía los healthchecks del droplet; ya corregido en los 6.
- `public/google*.html` es la verificación de Search Console: **no borrar** (debe persistir).
- En local, el puerto 3000 suele estar ocupado por otra app → usar `PORT=3009` para pruebas.

## Operación en producción

- Healthcheck: cron cada 5 min en el droplet (`/usr/local/bin/koliskit-api-healthcheck.sh`)
  → verifica `:3007/health` y reinicia por PM2 si cae. Log: `/var/log/koliskit-api-healthcheck.log`.
- Secretos SOLO en el `.env` del droplet (`/var/www/koliskit-api/.env`, chmod 600).
- SEO: sitemap enviado en Search Console; monitorear búsquedas en SC → Rendimiento.
