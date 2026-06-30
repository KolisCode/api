import { createHash } from 'node:crypto';
import { customAlphabet } from 'nanoid';

const ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const generateSecret = customAlphabet(ALPHABET, 32);

export interface GeneratedApiKey {
  /** Clave completa, mostrada UNA sola vez al crearla. */
  full: string;
  /** Parte visible para identificarla en el dashboard. */
  prefix: string;
  /** SHA-256 de la clave completa (lo único que se persiste). */
  hash: string;
}

/** SHA-256 en hex de una clave completa. */
export function hashApiKey(full: string): string {
  return createHash('sha256').update(full).digest('hex');
}

/** Genera una nueva API key: `kk_<env>_<secreto>`. */
export function generateApiKey(env: 'live' | 'test' = 'live'): GeneratedApiKey {
  const secret = generateSecret();
  const full = `kk_${env}_${secret}`;
  return {
    full,
    prefix: full.slice(0, 11), // p.ej. "kk_live_AbC"
    hash: hashApiKey(full),
  };
}
