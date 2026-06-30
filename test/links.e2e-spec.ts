import request from 'supertest';
import { createApiKey, createTestApp, TestContext } from './utils';

describe('Links (e2e)', () => {
  let ctx: TestContext;
  let key: string;
  const createdIds: string[] = [];
  const code = () => 'e2e' + Math.random().toString(36).slice(2, 9);

  beforeAll(async () => {
    ctx = await createTestApp();
    const k = await createApiKey(ctx.http(), 'e2e-links');
    key = k.key;
    createdIds.push(k.id);
  });

  afterAll(async () => {
    await ctx.prisma.apiKey.deleteMany({ where: { id: { in: createdIds } } });
    await ctx.app.close();
  });

  const auth = (r: request.Test) => r.set('Authorization', `Bearer ${key}`);

  it('crea un enlace con código personalizado', async () => {
    const c = code();
    const res = await auth(request(ctx.http()).post('/v1/links'))
      .send({ targetUrl: 'https://nestjs.com/', code: c })
      .expect(201);

    expect(res.body.code).toBe(c);
    expect(res.body.shortUrl).toContain(`/r/${c}`);
    expect(res.body.clickCount).toBe(0);
  });

  it('rechaza una URL inválida con problem+json y lista de errores', async () => {
    const res = await auth(request(ctx.http()).post('/v1/links'))
      .send({ targetUrl: 'no-es-una-url' })
      .expect(400);

    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.detail).toBeDefined();
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('un código duplicado devuelve 409', async () => {
    const c = code();
    await auth(request(ctx.http()).post('/v1/links'))
      .send({ targetUrl: 'https://a.example/', code: c })
      .expect(201);
    await auth(request(ctx.http()).post('/v1/links'))
      .send({ targetUrl: 'https://b.example/', code: c })
      .expect(409);
  });

  it('el redirect registra el clic y stats lo refleja', async () => {
    const c = code();
    await auth(request(ctx.http()).post('/v1/links'))
      .send({ targetUrl: 'https://example.com/', code: c })
      .expect(201);

    await request(ctx.http())
      .get(`/r/${c}`)
      .expect(302)
      .expect('Location', 'https://example.com/');

    const res = await auth(
      request(ctx.http()).get(`/v1/links/${c}/stats`),
    ).expect(200);
    expect(res.body.totalClicks).toBeGreaterThanOrEqual(1);
  });

  it('listar enlaces requiere autenticación', async () => {
    await request(ctx.http()).get('/v1/links').expect(401);
  });
});
