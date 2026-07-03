import { BadRequestException } from '@nestjs/common';
import { ColorService } from './color.service';

/**
 * Valores de referencia verificados con:
 *   node -e "
 *     function rgbToHsl(r,g,b){ ... } // algoritmo CSS estándar
 *     function relLum(r,g,b){ ... }   // WCAG 2.x sobre sRGB linearizado
 *     function contrast(l1,l2){ return (max(l1,l2)+0.05)/(min(l1,l2)+0.05); }
 *   "
 * → white:  hsl(0,0,100)  lum=1      contrastVsWhite=1     contrastVsBlack=21
 *   black:  hsl(0,0,0)    lum=0      contrastVsWhite=21    contrastVsBlack=1
 *   red:    hsl(0,100,50) lum=0.2126 contrastVsWhite=4     contrastVsBlack=5.25
 *   amber (#fbbf24 = 251,191,36): hsl(43,96,56) lum=0.579
 *     contrastVsWhite=1.67 contrastVsBlack=12.58
 *   gris medio (#808080 = 128,128,128): hsl(0,0,50) lum=0.2159
 *     contrastVsWhite=3.95 contrastVsBlack=5.32
 * (contraste blanco/negro = 21 es el valor canónico WCAG máximo).
 */
describe('ColorService', () => {
  let service: ColorService;

  beforeEach(() => {
    service = new ColorService();
  });

  describe('colores conocidos', () => {
    it('#ffffff: luminancia 1, contraste 21 vs negro, 1 vs blanco', () => {
      const result = service.convert({ value: '#ffffff' });

      expect(result.hex).toBe('#ffffff');
      expect(result.rgb).toEqual({ r: 255, g: 255, b: 255 });
      expect(result.hsl).toEqual({ h: 0, s: 0, l: 100 });
      expect(result.luminance).toBe(1);
      expect(result.contrastVsBlack).toBe(21);
      expect(result.contrastVsWhite).toBe(1);
      expect(result.wcag).toEqual({
        aaNormalOnWhite: false,
        aaNormalOnBlack: true,
        aaaNormalOnWhite: false,
        aaaNormalOnBlack: true,
      });
    });

    it('#000000: es el inverso exacto de #ffffff', () => {
      const result = service.convert({ value: '#000000' });

      expect(result.rgb).toEqual({ r: 0, g: 0, b: 0 });
      expect(result.hsl).toEqual({ h: 0, s: 0, l: 0 });
      expect(result.luminance).toBe(0);
      expect(result.contrastVsWhite).toBe(21);
      expect(result.contrastVsBlack).toBe(1);
      expect(result.wcag).toEqual({
        aaNormalOnWhite: true,
        aaNormalOnBlack: false,
        aaaNormalOnWhite: true,
        aaaNormalOnBlack: false,
      });
    });

    it('#ff0000 → rgb(255,0,0) → hsl(0,100%,50%)', () => {
      const result = service.convert({ value: '#ff0000' });

      expect(result.rgb).toEqual({ r: 255, g: 0, b: 0 });
      expect(result.hsl).toEqual({ h: 0, s: 100, l: 50 });
      expect(result.hex).toBe('#ff0000');
    });

    it('ámbar de marca #fbbf24', () => {
      const result = service.convert({ value: '#fbbf24' });

      expect(result.rgb).toEqual({ r: 251, g: 191, b: 36 });
      expect(result.hsl).toEqual({ h: 43, s: 96, l: 56 });
      expect(result.luminance).toBe(0.579);
      expect(result.contrastVsWhite).toBe(1.67);
      expect(result.contrastVsBlack).toBe(12.58);
      expect(result.wcag).toEqual({
        aaNormalOnWhite: false,
        aaNormalOnBlack: true,
        aaaNormalOnWhite: false,
        aaaNormalOnBlack: true,
      });
    });

    it('gris medio #808080', () => {
      const result = service.convert({ value: '#808080' });

      expect(result.rgb).toEqual({ r: 128, g: 128, b: 128 });
      expect(result.hsl).toEqual({ h: 0, s: 0, l: 50 });
      expect(result.luminance).toBe(0.2159);
      expect(result.contrastVsWhite).toBe(3.95);
      expect(result.contrastVsBlack).toBe(5.32);
      expect(result.wcag).toEqual({
        aaNormalOnWhite: false,
        aaNormalOnBlack: true,
        aaaNormalOnWhite: false,
        aaaNormalOnBlack: false,
      });
    });
  });

  describe('formatos de entrada equivalentes', () => {
    const expected = { r: 255, g: 255, b: 255 };

    it('#fff (short hex sin "#" implícito con "#")', () => {
      expect(service.convert({ value: '#fff' }).rgb).toEqual(expected);
    });

    it('#ffffff', () => {
      expect(service.convert({ value: '#ffffff' }).rgb).toEqual(expected);
    });

    it('fff sin "#"', () => {
      expect(service.convert({ value: 'fff' }).rgb).toEqual(expected);
    });

    it('ffffff sin "#"', () => {
      expect(service.convert({ value: 'ffffff' }).rgb).toEqual(expected);
    });

    it('rgb(255,255,255) sin espacios', () => {
      expect(service.convert({ value: 'rgb(255,255,255)' }).rgb).toEqual(
        expected,
      );
    });

    it('rgb(255, 255, 255) con espacios', () => {
      expect(service.convert({ value: 'rgb(255, 255, 255)' }).rgb).toEqual(
        expected,
      );
    });

    it('hsl(0,0%,100%) sin espacios', () => {
      expect(service.convert({ value: 'hsl(0,0%,100%)' }).rgb).toEqual(
        expected,
      );
    });

    it('hsl(0, 0%, 100%) con espacios', () => {
      expect(service.convert({ value: 'hsl(0, 0%, 100%)' }).rgb).toEqual(
        expected,
      );
    });

    it('RGB() y HSL() en mayúsculas', () => {
      expect(service.convert({ value: 'RGB(255, 255, 255)' }).rgb).toEqual(
        expected,
      );
      expect(service.convert({ value: 'HSL(0, 0%, 100%)' }).rgb).toEqual(
        expected,
      );
    });
  });

  describe('entradas inválidas', () => {
    it('lanza BadRequestException con basura', () => {
      expect(() => service.convert({ value: 'no-es-un-color' })).toThrow(
        BadRequestException,
      );
    });

    it('lanza BadRequestException con string vacío tras trim', () => {
      expect(() => service.convert({ value: '   ' })).toThrow(
        BadRequestException,
      );
    });

    it('lanza BadRequestException con rgb(300,0,0) (componente fuera de rango)', () => {
      expect(() => service.convert({ value: 'rgb(300,0,0)' })).toThrow(
        BadRequestException,
      );
    });

    it('lanza BadRequestException con rgb(-1,0,0)', () => {
      expect(() => service.convert({ value: 'rgb(-1,0,0)' })).toThrow(
        BadRequestException,
      );
    });

    it('lanza BadRequestException con hsl(400,50%,50%) (h fuera de rango)', () => {
      expect(() => service.convert({ value: 'hsl(400,50%,50%)' })).toThrow(
        BadRequestException,
      );
    });

    it('lanza BadRequestException con hsl(0,150%,50%) (s fuera de rango)', () => {
      expect(() => service.convert({ value: 'hsl(0,150%,50%)' })).toThrow(
        BadRequestException,
      );
    });

    it('lanza BadRequestException con hex de 4 dígitos (formato no soportado)', () => {
      expect(() => service.convert({ value: '#ffff' })).toThrow(
        BadRequestException,
      );
    });
  });
});
