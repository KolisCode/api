import { BadRequestException, Injectable } from '@nestjs/common';
import { TimestampQuery } from './dto/timestamp.query';

export interface TimestampResult {
  epochSeconds: number;
  epochMs: number;
  iso: string;
  utc: string;
  local: string | null;
  dayOfWeek: string;
  relative: string;
}

/**
 * Umbral para decidir si un epoch numérico puro (solo dígitos) viene en
 * segundos o en milisegundos: los epochs en segundos vigentes tienen 10
 * dígitos (llegan a 11 recién en el año 2286); los epochs en milisegundos
 * tienen 13. Se trata como ms si el valor es >= 1e12 (13 dígitos) o si el
 * número de dígitos supera 13 (por si llega algo todavía más largo, se
 * asume ms en vez de interpretarlo como segundos absurdamente lejanos).
 */
const MS_THRESHOLD = 1e12;

/** Unidades de mayor a menor, con su duración en segundos, para elegir la
 * unidad "más grande razonable" al formatear una fecha relativa. */
const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

@Injectable()
export class TimeService {
  /**
   * Convierte `value` (epoch en segundos/ms, ISO 8601 o "now") a un set de
   * representaciones: epoch, ISO/UTC, hora local en `tz` (si se envía),
   * día de la semana y fecha relativa en español.
   */
  convert(query: TimestampQuery): TimestampResult {
    const date = this.parseValue(query.value);
    const tz = this.validateTimezone(query.tz);

    const epochMs = date.getTime();
    const epochSeconds = Math.floor(epochMs / 1000);

    return {
      epochSeconds,
      epochMs,
      iso: date.toISOString(),
      utc: date.toUTCString(),
      local: tz ? this.formatLocal(date, tz) : null,
      dayOfWeek: new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        timeZone: 'UTC',
      }).format(date),
      relative: this.formatRelative(date),
    };
  }

  /** IANA timezones soportadas por el runtime actual. */
  timezones(): string[] {
    return Intl.supportedValuesOf('timeZone');
  }

  private parseValue(value: string): Date {
    const trimmed = value.trim();

    if (trimmed.toLowerCase() === 'now') {
      return new Date(Date.now());
    }

    if (/^-?\d+$/.test(trimmed)) {
      const numeric = Number(trimmed);
      const digitCount = trimmed.replace('-', '').length;
      const isMs = Math.abs(numeric) >= MS_THRESHOLD || digitCount > 13;
      const date = new Date(isMs ? numeric : numeric * 1000);
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException(
          `El valor "${value}" no es un timestamp epoch válido.`,
        );
      }
      return date;
    }

    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        `El valor "${value}" no es un epoch, una fecha ISO 8601 ni "now" válido.`,
      );
    }
    return date;
  }

  private validateTimezone(tz: string | undefined): string | undefined {
    if (!tz) return undefined;

    if (!this.timezones().includes(tz)) {
      throw new BadRequestException(
        `La timezone "${tz}" no es un identificador IANA válido.`,
      );
    }
    return tz;
  }

  /** Formatea `date` en `tz` como "YYYY-MM-DD HH:mm:ss GMT±HH:MM". */
  private formatLocal(date: Date, tz: string): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'longOffset',
    }).formatToParts(date);

    const get = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? '';

    const offset = get('timeZoneName');
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')} ${offset}`;
  }

  /**
   * Fecha relativa a "ahora" en español ("hace 3 horas", "dentro de 2 días"),
   * eligiendo la unidad más grande cuyo umbral se supera (año > mes > semana
   * > día > hora > minuto > segundo).
   */
  private formatRelative(date: Date): string {
    const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
    const absSeconds = Math.abs(diffSeconds);
    const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'always' });

    for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
      if (absSeconds >= secondsInUnit || unit === 'second') {
        const value = Math.round(diffSeconds / secondsInUnit);
        return rtf.format(value, unit);
      }
    }

    // Inalcanzable: el loop siempre resuelve en 'second' como último recurso.
    return rtf.format(0, 'second');
  }
}
