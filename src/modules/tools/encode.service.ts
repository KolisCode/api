import { BadRequestException, Injectable } from '@nestjs/common';
import { Base64Action, Base64Dto } from './dto/base64.dto';
import { JwtDecodeDto } from './dto/jwt-decode.dto';

type BufferBase64Encoding = 'base64' | 'base64url';

export interface Base64Result {
  input: {
    length: number;
    action: Base64Action;
    urlSafe: boolean;
  };
  result: string;
}

export interface JwtDecodeResult {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signatureB64: string;
  isExpired: boolean | null;
  expiresAt: string | null;
  issuedAt: string | null;
}

@Injectable()
export class EncodeService {
  /**
   * Codifica/decodifica un texto en base64 (estándar o base64url).
   * En `decode` se acepta cualquiera de las dos variantes sin importar
   * `urlSafe` (que solo afecta al alfabeto usado al codificar).
   */
  base64(dto: Base64Dto): Base64Result {
    const result =
      dto.action === 'encode'
        ? this.encodeBase64(dto.text, dto.urlSafe)
        : this.decodeBase64(dto.text);

    return {
      input: {
        length: dto.text.length,
        action: dto.action,
        urlSafe: dto.urlSafe,
      },
      result,
    };
  }

  /**
   * Decodifica (sin verificar firma) un JWT en sus tres segmentos.
   */
  jwtDecode(dto: JwtDecodeDto): JwtDecodeResult {
    const parts = dto.token.split('.');
    if (parts.length !== 3) {
      throw new BadRequestException(
        'El token debe tener exactamente 3 partes separadas por "." ' +
          '(header.payload.signature).',
      );
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const header = this.decodeJsonSegment(headerB64, 'header');
    const payload = this.decodeJsonSegment(payloadB64, 'payload');

    const exp = typeof payload.exp === 'number' ? payload.exp : undefined;
    const iat = typeof payload.iat === 'number' ? payload.iat : undefined;

    return {
      header,
      payload,
      signatureB64,
      isExpired: exp === undefined ? null : Date.now() >= exp * 1000,
      expiresAt: exp === undefined ? null : new Date(exp * 1000).toISOString(),
      issuedAt: iat === undefined ? null : new Date(iat * 1000).toISOString(),
    };
  }

  private encodeBase64(text: string, urlSafe: boolean): string {
    return Buffer.from(text, 'utf8').toString(urlSafe ? 'base64url' : 'base64');
  }

  private decodeBase64(text: string): string {
    const buffer =
      this.tryDecode(text, 'base64') ?? this.tryDecode(text, 'base64url');
    if (!buffer) {
      throw new BadRequestException(
        'El texto recibido no es una cadena base64 / base64url válida.',
      );
    }
    return buffer.toString('utf8');
  }

  private decodeJsonSegment(
    segment: string,
    label: 'header' | 'payload',
  ): Record<string, unknown> {
    const buffer =
      this.tryDecode(segment, 'base64url') ?? this.tryDecode(segment, 'base64');
    if (!buffer) {
      throw new BadRequestException(
        `El ${label} del token no es base64url válido.`,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(buffer.toString('utf8'));
    } catch {
      throw new BadRequestException(
        `El ${label} del token no contiene JSON válido.`,
      );
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new BadRequestException(
        `El ${label} del token no contiene JSON válido.`,
      );
    }

    return parsed as Record<string, unknown>;
  }

  /**
   * Decodifica `text` bajo la codificación indicada y valida el resultado
   * con un round-trip: `Buffer.from(x, 'base64')` NO lanza con basura, así
   * que solo se acepta si re-codificar el buffer reproduce el input
   * original (ignorando el padding `=`).
   */
  private tryDecode(
    text: string,
    encoding: BufferBase64Encoding,
  ): Buffer | null {
    if (text === '') return Buffer.alloc(0);

    const buffer = Buffer.from(text, encoding);
    const roundTrip = buffer.toString(encoding).replace(/=+$/, '');
    const normalizedInput = text.replace(/=+$/, '');

    return roundTrip === normalizedInput ? buffer : null;
  }
}
