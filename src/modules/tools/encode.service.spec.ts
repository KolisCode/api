import { BadRequestException } from '@nestjs/common';
import { EncodeService } from './encode.service';

/**
 * Valores de referencia verificados con:
 *   node -e "console.log(Buffer.from('Hola mundo!! >>> ??','utf8')
 *     .toString('base64'))"
 * (y análogo para 'base64url').
 */
describe('EncodeService', () => {
  let service: EncodeService;

  beforeEach(() => {
    service = new EncodeService();
  });

  describe('base64', () => {
    it('codifica un texto conocido en base64 estándar', () => {
      const result = service.base64({
        text: 'Hola mundo',
        action: 'encode',
        urlSafe: false,
      });

      expect(result.result).toBe('SG9sYSBtdW5kbw==');
      expect(result.input).toEqual({
        length: 10,
        action: 'encode',
        urlSafe: false,
      });
    });

    it('decodifica un base64 estándar conocido', () => {
      const result = service.base64({
        text: 'SG9sYSBtdW5kbw==',
        action: 'decode',
        urlSafe: false,
      });

      expect(result.result).toBe('Hola mundo');
    });

    it('codifica en base64url cuando `urlSafe` es true (con caracteres +// convertidos)', () => {
      const text = 'Hola mundo!! >>> ??';
      const result = service.base64({
        text,
        action: 'encode',
        urlSafe: true,
      });

      // El equivalente estándar tiene '+' y '/' y padding '='.
      expect(Buffer.from(text, 'utf8').toString('base64')).toBe(
        'SG9sYSBtdW5kbyEhID4+PiA/Pw==',
      );
      expect(result.result).toBe('SG9sYSBtdW5kbyEhID4-PiA_Pw');
      expect(result.result).not.toContain('+');
      expect(result.result).not.toContain('/');
      expect(result.result).not.toContain('=');
    });

    it('decodifica base64url con "-" y "_" aunque `urlSafe` no se marque', () => {
      const result = service.base64({
        text: 'SG9sYSBtdW5kbyEhID4-PiA_Pw',
        action: 'decode',
        urlSafe: false,
      });

      expect(result.result).toBe('Hola mundo!! >>> ??');
    });

    it('decodifica base64 estándar con "+"/"/" aunque `urlSafe` esté en true', () => {
      const result = service.base64({
        text: 'SG9sYSBtdW5kbyEhID4+PiA/Pw==',
        action: 'decode',
        urlSafe: true,
      });

      expect(result.result).toBe('Hola mundo!! >>> ??');
    });

    it('lanza BadRequestException al decodificar basura no-base64', () => {
      expect(() =>
        service.base64({
          text: '!!!not-base64!!!',
          action: 'decode',
          urlSafe: false,
        }),
      ).toThrow(BadRequestException);
    });

    it('lanza BadRequestException con base64 de longitud/padding inválidos', () => {
      expect(() =>
        service.base64({
          text: 'invalid===',
          action: 'decode',
          urlSafe: false,
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('jwtDecode', () => {
    // Generado con:
    //   header = { alg: 'HS256', typ: 'JWT' }
    //   payload = { sub: '1234567890', name: 'Jhon Doe',
    //               iat: 1700000000, exp: 1700003600 }
    // (exp = 2023-11-14T23:13:20.000Z, ya pasado)
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ikpob24gRG9lIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwMDM2MDB9.' +
      'sig-not-verified';

    // Mismo header/sub/name/iat, sin `exp`.
    const noExpToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ikpob24gRG9lIiwiaWF0IjoxNzAwMDAwMDAwfQ.' +
      'sig-not-verified';

    it('decodifica header, payload, firma y marca isExpired=true si `exp` ya pasó', () => {
      const result = service.jwtDecode({
        token: expiredToken,
      });

      expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' });
      expect(result.payload).toEqual({
        sub: '1234567890',
        name: 'Jhon Doe',
        iat: 1700000000,
        exp: 1700003600,
      });
      expect(result.signatureB64).toBe('sig-not-verified');
      expect(result.isExpired).toBe(true);
      expect(result.expiresAt).toBe('2023-11-14T23:13:20.000Z');
      expect(result.issuedAt).toBe('2023-11-14T22:13:20.000Z');
    });

    it('devuelve isExpired=null y expiresAt=null cuando no hay `exp`', () => {
      const result = service.jwtDecode({ token: noExpToken });

      expect(result.payload).toEqual({
        sub: '1234567890',
        name: 'Jhon Doe',
        iat: 1700000000,
      });
      expect(result.isExpired).toBeNull();
      expect(result.expiresAt).toBeNull();
      expect(result.issuedAt).toBe('2023-11-14T22:13:20.000Z');
    });

    it('lanza BadRequestException si el token no tiene 3 partes', () => {
      expect(() =>
        service.jwtDecode({
          token: 'solo.dospartes',
        }),
      ).toThrow(BadRequestException);
    });

    it('lanza BadRequestException si un segmento no decodifica a JSON válido', () => {
      // "no-es-json" en base64url no produce JSON parseable.
      const badPayload = Buffer.from('no es json', 'utf8').toString(
        'base64url',
      );
      const header = Buffer.from(
        JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
        'utf8',
      ).toString('base64url');

      expect(() =>
        service.jwtDecode({
          token: `${header}.${badPayload}.sig`,
        }),
      ).toThrow(BadRequestException);
    });
  });
});
