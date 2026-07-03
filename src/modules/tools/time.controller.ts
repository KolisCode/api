import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TimestampQuery } from './dto/timestamp.query';
import { TimeService } from './time.service';

@ApiTags('Toolbox')
@ApiBearerAuth()
@Controller({ path: 'tools', version: '1' })
export class TimeController {
  constructor(private readonly time: TimeService) {}

  // Ruta literal declarada antes que 'timestamp' para dejar explícito que
  // no debe quedar atrapada por ninguna ruta con parámetro (aquí no la hay,
  // pero así queda a prueba de futuros :param bajo /timestamp).
  @Get('timestamp/timezones')
  @ApiOperation({
    summary: 'Listar timezones IANA soportadas',
    description:
      'Devuelve todos los identificadores IANA (ej. "America/Bogota") ' +
      'aceptados por el parámetro `tz` de `/tools/timestamp`.',
  })
  timezones() {
    return { data: this.time.timezones() };
  }

  @Get('timestamp')
  @ApiOperation({
    summary: 'Convertir timestamp / fecha entre formatos y timezones',
    description:
      'Acepta epoch en segundos, epoch en milisegundos, fecha ISO 8601 o ' +
      'el literal "now" en `value`. Devuelve epoch, ISO/UTC, día de la ' +
      'semana, fecha relativa en español y, si se envía `tz` (IANA), la ' +
      'hora local en esa zona.',
  })
  convert(@Query() query: TimestampQuery) {
    return this.time.convert(query);
  }
}
