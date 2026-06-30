import request from 'supertest';
import { createTestApp, TestContext } from './utils';

describe('App (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /health responde estado ok', async () => {
    const res = await request(ctx.http()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('una ruta inexistente devuelve RFC 7807 (application/problem+json)', async () => {
    const res = await request(ctx.http()).get('/v1/no-existe').expect(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toMatchObject({
      type: 'about:blank',
      status: 404,
      instance: '/v1/no-existe',
    });
  });
});
