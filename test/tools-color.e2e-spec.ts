import request from 'supertest';
import { createApiKey, createTestApp, TestContext } from './utils';

describe('Toolbox — Color (e2e)', () => {
  let ctx: TestContext;
  let key: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    ctx = await createTestApp();
    const k = await createApiKey(ctx.http(), 'e2e-tools-color');
    key = k.key;
    createdIds.push(k.id);
  });

  afterAll(async () => {
    await ctx.prisma.apiKey.deleteMany({ where: { id: { in: createdIds } } });
    await ctx.app.close();
  });

  const auth = (r: request.Test) => r.set('Authorization', `Bearer ${key}`);

  it('convierte el ámbar de marca #fbbf24 con la estructura completa', async () => {
    const res = await auth(
      request(ctx.http()).get('/v1/tools/color').query({ value: '#fbbf24' }),
    ).expect(200);

    expect(res.body.hex).toBe('#fbbf24');
    expect(res.body.rgb).toEqual({ r: 251, g: 191, b: 36 });
    expect(res.body.hsl).toEqual({ h: 43, s: 96, l: 56 });
    expect(res.body.luminance).toBe(0.579);
    expect(res.body.contrastVsWhite).toBe(1.67);
    expect(res.body.contrastVsBlack).toBe(12.58);
    expect(res.body.wcag).toEqual({
      aaNormalOnWhite: false,
      aaNormalOnBlack: true,
      aaaNormalOnWhite: false,
      aaaNormalOnBlack: true,
    });
  });

  it('acepta formatos equivalentes: #fff, rgb() y hsl() devuelven el mismo rgb', async () => {
    const values = [
      '#fff',
      '#ffffff',
      'rgb(255,255,255)',
      'rgb(255, 255, 255)',
      'hsl(0,0%,100%)',
      'hsl(0, 0%, 100%)',
    ];

    for (const value of values) {
      const res = await auth(
        request(ctx.http()).get('/v1/tools/color').query({ value }),
      ).expect(200);

      expect(res.body.rgb).toEqual({ r: 255, g: 255, b: 255 });
      expect(res.body.hex).toBe('#ffffff');
    }
  });

  it('rechaza sin API key con 401 problem+json', async () => {
    const res = await request(ctx.http())
      .get('/v1/tools/color')
      .query({ value: '#fbbf24' })
      .expect(401);

    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.status).toBe(401);
  });

  it('rechaza un `value` inválido con 400', async () => {
    const res = await auth(
      request(ctx.http())
        .get('/v1/tools/color')
        .query({ value: 'no-es-un-color' }),
    ).expect(400);

    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.status).toBe(400);
  });

  it('rechaza un componente rgb fuera de rango con 400', async () => {
    await auth(
      request(ctx.http())
        .get('/v1/tools/color')
        .query({ value: 'rgb(300,0,0)' }),
    ).expect(400);
  });

  it('rechaza un `value` vacío con 400', async () => {
    await auth(
      request(ctx.http()).get('/v1/tools/color').query({ value: '' }),
    ).expect(400);
  });
});
