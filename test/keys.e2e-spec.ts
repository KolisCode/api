import request from 'supertest';
import { createApiKey, createTestApp, TestContext } from './utils';

describe('API Keys (e2e)', () => {
  let ctx: TestContext;
  const createdIds: string[] = [];

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.prisma.apiKey.deleteMany({ where: { id: { in: createdIds } } });
    await ctx.app.close();
  });

  it('POST /v1/keys crea una key FREE y muestra la clave una sola vez', async () => {
    const res = await request(ctx.http())
      .post('/v1/keys')
      .send({ name: 'e2e-create' })
      .expect(201);
    createdIds.push(res.body.id);

    expect(res.body.plan).toBe('FREE');
    expect(res.body.key).toMatch(/^kk_live_/);
    expect(res.body).toHaveProperty('warning');
    // El hash nunca se expone.
    expect(res.body).not.toHaveProperty('hash');
  });

  it('GET /v1/keys/me sin auth → 401 problem+json', async () => {
    const res = await request(ctx.http()).get('/v1/keys/me').expect(401);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.status).toBe(401);
  });

  it('GET /v1/keys/me con key válida devuelve sus metadatos', async () => {
    const { id, key } = await createApiKey(ctx.http(), 'e2e-me');
    createdIds.push(id);

    const res = await request(ctx.http())
      .get('/v1/keys/me')
      .set('Authorization', `Bearer ${key}`)
      .expect(200);

    expect(res.body.id).toBe(id);
    expect(res.body).toHaveProperty('linkCount', 0);
  });

  it('rechaza una key inexistente', async () => {
    await request(ctx.http())
      .get('/v1/keys/me')
      .set('Authorization', 'Bearer kk_live_clave_que_no_existe')
      .expect(401);
  });
});
