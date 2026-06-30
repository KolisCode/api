# KolisKit API

Toolbox de utilidades para desarrolladores, construido como API de muestra para portafolio.
Módulo estrella: **enlaces cortos con analytics**. Pensado para ampliarse con QR, generación de
datos de prueba, validadores y más.

**Stack:** NestJS 11 · Prisma 7 (driver adapter `pg`) · PostgreSQL 17 · OpenAPI + [Scalar](https://scalar.com).

---

## Características

- 🔑 **API keys + planes** (`FREE` / `PRO`) con **rate limiting diferenciado** por plan.
- 🔗 **Enlaces cortos** con código personalizado o autogenerado y expiración opcional.
- 📊 **Analytics de clics**: total, desglose por dispositivo / navegador / país, top referrers y timeline diaria (IP anonimizada con HMAC).
- 🔳 **Generador de QR** (PNG/SVG, tamaño y colores configurables), con QR directo de cada enlace.
- 🧰 **Toolbox**: datos fake reproducibles (seed/locale), UUID v4, slugify, validación de tarjetas (Luhn + marca) y generador de contraseñas (crypto + entropía).
- 🔄 **Conversiones**: unidades (longitud, masa, volumen, área, velocidad, tiempo, datos, temperatura) y monedas con tasas en vivo (~160 divisas, cacheadas).
- 🎮 **Landing + playground** en `/`: genera una API key temporal y prueba todos los módulos en vivo desde el navegador.
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

**Rate limits:** `FREE` 30 req/min · `PRO` 120 req/min · anónimo 60 req/min (por IP).

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
public/          landing + playground (index.html autocontenido, servido en /)
```

---

## Deploy

Build de producción:

```bash
npm run build
npm run prisma:deploy   # migraciones en el entorno destino
npm run start:prod
```

Variables requeridas: `DATABASE_URL`, `IP_HASH_SECRET`, `PUBLIC_BASE_URL`, `PORT`, `NODE_ENV=production`.
También incluye `Dockerfile` multi-stage para contenedor.

---

## Roadmap

- [x] Módulo **QR** (`POST /v1/qr`) integrado con Links
- [x] Toolbox: **mock data** (seed/locale), **UUID**, **slugify**, **validación de tarjetas**
- [x] Toolbox+: **conversiones** (monedas/unidades) y **generador de contraseñas**
- [x] **Landing + playground** en `/` (key temporal, demo en vivo de todo el toolbox)
- [ ] Tests e2e y CI
