import request from 'supertest';
import { createApiKey, createTestApp, TestContext } from './utils';

describe('Toolbox + Conversiones (e2e)', () => {
  let ctx: TestContext;
  let key: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    ctx = await createTestApp();
    const k = await createApiKey(ctx.http(), 'e2e-tools');
    key = k.key;
    createdIds.push(k.id);
  });

  afterAll(async () => {
    await ctx.prisma.apiKey.deleteMany({ where: { id: { in: createdIds } } });
    await ctx.app.close();
  });

  const auth = (r: request.Test) => r.set('Authorization', `Bearer ${key}`);

  it('genera contraseñas con la longitud, cantidad y fuerza esperadas', async () => {
    const res = await auth(
      request(ctx.http()).get('/v1/tools/password?length=20&count=2'),
    ).expect(200);

    expect(res.body.passwords).toHaveLength(2);
    expect(res.body.passwords[0]).toHaveLength(20);
    expect(res.body.strength).toBe('very-strong');
    expect(res.body.entropyBits).toBeGreaterThan(80);
  });

  it('rechaza generar contraseña sin ningún conjunto de caracteres', async () => {
    await auth(
      request(ctx.http()).get(
        '/v1/tools/password?uppercase=false&lowercase=false&numbers=false&symbols=false',
      ),
    ).expect(400);
  });

  it('convierte unidades de longitud (100 km → mi)', async () => {
    const res = await auth(
      request(ctx.http()).get('/v1/convert/units?value=100&from=km&to=mi'),
    ).expect(200);

    expect(res.body.category).toBe('length');
    expect(res.body.result).toBeCloseTo(62.1371, 3);
  });

  it('convierte temperatura (0 C → 32 F)', async () => {
    const res = await auth(
      request(ctx.http()).get('/v1/convert/units?value=0&from=C&to=F'),
    ).expect(200);
    expect(res.body.result).toBe(32);
  });

  it('rechaza convertir entre categorías distintas (km → kg)', async () => {
    await auth(
      request(ctx.http()).get('/v1/convert/units?value=5&from=km&to=kg'),
    ).expect(400);
  });

  it('valida el código de moneda antes de llamar al proveedor externo', async () => {
    await auth(
      request(ctx.http()).get('/v1/convert/currency?amount=10&from=US&to=EUR'),
    ).expect(400);
  });

  it('genera UUIDs v4', async () => {
    const res = await auth(
      request(ctx.http()).get('/v1/tools/uuid?count=3'),
    ).expect(200);

    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('slugify quita acentos y normaliza', async () => {
    const res = await auth(
      request(ctx.http())
        .post('/v1/tools/slugify')
        .send({ text: '¡Hola Mundo del Ñandú!' }),
    ).expect(201);
    expect(res.body.slug).toBe('hola-mundo-del-nandu');
  });

  it('valida una tarjeta con Luhn y detecta la marca', async () => {
    const res = await auth(
      request(ctx.http())
        .post('/v1/validate/credit-card')
        .send({ number: '4242 4242 4242 4242' }),
    ).expect(201);
    expect(res.body.valid).toBe(true);
    expect(res.body.brand).toBe('visa');
  });
});
