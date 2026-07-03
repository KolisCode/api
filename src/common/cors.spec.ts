import { buildCorsOptions } from './cors';

type OriginFn = (
  origin: string | undefined,
  cb: (err: Error | null, allow?: boolean) => void,
) => void;

function decide(
  env: Record<string, string | undefined>,
  origin: string | undefined,
): boolean | undefined {
  const options = buildCorsOptions(env);
  let result: boolean | undefined;
  (options.origin as OriginFn)(origin, (err, allow) => {
    expect(err).toBeNull();
    result = allow;
  });
  return result;
}

describe('buildCorsOptions', () => {
  const prod = { NODE_ENV: 'production' };

  it('sin header Origin siempre permite (curl / server-to-server)', () => {
    expect(decide(prod, undefined)).toBe(true);
  });

  it('sin CORS_ORIGINS cae al default koliscode', () => {
    expect(decide(prod, 'https://koliscode.com')).toBe(true);
    expect(decide(prod, 'https://api.koliscode.com')).toBe(true);
    expect(decide(prod, 'https://evil.example.com')).toBe(false);
  });

  it('CORS_ORIGINS CSV con espacios define la allowlist exacta', () => {
    const env = { ...prod, CORS_ORIGINS: 'https://a.com, https://b.com' };
    expect(decide(env, 'https://a.com')).toBe(true);
    expect(decide(env, 'https://b.com')).toBe(true);
    expect(decide(env, 'https://koliscode.com')).toBe(false);
  });

  it('en production NO acepta localhost', () => {
    expect(decide(prod, 'http://localhost:5173')).toBe(false);
  });

  it('fuera de production acepta localhost y 127.0.0.1 en cualquier puerto', () => {
    const dev = { NODE_ENV: 'development' };
    expect(decide(dev, 'http://localhost:5173')).toBe(true);
    expect(decide(dev, 'http://127.0.0.1:3009')).toBe(true);
    expect(decide(dev, 'https://evil.example.com')).toBe(false);
  });

  it('no permite sufijos que solo empiecen por un origen listado', () => {
    expect(decide(prod, 'https://koliscode.com.evil.com')).toBe(false);
  });
});
