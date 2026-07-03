import request from 'supertest';
import { createApiKey, createTestApp, TestContext } from './utils';

describe('Toolbox — Hash / HMAC (e2e)', () => {
  let ctx: TestContext;
  let key: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    ctx = await createTestApp();
    const k = await createApiKey(ctx.http(), 'e2e-tools-hash');
    key = k.key;
    createdIds.push(k.id);
  });

  afterAll(async () => {
    await ctx.prisma.apiKey.deleteMany({ where: { id: { in: createdIds } } });
    await ctx.app.close();
  });

  const auth = (r: request.Test) => r.set('Authorization', `Bearer ${key}`);

  it('genera los 4 digests por defecto en hex con API key válida', async () => {
    const res = await auth(
      request(ctx.http()).post('/v1/tools/hash').send({ text: 'hola' }),
    ).expect(201);

    expect(res.body.input).toEqual({
      length: 4,
      encoding: 'hex',
      hmac: false,
    });
    expect(res.body.digests.md5).toBe('4d186321c1a7f0f354b297e8914ab240');
    expect(res.body.digests.sha1).toBe(
      '99800b85d3383e3a2fb45eb7d0066a4879a9dad0',
    );
    expect(res.body.digests.sha256).toBe(
      'b221d9dbb083a7f33428d7c2a3c3198ae925614d70210e28716ccaa7cd4ddb79',
    );
    expect(res.body.digests.sha512).toBe(
      'e83e8535d6f689493e5819bd60aa3e5fdcba940e6d111ab6fb5c34f24f86496' +
        'bf3726e2bf4ec59d6d2f5a2aeb1e4f103283e7d64e4f49c03b4c4725cb361e773',
    );
  });

  it('filtra los digests devueltos según `algorithms`', async () => {
    const res = await auth(
      request(ctx.http())
        .post('/v1/tools/hash')
        .send({ text: 'hola', algorithms: ['sha256'] }),
    ).expect(201);

    expect(Object.keys(res.body.digests)).toEqual(['sha256']);
    expect(res.body.digests.sha256).toBe(
      'b221d9dbb083a7f33428d7c2a3c3198ae925614d70210e28716ccaa7cd4ddb79',
    );
  });

  it('codifica en base64 cuando se pide `encoding: base64`', async () => {
    const res = await auth(
      request(ctx.http())
        .post('/v1/tools/hash')
        .send({
          text: 'hola',
          algorithms: ['sha256'],
          encoding: 'base64',
        }),
    ).expect(201);

    expect(res.body.digests.sha256).toBe(
      'siHZ27CDp/M0KNfCo8MZiuklYU1wIQ4ocWzKp81N23k=',
    );
    expect(res.body.input.encoding).toBe('base64');
  });

  it('calcula HMAC cuando se envía `hmacKey` y lo marca en `input.hmac`', async () => {
    const res = await auth(
      request(ctx.http())
        .post('/v1/tools/hash')
        .send({
          text: 'hola',
          algorithms: ['sha256'],
          hmacKey: 'secret',
        }),
    ).expect(201);

    expect(res.body.input.hmac).toBe(true);
    expect(res.body.digests.sha256).toBe(
      '3d02d25ab1d4334423c33425dd5b35012b45e8921a38e33fc894ce28a39bfab6',
    );
  });

  it('rechaza sin API key con 401 problem+json', async () => {
    const res = await request(ctx.http())
      .post('/v1/tools/hash')
      .send({ text: 'hola' })
      .expect(401);

    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.status).toBe(401);
  });

  it('rechaza body sin `text` con 400', async () => {
    const res = await auth(
      request(ctx.http()).post('/v1/tools/hash').send({}),
    ).expect(400);

    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.status).toBe(400);
  });

  it('rechaza un algoritmo desconocido con 400', async () => {
    await auth(
      request(ctx.http())
        .post('/v1/tools/hash')
        .send({ text: 'hola', algorithms: ['crc32'] }),
    ).expect(400);
  });
});
