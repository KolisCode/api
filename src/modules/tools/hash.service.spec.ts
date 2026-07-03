import { CreateHashDto } from './dto/hash.dto';
import { HashService } from './hash.service';

/**
 * Digests de referencia verificados con:
 *   node -e "console.log(require('node:crypto').createHash('sha256')
 *     .update('hola','utf8').digest('hex'))"
 * (y análogo para md5/sha1/sha512, base64 y HMAC).
 */
describe('HashService', () => {
  let service: HashService;

  beforeEach(() => {
    service = new HashService();
  });

  it('calcula los 4 algoritmos por defecto en hex si no se pide `algorithms`', () => {
    // Simula el body real que llega sin `algorithms` (el default lo pone la
    // instancia de la clase; aquí se ejercita el fallback en runtime).
    const result = service.generate({
      text: 'hola',
      encoding: 'hex',
    } as CreateHashDto);

    expect(result.digests.md5).toBe('4d186321c1a7f0f354b297e8914ab240');
    expect(result.digests.sha1).toBe(
      '99800b85d3383e3a2fb45eb7d0066a4879a9dad0',
    );
    expect(result.digests.sha256).toBe(
      'b221d9dbb083a7f33428d7c2a3c3198ae925614d70210e28716ccaa7cd4ddb79',
    );
    expect(result.digests.sha512).toBe(
      'e83e8535d6f689493e5819bd60aa3e5fdcba940e6d111ab6fb5c34f24f86496' +
        'bf3726e2bf4ec59d6d2f5a2aeb1e4f103283e7d64e4f49c03b4c4725cb361e773',
    );
  });

  it('reporta length, encoding y hmac=false en `input`', () => {
    const result = service.generate({
      text: 'hola',
      algorithms: ['sha256'],
      encoding: 'hex',
    });

    expect(result.input).toEqual({ length: 4, encoding: 'hex', hmac: false });
  });

  it('filtra los digests devueltos según `algorithms`', () => {
    const result = service.generate({
      text: 'hola',
      algorithms: ['sha256'],
      encoding: 'hex',
    });

    expect(Object.keys(result.digests)).toEqual(['sha256']);
    expect(result.digests.md5).toBeUndefined();
    expect(result.digests.sha1).toBeUndefined();
    expect(result.digests.sha512).toBeUndefined();
  });

  it('codifica en base64 cuando se pide `encoding: base64`', () => {
    const result = service.generate({
      text: 'hola',
      algorithms: ['sha256'],
      encoding: 'base64',
    });

    expect(result.digests.sha256).toBe(
      'siHZ27CDp/M0KNfCo8MZiuklYU1wIQ4ocWzKp81N23k=',
    );
    expect(result.input.encoding).toBe('base64');
  });

  it('calcula HMAC en vez de hash plano cuando se pasa `hmacKey`', () => {
    const result = service.generate({
      text: 'hola',
      algorithms: ['sha256'],
      encoding: 'hex',
      hmacKey: 'secret',
    });

    expect(result.digests.sha256).toBe(
      '3d02d25ab1d4334423c33425dd5b35012b45e8921a38e33fc894ce28a39bfab6',
    );
    expect(result.input.hmac).toBe(true);
  });

  it('el HMAC de un mismo texto difiere entre hash plano y hash con clave', () => {
    const plain = service.generate({
      text: 'hola',
      algorithms: ['md5'],
      encoding: 'hex',
    });
    const hmac = service.generate({
      text: 'hola',
      algorithms: ['md5'],
      encoding: 'hex',
      hmacKey: 'secret',
    });

    expect(hmac.digests.md5).not.toBe(plain.digests.md5);
    expect(hmac.input.hmac).toBe(true);
    expect(plain.input.hmac).toBe(false);
  });

  it('trata MD5 igual que los demás algoritmos (sin marcado especial)', () => {
    const result = service.generate({
      text: 'hola',
      algorithms: ['md5'],
      encoding: 'hex',
    });

    expect(Object.keys(result.digests)).toEqual(['md5']);
    expect(result.digests.md5).toHaveLength(32);
  });

  it('produce digests distintos para textos distintos', () => {
    const a = service.generate({
      text: 'hola',
      algorithms: ['sha256'],
      encoding: 'hex',
    });
    const b = service.generate({
      text: 'adios',
      algorithms: ['sha256'],
      encoding: 'hex',
    });

    expect(a.digests.sha256).not.toBe(b.digests.sha256);
  });
});
