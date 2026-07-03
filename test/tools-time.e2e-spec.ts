import request from 'supertest';
import { createApiKey, createTestApp, TestContext } from './utils';

describe('Toolbox — Timestamp / Timezone (e2e)', () => {
  let ctx: TestContext;
  let key: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    ctx = await createTestApp();
    const k = await createApiKey(ctx.http(), 'e2e-tools-time');
    key = k.key;
    createdIds.push(k.id);
  });

  afterAll(async () => {
    await ctx.prisma.apiKey.deleteMany({ where: { id: { in: createdIds } } });
    await ctx.app.close();
  });

  const auth = (r: request.Test) => r.set('Authorization', `Bearer ${key}`);

  it('convierte un epoch en segundos con API key válida', async () => {
    const res = await auth(
      request(ctx.http()).get('/v1/tools/timestamp').query({
        value: '1700003600',
      }),
    ).expect(200);

    expect(res.body.epochSeconds).toBe(1700003600);
    expect(res.body.epochMs).toBe(1700003600000);
    expect(res.body.iso).toBe('2023-11-14T23:13:20.000Z');
    expect(res.body.utc).toBe('Tue, 14 Nov 2023 23:13:20 GMT');
    expect(res.body.dayOfWeek).toBe('Tuesday');
    expect(res.body.local).toBeNull();
    expect(typeof res.body.relative).toBe('string');
  });

  it('formatea `local` en la tz pedida (America/Bogota, UTC-5 sin DST)', async () => {
    const res = await auth(
      request(ctx.http()).get('/v1/tools/timestamp').query({
        value: '1700003600',
        tz: 'America/Bogota',
      }),
    ).expect(200);

    expect(res.body.local).toBe('2023-11-14 18:13:20 GMT-05:00');
  });

  it('interpreta un epoch de 13 dígitos como milisegundos', async () => {
    const res = await auth(
      request(ctx.http()).get('/v1/tools/timestamp').query({
        value: '1700003600000',
      }),
    ).expect(200);

    expect(res.body.iso).toBe('2023-11-14T23:13:20.000Z');
  });

  it('resuelve el literal "now"', async () => {
    const before = Date.now();
    const res = await auth(
      request(ctx.http()).get('/v1/tools/timestamp').query({ value: 'now' }),
    ).expect(200);
    const after = Date.now();

    expect(res.body.epochMs).toBeGreaterThanOrEqual(before);
    expect(res.body.epochMs).toBeLessThanOrEqual(after);
  });

  it('lista timezones IANA soportadas, incluyendo America/Bogota', async () => {
    const res = await auth(
      request(ctx.http()).get('/v1/tools/timestamp/timezones'),
    ).expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data).toContain('America/Bogota');
  });

  it('rechaza sin API key con 401 problem+json', async () => {
    const res = await request(ctx.http())
      .get('/v1/tools/timestamp')
      .query({ value: '1700003600' })
      .expect(401);

    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.status).toBe(401);
  });

  it('rechaza un `value` inválido con 400', async () => {
    const res = await auth(
      request(ctx.http())
        .get('/v1/tools/timestamp')
        .query({ value: 'no-es-una-fecha' }),
    ).expect(400);

    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.status).toBe(400);
  });

  it('rechaza una `tz` inválida con 400', async () => {
    const res = await auth(
      request(ctx.http()).get('/v1/tools/timestamp').query({
        value: '1700003600',
        tz: 'Fake/Zone',
      }),
    ).expect(400);

    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.status).toBe(400);
  });
});
