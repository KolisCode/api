import { BadRequestException, Injectable } from '@nestjs/common';
import { randomInt, randomUUID } from 'node:crypto';
import { Faker, en, es } from '@faker-js/faker';

export type SupportedLocale = 'en' | 'es';

const CHARSET = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?',
} as const;

/** Caracteres fáciles de confundir entre sí: i, l, 1, L, o, 0, O. */
const SIMILAR = /[il1LoO0]/g;

export interface PasswordOptions {
  length: number;
  count: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
}

export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'very-strong';

const LOCALES: Record<
  SupportedLocale,
  ConstructorParameters<typeof Faker>[0]['locale']
> = {
  en: [en],
  es: [es, en],
};

export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  email: string;
  avatar: string;
  phone: string;
  jobTitle: string;
  country: string;
  city: string;
  createdAt: string;
}

@Injectable()
export class ToolsService {
  /** Genera usuarios fake. Con `seed` el resultado es reproducible. */
  mockUsers(count: number, locale: SupportedLocale, seed?: number): MockUser[] {
    const faker = new Faker({ locale: LOCALES[locale] ?? LOCALES.en });
    if (seed !== undefined) faker.seed(seed);

    return Array.from({ length: count }, () => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      return {
        id: faker.string.uuid(),
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        username: faker.internet
          .username({ firstName, lastName })
          .toLowerCase(),
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        avatar: faker.image.avatarGitHub(),
        phone: faker.phone.number(),
        jobTitle: faker.person.jobTitle(),
        country: faker.location.country(),
        city: faker.location.city(),
        createdAt: faker.date.past({ years: 3 }).toISOString(),
      };
    });
  }

  /** Genera N UUID v4. */
  uuids(count: number): string[] {
    return Array.from({ length: count }, () => randomUUID());
  }

  /**
   * Genera contraseñas criptográficamente aleatorias (crypto.randomInt, sin sesgo).
   * Garantiza al menos un carácter de cada conjunto seleccionado y mezcla el
   * resultado con Fisher-Yates. Devuelve también la entropía estimada en bits.
   */
  generatePassword(opts: PasswordOptions) {
    const pools: string[] = [];
    if (opts.lowercase) pools.push(CHARSET.lowercase);
    if (opts.uppercase) pools.push(CHARSET.uppercase);
    if (opts.numbers) pools.push(CHARSET.numbers);
    if (opts.symbols) pools.push(CHARSET.symbols);

    const filtered = pools
      .map((set) => (opts.excludeSimilar ? set.replace(SIMILAR, '') : set))
      .filter((set) => set.length > 0);

    if (filtered.length === 0) {
      throw new BadRequestException(
        'Selecciona al menos un conjunto de caracteres.',
      );
    }
    if (opts.length < filtered.length) {
      throw new BadRequestException(
        `La longitud (${opts.length}) es menor que el número de conjuntos seleccionados (${filtered.length}).`,
      );
    }

    const all = filtered.join('');
    const passwords = Array.from({ length: opts.count }, () =>
      this.buildPassword(opts.length, filtered, all),
    );
    const entropyBits = Number(
      (opts.length * Math.log2(all.length)).toFixed(2),
    );

    return {
      passwords,
      length: opts.length,
      poolSize: all.length,
      entropyBits,
      strength: this.classifyStrength(entropyBits),
    };
  }

  private buildPassword(length: number, pools: string[], all: string): string {
    const chars: string[] = [];
    // Garantiza al menos un carácter de cada conjunto seleccionado.
    for (const pool of pools) chars.push(pool[randomInt(pool.length)]);
    while (chars.length < length) chars.push(all[randomInt(all.length)]);
    // Fisher-Yates para que los caracteres garantizados no queden al inicio.
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  }

  private classifyStrength(entropyBits: number): PasswordStrength {
    if (entropyBits < 40) return 'weak';
    if (entropyBits < 60) return 'fair';
    if (entropyBits < 80) return 'strong';
    return 'very-strong';
  }

  /** Convierte un texto a slug URL-safe. */
  slugify(text: string, separator = '-'): string {
    const slug = text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // quita acentos (diacríticos)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, separator)
      .replace(new RegExp(`\\${separator}{2,}`, 'g'), separator)
      .replace(new RegExp(`^\\${separator}|\\${separator}$`, 'g'), '');
    return slug;
  }

  /** Valida un número de tarjeta con el algoritmo de Luhn y detecta la marca. */
  validateCreditCard(input: string) {
    const number = input.replace(/[\s-]/g, '');
    const isNumeric = /^\d{12,19}$/.test(number);
    const valid = isNumeric && this.luhn(number);
    return {
      input,
      normalized: number,
      valid,
      brand: valid ? this.detectBrand(number) : null,
    };
  }

  private luhn(number: string): boolean {
    let sum = 0;
    let double = false;
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = Number(number[i]);
      if (double) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      double = !double;
    }
    return sum % 10 === 0;
  }

  private detectBrand(number: string): string {
    if (/^4/.test(number)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^(6011|65|64[4-9])/.test(number)) return 'discover';
    if (/^3(0[0-5]|6|8)/.test(number)) return 'diners';
    if (/^35/.test(number)) return 'jcb';
    return 'unknown';
  }
}
