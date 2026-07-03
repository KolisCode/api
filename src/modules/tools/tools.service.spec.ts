import { BadRequestException } from '@nestjs/common';
import { ToolsService } from './tools.service';

/** Conjuntos reales usados por el service (ver tools.service.ts, CHARSET). */
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?';
const hasCharFrom = (value: string, set: string): boolean =>
  [...value].some((c) => set.includes(c));

describe('ToolsService', () => {
  let service: ToolsService;

  beforeEach(() => {
    service = new ToolsService();
  });

  describe('slugify', () => {
    it('quita acentos y eñes, normalizando a minúsculas', () => {
      expect(service.slugify('Café con Ñandú y Niños')).toBe(
        'cafe-con-nandu-y-ninos',
      );
    });

    it('colapsa espacios múltiples y separadores repetidos en uno solo', () => {
      expect(service.slugify('  Hola   Mundo!!  ')).toBe('hola-mundo');
      expect(service.slugify('Multiple---dashes and_underscores')).toBe(
        'multiple-dashes-and-underscores',
      );
    });

    it('deja intacto un string que ya es un slug válido', () => {
      expect(service.slugify('already-slug')).toBe('already-slug');
    });

    it('respeta un separador custom', () => {
      expect(service.slugify('Hola Mundo', '_')).toBe('hola_mundo');
    });
  });

  describe('validateCreditCard', () => {
    it('valida un Visa de test (prefijo 4) y detecta la marca', () => {
      const result = service.validateCreditCard('4111111111111111');
      expect(result.valid).toBe(true);
      expect(result.brand).toBe('visa');
      expect(result.normalized).toBe('4111111111111111');
    });

    it('valida un Mastercard de test (rango 51-55) y detecta la marca', () => {
      const result = service.validateCreditCard('5500005555555559');
      expect(result.valid).toBe(true);
      expect(result.brand).toBe('mastercard');
    });

    it('valida un Amex de test (prefijo 34/37) y detecta la marca', () => {
      const result = service.validateCreditCard('378282246310005');
      expect(result.valid).toBe(true);
      expect(result.brand).toBe('amex');
    });

    it('valida un Discover de test (prefijo 6011/65/644-649) y detecta la marca', () => {
      const result = service.validateCreditCard('6011111111111117');
      expect(result.valid).toBe(true);
      expect(result.brand).toBe('discover');
    });

    it('valida un Diners de test (prefijo 30x/36/38) y detecta la marca', () => {
      const result = service.validateCreditCard('30569309025904');
      expect(result.valid).toBe(true);
      expect(result.brand).toBe('diners');
    });

    it('valida un JCB de test (prefijo 35) y detecta la marca', () => {
      const result = service.validateCreditCard('3530111333300000');
      expect(result.valid).toBe(true);
      expect(result.brand).toBe('jcb');
    });

    it('rechaza un número con dígito de control inválido (falla Luhn)', () => {
      const result = service.validateCreditCard('4111111111111112');
      expect(result.valid).toBe(false);
      expect(result.brand).toBeNull();
    });

    it('normaliza espacios y guiones antes de validar', () => {
      const result = service.validateCreditCard('4111 1111-1111 1111');
      expect(result.normalized).toBe('4111111111111111');
      expect(result.valid).toBe(true);
    });

    it('rechaza entradas no numéricas o fuera de rango (12-19 dígitos)', () => {
      expect(service.validateCreditCard('abc123').valid).toBe(false);
      expect(service.validateCreditCard('4111').valid).toBe(false); // < 12 dígitos
      expect(service.validateCreditCard('4111').brand).toBeNull();
    });

    it('conserva el input original sin normalizar en la respuesta', () => {
      const result = service.validateCreditCard('4111 1111 1111 1111');
      expect(result.input).toBe('4111 1111 1111 1111');
    });
  });

  describe('generatePassword', () => {
    it('genera contraseñas con la longitud pedida', () => {
      const result = service.generatePassword({
        length: 20,
        count: 3,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        excludeSimilar: false,
      });
      expect(result.passwords).toHaveLength(3);
      for (const pwd of result.passwords) expect(pwd).toHaveLength(20);
      expect(result.length).toBe(20);
    });

    it('respeta el count solicitado', () => {
      const result = service.generatePassword({
        length: 12,
        count: 5,
        uppercase: true,
        lowercase: true,
        numbers: false,
        symbols: false,
        excludeSimilar: false,
      });
      expect(result.passwords).toHaveLength(5);
    });

    it('garantiza al menos un carácter de cada conjunto habilitado (numbers+symbols)', () => {
      const result = service.generatePassword({
        length: 10,
        count: 10,
        uppercase: false,
        lowercase: false,
        numbers: true,
        symbols: true,
        excludeSimilar: false,
      });
      for (const pwd of result.passwords) {
        expect(hasCharFrom(pwd, NUMBERS)).toBe(true);
        expect(hasCharFrom(pwd, SYMBOLS)).toBe(true);
      }
    });

    it('excludeSimilar reduce el poolSize y evita caracteres confundibles', () => {
      const result = service.generatePassword({
        length: 20,
        count: 10,
        uppercase: false,
        lowercase: true,
        numbers: false,
        symbols: false,
        excludeSimilar: true,
      });
      // 'abcdefghijklmnopqrstuvwxyz' (26) menos i, l, o => 23.
      expect(result.poolSize).toBe(23);
      for (const pwd of result.passwords) {
        expect(pwd).not.toMatch(/[il1LoO0]/);
      }
    });

    it('lanza BadRequestException si no se selecciona ningún conjunto de caracteres', () => {
      expect(() =>
        service.generatePassword({
          length: 10,
          count: 1,
          uppercase: false,
          lowercase: false,
          numbers: false,
          symbols: false,
          excludeSimilar: false,
        }),
      ).toThrow(BadRequestException);
    });

    it('lanza BadRequestException si la longitud es menor que la cantidad de conjuntos seleccionados', () => {
      expect(() =>
        service.generatePassword({
          length: 2,
          count: 1,
          uppercase: true,
          lowercase: true,
          numbers: true,
          symbols: true,
          excludeSimilar: false,
        }),
      ).toThrow(BadRequestException);
    });

    it('clasifica la entropía como weak (<40 bits)', () => {
      // 8 caracteres, solo minúsculas (pool 26) => 8*log2(26) = 37.6 bits.
      const result = service.generatePassword({
        length: 8,
        count: 1,
        uppercase: false,
        lowercase: true,
        numbers: false,
        symbols: false,
        excludeSimilar: false,
      });
      expect(result.entropyBits).toBeCloseTo(37.6, 1);
      expect(result.strength).toBe('weak');
    });

    it('clasifica la entropía como fair (40-59 bits)', () => {
      // 10 caracteres, minúsculas+mayúsculas (pool 52) => 10*log2(52) = 57 bits.
      const result = service.generatePassword({
        length: 10,
        count: 1,
        uppercase: true,
        lowercase: true,
        numbers: false,
        symbols: false,
        excludeSimilar: false,
      });
      expect(result.entropyBits).toBeCloseTo(57, 1);
      expect(result.strength).toBe('fair');
    });

    it('clasifica la entropía como strong (60-79 bits)', () => {
      // 12 caracteres, minúsculas+mayúsculas (pool 52) => 12*log2(52) = 68.41 bits.
      const result = service.generatePassword({
        length: 12,
        count: 1,
        uppercase: true,
        lowercase: true,
        numbers: false,
        symbols: false,
        excludeSimilar: false,
      });
      expect(result.entropyBits).toBeCloseTo(68.41, 1);
      expect(result.strength).toBe('strong');
    });

    it('clasifica la entropía como very-strong (>=80 bits)', () => {
      // 16 caracteres, los 4 conjuntos (pool 85) => 16*log2(85) = 102.55 bits.
      const result = service.generatePassword({
        length: 16,
        count: 1,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        excludeSimilar: false,
      });
      expect(result.entropyBits).toBeCloseTo(102.55, 1);
      expect(result.strength).toBe('very-strong');
      expect(result.poolSize).toBe(85);
    });
  });

  describe('uuids', () => {
    it('genera la cantidad pedida de UUID v4 con formato válido', () => {
      const result = service.uuids(15);
      expect(result).toHaveLength(15);
      const uuidV4 =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      for (const id of result) expect(id).toMatch(uuidV4);
    });

    it('genera valores únicos entre sí', () => {
      const result = service.uuids(20);
      expect(new Set(result).size).toBe(20);
    });

    it('devuelve un array vacío si count es 0', () => {
      expect(service.uuids(0)).toEqual([]);
    });
  });
});
