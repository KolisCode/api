import { BadRequestException } from '@nestjs/common';
import { ConvertService } from './convert.service';

/**
 * Unit tests de conversión de unidades (convertUnits). La conversión de
 * divisas (convertCurrency) llama a un proveedor externo y queda fuera de
 * esta batería a propósito.
 */
describe('ConvertService', () => {
  let service: ConvertService;

  beforeEach(() => {
    service = new ConvertService();
  });

  describe('convertUnits — categorías lineales', () => {
    it('length: 1 mi = 1.609344 km', () => {
      const r = service.convertUnits(1, 'mi', 'km');
      expect(r).toEqual({
        value: 1,
        from: 'mi',
        to: 'km',
        category: 'length',
        result: 1.609344,
      });
    });

    it('length: 12 in = 30.48 cm', () => {
      expect(service.convertUnits(12, 'in', 'cm').result).toBe(30.48);
    });

    it('mass: 1 lb = 453.59237 g', () => {
      const r = service.convertUnits(1, 'lb', 'g');
      expect(r.category).toBe('mass');
      expect(r.result).toBe(453.59237);
    });

    it('mass: 2 kg = 4.4092452437 lb (redondeado a 12 dígitos significativos)', () => {
      expect(service.convertUnits(2, 'kg', 'lb').result).toBe(4.4092452437);
    });

    it('volume: 1 gal = 3.785411784 l', () => {
      const r = service.convertUnits(1, 'gal', 'l');
      expect(r.category).toBe('volume');
      expect(r.result).toBe(3.785411784);
    });

    it('area: 1 acre = 4046.8564224 m2', () => {
      const r = service.convertUnits(1, 'acre', 'm2');
      expect(r.category).toBe('area');
      expect(r.result).toBe(4046.8564224);
    });

    it('speed: 100 km/h = 27.7777777778 m/s (redondeado a 12 dígitos)', () => {
      const r = service.convertUnits(100, 'km/h', 'm/s');
      expect(r.category).toBe('speed');
      expect(r.result).toBe(27.7777777778);
    });

    it('speed: 60 mph = 96.56064 km/h', () => {
      expect(service.convertUnits(60, 'mph', 'km/h').result).toBe(96.56064);
    });

    it('time: 2 h = 120 min y 1 wk = 7 d', () => {
      const r = service.convertUnits(2, 'h', 'min');
      expect(r.category).toBe('time');
      expect(r.result).toBe(120);
      expect(service.convertUnits(1, 'wk', 'd').result).toBe(7);
    });

    it('data: 1 GB = 1024 MB (base binaria) y 8 bit = 1 B', () => {
      const r = service.convertUnits(1, 'GB', 'MB');
      expect(r.category).toBe('data');
      expect(r.result).toBe(1024);
      expect(service.convertUnits(8, 'bit', 'B').result).toBe(1);
    });
  });

  describe('convertUnits — temperatura (no lineal, ida y vuelta)', () => {
    it('C → F: 100 °C = 212 °F', () => {
      const r = service.convertUnits(100, 'C', 'F');
      expect(r.category).toBe('temperature');
      expect(r.result).toBe(212);
    });

    it('F → C: 212 °F = 100 °C (vuelta)', () => {
      expect(service.convertUnits(212, 'F', 'C').result).toBe(100);
    });

    it('C → K: 0 °C = 273.15 K y vuelta K → C: 273.15 K = 0 °C', () => {
      expect(service.convertUnits(0, 'C', 'K').result).toBe(273.15);
      expect(service.convertUnits(273.15, 'K', 'C').result).toBe(0);
    });

    it('F → K: 32 °F = 273.15 K y vuelta K → F: 273.15 K = 32 °F', () => {
      expect(service.convertUnits(32, 'F', 'K').result).toBe(273.15);
      expect(service.convertUnits(273.15, 'K', 'F').result).toBe(32);
    });

    it('punto donde ambas escalas coinciden: -40 °C = -40 °F', () => {
      expect(service.convertUnits(-40, 'C', 'F').result).toBe(-40);
    });

    it('acepta unidades de temperatura en minúscula y las normaliza a mayúscula', () => {
      const r = service.convertUnits(100, 'c', 'f');
      expect(r.from).toBe('C');
      expect(r.to).toBe('F');
      expect(r.result).toBe(212);
    });
  });

  describe('convertUnits — identidad', () => {
    it('misma unidad de origen y destino devuelve el mismo valor', () => {
      expect(service.convertUnits(5, 'kg', 'kg').result).toBe(5);
      expect(service.convertUnits(37, 'C', 'C').result).toBe(37);
      expect(service.convertUnits(1024, 'MB', 'MB').result).toBe(1024);
    });
  });

  describe('convertUnits — entradas inválidas', () => {
    it('lanza BadRequestException si la unidad no existe', () => {
      expect(() => service.convertUnits(1, 'parsec', 'km')).toThrow(
        BadRequestException,
      );
    });

    it('lanza BadRequestException si las unidades son de categorías distintas', () => {
      expect(() => service.convertUnits(1, 'kg', 'm')).toThrow(
        BadRequestException,
      );
    });

    it('lanza BadRequestException al mezclar temperatura con otra categoría', () => {
      expect(() => service.convertUnits(1, 'C', 'm')).toThrow(
        BadRequestException,
      );
      expect(() => service.convertUnits(1, 'km', 'K')).toThrow(
        BadRequestException,
      );
    });

    it('las unidades no-temperatura son case-sensitive (KM no existe)', () => {
      expect(() => service.convertUnits(1, 'KM', 'm')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('convertUnits — normalización de entrada', () => {
    it('recorta espacios alrededor de las unidades', () => {
      const r = service.convertUnits(1, ' mi ', ' km ');
      expect(r.from).toBe('mi');
      expect(r.to).toBe('km');
      expect(r.result).toBe(1.609344);
    });
  });
});
