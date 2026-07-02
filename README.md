# KolisKit API

Toolbox de utilidades con **doble público**: una landing/playground en `/` pensada para
cualquier persona (sin jerga, sin registro) y una **API REST documentada** para
desarrolladores. Módulo estrella: **enlaces cortos con analytics**.

**En vivo:** https://api.koliscode.com

**Stack:** NestJS 11 · Prisma 7 (driver adapter `pg`) · PostgreSQL 17 · OpenAPI + [Scalar](https://scalar.com) · Tailwind v4 compilado.

---

## Características

- 🔑 **API keys + planes** (`FREE` / `PRO`) con **rate limiting diferenciado** por plan.
- 🔗 **Enlaces cortos** con código personalizado o autogenerado y expiración opcional.
- 📊 **Analytics de clics**: total, desglose por dispositivo / navegador / país, top referrers y timeline diaria (IP anonimizada con HMAC).
- 🔳 **Generador de QR** (PNG/SVG, tamaño y colores configurables), con QR directo de cada enlace.
- 🧰 **Toolbox**: datos fake reproducibles (seed/locale), UUID v4, slugify, validación de tarjetas (Luhn + marca) y generador de contraseñas (crypto + entropía).
- 🔄 **Conversiones**: unidades (longitud, masa, volumen, área, velocidad, tiempo, datos, temperatura) y monedas con tasas en vivo (~160 divisas, cacheadas).
- 🎮 **Landing + playground** en `/` apta para no-desarrolladores: el acceso (API key) se crea
  solo al usar cualquier herramienta, resultados en lenguaje humano con botón *Copiar*,
  selectores en español para unidades/monedas, y JSON técnico plegado por tarjeta.
- 🛡️ **Anti-abuso**: crear API keys está limitado a 5/hora por IP (`@Throttle` por ruta sobre
  un límite global dinámico por plan).
- 🔎 **SEO/compartir**: metas Open Graph + Twitter Card con `og-image` real, JSON-LD
  (`WebApplication`), `robots.txt`, `sitemap.xml` y verificación de Google Search Console.
- 📖 **Docs interactivas** en `/reference` (Scalar) + spec en `/openapi.json`.
- ⚠️ **Errores consistentes** con [RFC 7807](https://datatracker.ietf.org/doc/html/rfc7807) (`application/problem+json`).
- 🧱 Versionado por URI (`/v1`), validación estricta, logs estructurados (pino), health check.

---

## Arranque rápido (local)

```bash
cp .env.example .env        # ajusta secretos si quieres
npm install
npm run db:up               # Postgres en Docker (puerto 5434)
npm run prisma:migrate      # aplica migraciones
npm run build:css           # genera public/styles.css (Tailwind)
npm run start:dev
```

- Landing/playground: http://localhost:3000
- Docs:   http://localhost:3000/reference
- Spec:   http://localhost:3000/openapi.json
- Health: http://localhost:3000/health

---

## Flujo de uso

```bash
# 1) Crea una API key (pública, plan FREE)
curl -X POST http://localhost:3000/v1/keys \
  -H 'Content-Type: application/json' -d '{"name":"Mi app"}'
# => { "key": "kk_live_xxx", ... }  (se muestra UNA sola vez)

# 2) Crea un enlace corto
curl -X POST http://localhost:3000/v1/links \
  -H 'Authorization: Bearer kk_live_xxx' \
  -H 'Content-Type: application/json' \
  -d '{"targetUrl":"https://nestjs.com/","code":"nest"}'
# => { "shortUrl": "http://localhost:3000/r/nest", ... }

# 3) Visita el enlace (registra el clic)
curl -L http://localhost:3000/r/nest

# 4) Consulta analytics
curl http://localhost:3000/v1/links/nest/stats \
  -H 'Authorization: Bearer kk_live_xxx'
```

---

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/v1/keys` | — | Crear API key (demo) |
| `GET`  | `/v1/keys/me` | ✅ | Info de la key actual |
| `POST` | `/v1/links` | ✅ | Crear enlace corto |
| `GET`  | `/v1/links` | ✅ | Listar enlaces (cursor) |
| `GET`  | `/v1/links/:code/stats` | ✅ | Analytics del enlace |
| `GET`  | `/v1/links/:code/qr` | ✅ | QR del enlace (PNG/SVG) |
| `POST` | `/v1/qr` | ✅ | Generar QR de cualquier texto/URL |
| `GET`  | `/v1/mock/users` | ✅ | Usuarios fake (count, seed, locale) |
| `GET`  | `/v1/tools/uuid` | ✅ | Generar UUID v4 |
| `POST` | `/v1/tools/slugify` | ✅ | Texto → slug URL-safe |
| `GET`  | `/v1/tools/password` | ✅ | Generar contraseñas seguras (entropía + fuerza) |
| `GET`  | `/v1/convert/units` | ✅ | Convertir unidades (8 categorías) |
| `GET`  | `/v1/convert/currency` | ✅ | Convertir monedas (tasas en vivo) |
| `POST` | `/v1/validate/credit-card` | ✅ | Validar tarjeta (Luhn) + marca |
| `GET`  | `/r/:code` | — | Redirect público (registra clic) |
| `GET`  | `/` | — | Landing + playground interactivo |
| `GET`  | `/health` | — | Estado del servicio |

**Rate limits:** `FREE` 30 req/min · `PRO` 120 req/min · anónimo 60 req/min (por IP) ·
`POST /v1/keys` **5/hora por IP** (anti-abuso; la landing reutiliza la key por visitante).

---

## Arquitectura

```
src/
  common/
    auth/        API keys: util de hashing, guard global, @Public(), @CurrentKey()
    throttler/   rate limiting por plan
    filters/     filtro RFC 7807
  modules/
    keys/        crear / consultar API keys
    links/       enlaces, redirect y analytics
    qr/          generación de QR (PNG/SVG)
    tools/       mock data, uuid, slugify, tarjetas, contraseñas
    convert/     conversiones de unidades y monedas
    health/      health check
  prisma/        servicio Prisma (adapter pg) + módulo global
  generated/     cliente Prisma (no se versiona)
public/          estáticos servidos en / (fuera de los guards de Nest):
  index.html       landing + playground (vanilla JS; estilos custom en @layer components)
  styles.css       Tailwind v4 compilado (no se versiona; `npm run build:css`)
  og-image.png     tarjeta 1200×630 para redes · robots.txt · sitemap.xml · favicon.svg
tailwind.css     hoja fuente Tailwind (@source ./public + @theme brand)
```

> **Gotcha CSS:** los estilos custom del HTML viven en `@layer components`; si se dejan sin
> capa pisan a las utilidades de Tailwind v4 (unlayered > layered) y rompen `w-*`/`flex-1`.

---

## Tests y CI

Tests **e2e** con Jest + supertest sobre la app real (requiere Postgres en marcha):

```bash
npm run db:up           # Postgres en Docker (puerto 5434)
npm run prisma:migrate  # aplica migraciones
npm run test:e2e        # 20 tests: keys, links+redirect, toolbox, conversiones
```

Cada push y PR dispara **GitHub Actions** (`.github/workflows/ci.yml`), que en un
entorno limpio levanta un PostgreSQL, instala, hace **lint → build → migraciones → e2e**.

---

## Deploy

**En producción:** https://api.koliscode.com (DigitalOcean · PM2 puerto 3007 · nginx + HTTPS · PostgreSQL).

Deploy con un comando (rsync + build remoto + reload PM2):

```bash
./deploy.sh
```

Build manual de producción:

```bash
npm run build
npm run prisma:deploy   # migraciones en el entorno destino
npm run start:prod
```

Variables requeridas: `DATABASE_URL`, `IP_HASH_SECRET`, `PUBLIC_BASE_URL`, `PORT`, `NODE_ENV=production`.
También incluye `Dockerfile` multi-stage para contenedor.

Notas de operación:
- Tras `pm2 reload` (fork mode) hay una ventana de ~5 s en que nginx responde 502 — es el
  arranque normal, no un fallo del deploy.
- Un **healthcheck** en cron (cada 5 min, en el droplet) verifica `/health` y reinicia el
  servicio vía PM2 si está caído.

---

## SEO / descubribilidad

- Previews al compartir: metas OG/Twitter + `og-image.png` (1200×630).
- `robots.txt` (excluye `/v1/` y `/r/`) + `sitemap.xml` + JSON-LD `WebApplication`.
- Sitio verificado en **Google Search Console** (archivo `public/google*.html` — debe
  permanecer en el repo) con sitemap enviado; primer crawl de Googlebot confirmado 2026-07-02.

---

## Roadmap

- [x] Módulo **QR** (`POST /v1/qr`) integrado con Links
- [x] Toolbox: **mock data** (seed/locale), **UUID**, **slugify**, **validación de tarjetas**
- [x] Toolbox+: **conversiones** (monedas/unidades) y **generador de contraseñas**
- [x] **Landing + playground** en `/` (key temporal, demo en vivo de todo el toolbox)
- [x] **Tests e2e** (Jest + supertest) y **CI** (GitHub Actions: lint · build · e2e con Postgres)
- [x] **Deploy** en producción → https://api.koliscode.com (DigitalOcean · PM2 · nginx · HTTPS)
- [x] **Landing amigable** para público no-dev + Tailwind v4 compilado (sin CDN)
- [x] **Anti-abuso** en creación de keys (5/hora por IP) + healthcheck con auto-reinicio
- [x] **SEO**: OG/Twitter cards, robots, sitemap, JSON-LD, Search Console + indexación

### Ideas futuras
- [ ] Páginas dedicadas por herramienta (`/acortar-enlaces`, `/generar-qr`…) para SEO orgánico
- [ ] Dominio propio (p. ej. `koliskit.com`) para marca
- [ ] Dashboard del usuario (sus enlaces + stats) sobre la misma API key
