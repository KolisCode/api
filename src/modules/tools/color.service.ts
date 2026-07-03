import { BadRequestException, Injectable } from '@nestjs/common';
import { ColorQuery } from './dto/color.query';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export interface ColorResult {
  hex: string;
  rgb: Rgb;
  hsl: Hsl;
  luminance: number;
  contrastVsWhite: number;
  contrastVsBlack: number;
  wcag: {
    aaNormalOnWhite: boolean;
    aaNormalOnBlack: boolean;
    aaaNormalOnWhite: boolean;
    aaaNormalOnBlack: boolean;
  };
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_RE = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
const HSL_RE = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i;

@Injectable()
export class ColorService {
  /**
   * Parsea `value` (hex, rgb() o hsl(), tolerando espacios y "#" opcional),
   * lo normaliza a RGB y devuelve las 3 representaciones equivalentes más
   * luminancia relativa WCAG y ratios de contraste contra blanco y negro.
   */
  convert(query: ColorQuery): ColorResult {
    const rgb = this.parse(query.value);
    return this.build(rgb);
  }

  private parse(raw: string): Rgb {
    const value = raw.trim();

    const hexMatch = HEX_RE.exec(value);
    if (hexMatch) return this.hexToRgb(hexMatch[1]);

    const rgbMatch = RGB_RE.exec(value);
    if (rgbMatch) {
      const [r, g, b] = [
        Number(rgbMatch[1]),
        Number(rgbMatch[2]),
        Number(rgbMatch[3]),
      ];
      this.assertRange(r, 0, 255, 'r');
      this.assertRange(g, 0, 255, 'g');
      this.assertRange(b, 0, 255, 'b');
      return { r, g, b };
    }

    const hslMatch = HSL_RE.exec(value);
    if (hslMatch) {
      const [h, s, l] = [
        Number(hslMatch[1]),
        Number(hslMatch[2]),
        Number(hslMatch[3]),
      ];
      this.assertRange(h, 0, 360, 'h');
      this.assertRange(s, 0, 100, 's');
      this.assertRange(l, 0, 100, 'l');
      return this.hslToRgb(h, s, l);
    }

    throw new BadRequestException(
      `El valor "${raw}" no coincide con ningún formato soportado ` +
        '(hex, rgb() o hsl()).',
    );
  }

  private assertRange(n: number, min: number, max: number, label: string) {
    if (Number.isNaN(n) || n < min || n > max) {
      throw new BadRequestException(
        `El componente "${label}" (${n}) está fuera de rango [${min}, ${max}].`,
      );
    }
  }

  /** Expande hex de 3 dígitos (#abc → #aabbcc) y lo convierte a RGB. */
  private hexToRgb(hex: string): Rgb {
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }

  private rgbToHex({ r, g, b }: Rgb): string {
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Algoritmo CSS estándar. h/s/l de salida se redondean al entero más
   * cercano: son valores de presentación (grados y porcentajes enteros),
   * no se necesita más precisión y evita ruido de punto flotante.
   */
  private rgbToHsl({ r, g, b }: Rgb): Hsl {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;

    let h = 0;
    let s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rn:
          h = (gn - bn) / d + (gn < bn ? 6 : 0);
          break;
        case gn:
          h = (bn - rn) / d + 2;
          break;
        default:
          h = (rn - gn) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  /** Algoritmo CSS estándar (hue2rgb). Componentes RGB de salida redondeados
   * al entero más cercano (0-255). */
  private hslToRgb(h: number, s: number, l: number): Rgb {
    const hn = h / 360;
    const sn = s / 100;
    const ln = l / 100;

    if (sn === 0) {
      const v = Math.round(ln * 255);
      return { r: v, g: v, b: v };
    }

    const hue2rgb = (p: number, q: number, t: number): number => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };

    const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
    const p = 2 * ln - q;
    const r = hue2rgb(p, q, hn + 1 / 3);
    const g = hue2rgb(p, q, hn);
    const b = hue2rgb(p, q, hn - 1 / 3);

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  /**
   * Luminancia relativa WCAG 2.x sobre sRGB linearizado. Se redondea a 4
   * decimales: suficiente precisión para diferenciar colores cercanos sin
   * arrastrar ruido de punto flotante en la respuesta JSON.
   */
  private relativeLuminance({ r, g, b }: Rgb): number {
    const channel = (c: number) => {
      const cn = c / 255;
      return cn <= 0.03928 ? cn / 12.92 : Math.pow((cn + 0.055) / 1.055, 2.4);
    };
    const value =
      0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    return Math.round(value * 10000) / 10000;
  }

  /** Ratio de contraste WCAG: (L1 + 0.05) / (L2 + 0.05) con L1 ≥ L2. */
  private contrastRatio(l1: number, l2: number): number {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  private build(rgb: Rgb): ColorResult {
    const hsl = this.rgbToHsl(rgb);
    // La luminancia usada en los ratios es la que ya se redondea a 4
    // decimales arriba; el ratio final se redondea aparte a 2 decimales,
    // pero la comparación contra los umbrales AA/AAA se hace con el ratio
    // sin redondear para no dejar pasar/rechazar casos límite por el
    // redondeo de presentación (ej. 4.499 no debe aprobar AA por redondear
    // a "4.5" en el número mostrado).
    const luminance = this.relativeLuminance(rgb);
    const rawContrastVsWhite = this.contrastRatio(luminance, 1);
    const rawContrastVsBlack = this.contrastRatio(luminance, 0);
    const round2 = (n: number) => Math.round(n * 100) / 100;

    return {
      hex: this.rgbToHex(rgb),
      rgb,
      hsl,
      luminance,
      contrastVsWhite: round2(rawContrastVsWhite),
      contrastVsBlack: round2(rawContrastVsBlack),
      wcag: {
        aaNormalOnWhite: rawContrastVsWhite >= 4.5,
        aaNormalOnBlack: rawContrastVsBlack >= 4.5,
        aaaNormalOnWhite: rawContrastVsWhite >= 7,
        aaaNormalOnBlack: rawContrastVsBlack >= 7,
      },
    };
  }
}
