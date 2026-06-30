import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import type { QrEcLevel, QrFormat } from './dto/create-qr.dto';

export interface QrRenderOptions {
  data: string;
  format: QrFormat;
  size: number;
  margin: number;
  dark: string;
  light: string;
  ecLevel: QrEcLevel;
}

export interface RenderedQr {
  body: Buffer | string;
  contentType: string;
}

@Injectable()
export class QrService {
  /** Genera un QR en PNG (Buffer) o SVG (string) según el formato pedido. */
  async render(dto: QrRenderOptions): Promise<RenderedQr> {
    const options: QRCode.QRCodeToBufferOptions = {
      width: dto.size,
      margin: dto.margin,
      errorCorrectionLevel: dto.ecLevel,
      color: { dark: dto.dark, light: dto.light },
    };

    if (dto.format === 'svg') {
      const svg = await QRCode.toString(dto.data, {
        type: 'svg',
        margin: dto.margin,
        errorCorrectionLevel: dto.ecLevel,
        color: { dark: dto.dark, light: dto.light },
      });
      return { body: svg, contentType: 'image/svg+xml' };
    }

    const buffer = await QRCode.toBuffer(dto.data, {
      ...options,
      type: 'png',
    });
    return { body: buffer, contentType: 'image/png' };
  }
}
