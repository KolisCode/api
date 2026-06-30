import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

/**
 * Factores lineales hacia la unidad base de cada categoría
 * (1 unidad = N unidades base). La temperatura se trata aparte
 * porque no es una conversión lineal pura.
 */
const UNIT_FACTORS: Record<string, Record<string, number>> = {
  length: {
    m: 1,
    km: 1000,
    cm: 0.01,
    mm: 0.001,
    mi: 1609.344,
    yd: 0.9144,
    ft: 0.3048,
    in: 0.0254,
    nmi: 1852,
  },
  mass: {
    g: 1,
    kg: 1000,
    mg: 0.001,
    t: 1_000_000,
    lb: 453.59237,
    oz: 28.349523125,
    st: 6350.29318,
  },
  volume: {
    l: 1,
    ml: 0.001,
    m3: 1000,
    gal: 3.785411784,
    qt: 0.946352946,
    pt: 0.473176473,
    cup: 0.2365882365,
    floz: 0.0295735295625,
  },
  area: {
    m2: 1,
    km2: 1_000_000,
    cm2: 0.0001,
    ha: 10_000,
    acre: 4046.8564224,
    ft2: 0.09290304,
    mi2: 2_589_988.110336,
  },
  speed: {
    'm/s': 1,
    'km/h': 0.2777777777777778,
    mph: 0.44704,
    kn: 0.5144444444444445,
    'ft/s': 0.3048,
  },
  time: {
    s: 1,
    ms: 0.001,
    min: 60,
    h: 3600,
    d: 86_400,
    wk: 604_800,
  },
  data: {
    B: 1,
    KB: 1024,
    MB: 1_048_576,
    GB: 1_073_741_824,
    TB: 1_099_511_627_776,
    bit: 0.125,
    Kb: 128,
    Mb: 131_072,
    Gb: 134_217_728,
  },
};

const TEMPERATURE = ['C', 'F', 'K'] as const;
type Temp = (typeof TEMPERATURE)[number];

const RATES_ENDPOINT = 'https://open.er-api.com/v6/latest';

interface ErApiResponse {
  result: string;
  rates?: Record<string, number>;
  time_last_update_utc?: string;
  time_next_update_unix?: number;
}

interface RatesEntry {
  rates: Record<string, number>;
  updatedAt: string;
  expiresAt: number;
}

@Injectable()
export class ConvertService {
  private readonly logger = new Logger(ConvertService.name);
  /** Caché de tasas por moneda base, válida hasta la próxima actualización del proveedor. */
  private readonly ratesCache = new Map<string, RatesEntry>();

  /** Convierte un valor entre unidades de la misma categoría (incluida temperatura). */
  convertUnits(value: number, fromRaw: string, toRaw: string) {
    const from = fromRaw.trim();
    const to = toRaw.trim();

    const tempFrom = from.toUpperCase();
    const tempTo = to.toUpperCase();
    if (this.isTemp(tempFrom) || this.isTemp(tempTo)) {
      if (!this.isTemp(tempFrom) || !this.isTemp(tempTo)) {
        throw new BadRequestException(
          `Conversión inválida entre "${from}" y "${to}". Las temperaturas solo se convierten entre C, F y K.`,
        );
      }
      const result = this.convertTemperature(value, tempFrom, tempTo);
      return {
        value,
        from: tempFrom,
        to: tempTo,
        category: 'temperature',
        result: this.round(result),
      };
    }

    const category = Object.keys(UNIT_FACTORS).find(
      (cat) =>
        UNIT_FACTORS[cat][from] !== undefined &&
        UNIT_FACTORS[cat][to] !== undefined,
    );
    if (!category) {
      throw new BadRequestException(
        `No se puede convertir de "${from}" a "${to}". Verifica que ambas unidades existan y sean de la misma categoría.`,
      );
    }

    const result =
      (value * UNIT_FACTORS[category][from]) / UNIT_FACTORS[category][to];
    return { value, from, to, category, result: this.round(result) };
  }

  /** Convierte un importe entre divisas usando tasas en vivo (con caché). */
  async convertCurrency(amount: number, fromRaw: string, toRaw: string) {
    const from = fromRaw.trim().toUpperCase();
    const to = toRaw.trim().toUpperCase();

    const { rates, updatedAt } = await this.getRates(from);
    const rate = rates[to];
    if (rate === undefined) {
      throw new BadRequestException(`Moneda destino "${to}" no soportada.`);
    }

    return {
      amount,
      from,
      to,
      rate: Number(rate.toFixed(6)),
      result: Number((amount * rate).toFixed(4)),
      ratesUpdatedAt: updatedAt,
    };
  }

  private async getRates(base: string): Promise<RatesEntry> {
    const cached = this.ratesCache.get(base);
    if (cached && cached.expiresAt > Date.now()) return cached;

    let json: ErApiResponse;
    try {
      const res = await fetch(`${RATES_ENDPOINT}/${base}`);
      json = (await res.json()) as ErApiResponse;
    } catch (err) {
      this.logger.error(`Fallo al obtener tasas para ${base}`, err as Error);
      throw new ServiceUnavailableException(
        'El proveedor de tasas de cambio no está disponible.',
      );
    }

    if (json.result !== 'success' || !json.rates) {
      throw new BadRequestException(`Moneda base "${base}" no soportada.`);
    }

    const entry: RatesEntry = {
      rates: json.rates,
      updatedAt: json.time_last_update_utc ?? new Date().toUTCString(),
      expiresAt: json.time_next_update_unix
        ? json.time_next_update_unix * 1000
        : Date.now() + 3_600_000,
    };
    this.ratesCache.set(base, entry);
    return entry;
  }

  private isTemp(unit: string): unit is Temp {
    return (TEMPERATURE as readonly string[]).includes(unit);
  }

  private convertTemperature(value: number, from: Temp, to: Temp): number {
    // Normaliza a Celsius y luego a la unidad destino.
    const celsius =
      from === 'C'
        ? value
        : from === 'F'
          ? ((value - 32) * 5) / 9
          : value - 273.15;
    if (to === 'C') return celsius;
    if (to === 'F') return (celsius * 9) / 5 + 32;
    return celsius + 273.15;
  }

  /** Redondea eliminando el ruido de punto flotante sin perder magnitud. */
  private round(n: number): number {
    return Number(n.toPrecision(12));
  }
}
