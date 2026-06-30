import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PasswordQuery } from './dto/password.query';
import { SlugifyDto } from './dto/slugify.dto';
import { UuidQuery } from './dto/uuid.query';
import { ToolsService } from './tools.service';

@ApiTags('Toolbox')
@ApiBearerAuth()
@Controller({ path: 'tools', version: '1' })
export class ToolsController {
  constructor(private readonly tools: ToolsService) {}

  @Get('uuid')
  @ApiOperation({ summary: 'Generar UUID v4' })
  uuid(@Query() query: UuidQuery) {
    return { data: this.tools.uuids(query.count) };
  }

  @Post('slugify')
  @ApiOperation({ summary: 'Convertir texto en slug URL-safe' })
  slugify(@Body() dto: SlugifyDto) {
    return { slug: this.tools.slugify(dto.text, dto.separator) };
  }

  @Get('password')
  @ApiOperation({
    summary: 'Generar contraseñas seguras',
    description:
      'Contraseñas aleatorias con crypto. Configura longitud, conjuntos de ' +
      'caracteres, exclusión de confundibles y cantidad. Devuelve entropía y fuerza.',
  })
  password(@Query() query: PasswordQuery) {
    return this.tools.generatePassword(query);
  }
}
