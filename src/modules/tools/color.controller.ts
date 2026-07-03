import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ColorQuery } from './dto/color.query';
import { ColorService } from './color.service';

@ApiTags('Toolbox')
@ApiBearerAuth()
@Controller({ path: 'tools', version: '1' })
export class ColorController {
  constructor(private readonly color: ColorService) {}

  @Get('color')
  @ApiOperation({
    summary: 'Convertir color entre hex, rgb() y hsl()',
    description:
      'Acepta hex (#fff, #ffffff, con o sin "#"), rgb(r, g, b) o ' +
      'hsl(h, s%, l%) en `value`, con o sin espacios. Devuelve las 3 ' +
      'representaciones equivalentes, la luminancia relativa WCAG y los ' +
      'ratios de contraste contra blanco y negro (con el veredicto AA/AAA ' +
      'para texto normal).',
  })
  convert(@Query() query: ColorQuery) {
    return this.color.convert(query);
  }
}
