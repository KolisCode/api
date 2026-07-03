import { ToolsService } from './tools.service';

describe('ToolsService', () => {
  let service: ToolsService;

  beforeEach(() => {
    service = new ToolsService();
  });

  describe('slugify', () => {
    it('quita acentos y eñes, normalizando a minúsculas', () => {
      expect(service.slugify('Café con Ñandú y Niños')).toBe(
        'cafe-con-nandu-y-ninos',
      );
    });

    it('colapsa espacios múltiples y separadores repetidos en uno solo', () => {
      expect(service.slugify('  Hola   Mundo!!  ')).toBe('hola-mundo');
      expect(service.slugify('Multiple---dashes and_underscores')).toBe(
        'multiple-dashes-and-underscores',
      );
    });

    it('deja intacto un string que ya es un slug válido', () => {
      expect(service.slugify('already-slug')).toBe('already-slug');
    });

    it('respeta un separador custom', () => {
      expect(service.slugify('Hola Mundo', '_')).toBe('hola_mundo');
    });
  });
});
