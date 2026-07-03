import request from 'supertest';
import { createApiKey, createTestApp, TestContext } from './utils';

describe('Toolbox — Base64 / JWT decode (e2e)', () => {
  let ctx: TestContext;
  let key: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    ctx = await createTestApp();
    const k = await createApiKey(ctx.http(), 'e2e-tools-encode');
    key = k.key;
    createdIds.push(k.id);
  });

  afterAll(async () => {
    await ctx.prisma.apiKey.deleteMany({ where: { id: { in: createdIds } } });
    await ctx.app.close();
  });

  const auth = (r: request.Test) => r.set('Authorization', `Bearer ${key}`);

  // Generado con:
  //   header = { alg: 'HS256', typ: 'JWT' }
  //   payload = { sub: '1234567890', name: 'Jhon Doe',
  //               iat: 1700000000, exp: 1700003600 }
  const expiredToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ikpob24gRG9lIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwMDM2MDB9.' +
    'sig-not-verified';

  it('codifica un texto en base64 con API key válida', async () => {
    const res = await auth(
      request(ctx.http())
        .post('/v1/tools/base64')
        .send({ text: 'Hola mundo', action: 'encode' }),
    ).expect(201);

    expect(res.body.result).toBe('SG9sYSBtdW5kbw==');
    expect(res.body.input).toEqual({
      length: 10,
      action: 'encode',
      urlSafe: false,
    });
  });

  it('decodifica un base64 estándar', async () => {
    const res = await auth(
      request(ctx.http())
        .post('/v1/tools/base64')
        .send({ text: 'SG9sYSBtdW5kbw==', action: 'decode' }),
    ).expect(201);

    expect(res.body.result).toBe('Hola mundo');
  });

  it('decodifica correctamente un JWT con claims esperados', async () => {
    const res = await auth(
      request(ctx.http())
        .post('/v1/tools/jwt/decode')
        .send({ token: expiredToken }),
    ).expect(201);

    expect(res.body.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(res.body.payload).toEqual({
      sub: '1234567890',
      name: 'Jhon Doe',
      iat: 1700000000,
      exp: 1700003600,
    });
    expect(res.body.signatureB64).toBe('sig-not-verified');
    expect(res.body.isExpired).toBe(true);
    expect(res.body.expiresAt).toBe('2023-11-14T23:13:20.000Z');
    expect(res.body.issuedAt).toBe('2023-11-14T22:13:20.000Z');
  });

  it('rechaza /base64 sin API key con 401 problem+json', async () => {
    const res = await request(ctx.http())
      .post('/v1/tools/base64')
      .send({ text: 'hola', action: 'encode' })
      .expect(401);

    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.status).toBe(401);
  });

  it('rechaza /base64 con `action` inválida con 400', async () => {
    const res = await auth(
      request(ctx.http())
        .post('/v1/tools/base64')
        .send({ text: 'hola', action: 'rot13' }),
    ).expect(400);

    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.status).toBe(400);
  });

  it('rechaza /jwt/decode con un token malformado con 400', async () => {
    const res = await auth(
      request(ctx.http())
        .post('/v1/tools/jwt/decode')
        .send({ token: 'solo.dospartes' }),
    ).expect(400);

    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.status).toBe(400);
  });
});
