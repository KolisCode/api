import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConvertCurrencyQuery } from './dto/convert-currency.query';
import { ConvertUnitsQuery } from './dto/convert-units.query';
import { ConvertService } from './convert.service';

@ApiTags('Conversiones')
@ApiBearerAuth()
@Controller({ path: 'convert', version: '1' })
export class ConvertController {
  constructor(private readonly convert: ConvertService) {}

  @Get('units')
  @ApiOperation({
    summary: 'Convertir unidades',
    description:
      'Longitud, masa, volumen, área, velocidad, tiempo, almacenamiento digital y temperatura.',
  })
  units(@Query() query: ConvertUnitsQuery) {
    return this.convert.convertUnits(query.value, query.from, query.to);
  }

  @Get('currency')
  @ApiOperation({
    summary: 'Convertir monedas',
    description:
      'Tasas de cambio en vivo (~160 divisas), cacheadas hasta la próxima actualización.',
  })
  currency(@Query() query: ConvertCurrencyQuery) {
    return this.convert.convertCurrency(query.amount, query.from, query.to);
  }
}
