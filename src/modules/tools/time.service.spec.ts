import { BadRequestException } from '@nestjs/common';
import { TimeService } from './time.service';

/**
 * Valores de referencia verificados con:
 *   node -e "console.log(new Date(1700003600*1000).toISOString())"
 * → 2023-11-14T23:13:20.000Z (mismo instante que el JWT de
 *   tools-encode.e2e-spec.ts, así que sirve de referencia cruzada).
 *
 * Offset local de Bogotá verificado con:
 *   node -e "console.log(new Intl.DateTimeFormat('en-CA',
 *     {timeZone:'America/Bogota', timeZoneName:'longOffset'})
 *     .formatToParts(new Date(1700003600*1000)))"
 * → GMT-05:00 (Bogotá no tiene DST, el offset es fijo).
 */
describe('TimeService', () => {
  let service: TimeService;

  beforeEach(() => {
    service = new TimeService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('interpreta un epoch de 10 dígitos como segundos', () => {
    const result = service.convert({ value: '1700003600' });

    expect(result.epochSeconds).toBe(1700003600);
    expect(result.epochMs).toBe(1700003600000);
    expect(result.iso).toBe('2023-11-14T23:13:20.000Z');
  });

  it('interpreta un epoch de 13 dígitos como milisegundos', () => {
    const result = service.convert({ value: '1700003600000' });

    expect(result.epochSeconds).toBe(1700003600);
    expect(result.epochMs).toBe(1700003600000);
    expect(result.iso).toBe('2023-11-14T23:13:20.000Z');
  });

  it('parsea una fecha ISO 8601', () => {
    const result = service.convert({ value: '2023-11-14T23:13:20.000Z' });

    expect(result.epochSeconds).toBe(1700003600);
    expect(result.iso).toBe('2023-11-14T23:13:20.000Z');
  });

  it('resuelve "now" usando Date.now()', () => {
    const fixedNow = new Date('2024-01-10T12:00:00.000Z').getTime();
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const result = service.convert({ value: 'now' });

    expect(result.epochMs).toBe(fixedNow);
    expect(result.iso).toBe('2024-01-10T12:00:00.000Z');
  });

  it('formatea `local` con offset cuando se envía una tz válida', () => {
    const result = service.convert({
      value: '1700003600',
      tz: 'America/Bogota',
    });

    expect(result.local).toBe('2023-11-14 18:13:20 GMT-05:00');
  });

  it('deja `local` en null si no se envía tz', () => {
    const result = service.convert({ value: '1700003600' });

    expect(result.local).toBeNull();
  });

  it('calcula dayOfWeek en inglés sobre UTC', () => {
    const result = service.convert({ value: '1700003600' });

    expect(result.dayOfWeek).toBe('Tuesday');
  });

  it('lanza BadRequestException con una tz que no es IANA válida', () => {
    expect(() =>
      service.convert({ value: '1700003600', tz: 'Fake/Zone' }),
    ).toThrow(BadRequestException);
  });

  it('lanza BadRequestException con un value basura', () => {
    expect(() => service.convert({ value: 'no-es-una-fecha' })).toThrow(
      BadRequestException,
    );
  });

  it('lanza BadRequestException con un value vacío tras trim', () => {
    expect(() => service.convert({ value: '   ' })).toThrow(
      BadRequestException,
    );
  });

  it('formatea `relative` en pasado con la unidad hora ("hace N horas")', () => {
    const fixedNow = new Date('2024-01-10T12:00:00.000Z').getTime();
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const past = new Date(fixedNow - 3 * 3600 * 1000).toISOString();
    const result = service.convert({ value: past });

    expect(result.relative).toBe('hace 3 horas');
  });

  it('formatea `relative` en futuro con la unidad día ("dentro de N días")', () => {
    const fixedNow = new Date('2024-01-10T12:00:00.000Z').getTime();
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const future = new Date(fixedNow + 2 * 86400 * 1000).toISOString();
    const result = service.convert({ value: future });

    expect(result.relative).toBe('dentro de 2 días');
  });

  it('timezones() devuelve un array no vacío que incluye America/Bogota', () => {
    const zones = service.timezones();

    expect(Array.isArray(zones)).toBe(true);
    expect(zones.length).toBeGreaterThan(0);
    expect(zones).toContain('America/Bogota');
  });
});
