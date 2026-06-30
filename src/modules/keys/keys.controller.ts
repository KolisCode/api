import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentKey } from '../../common/auth/current-key.decorator';
import type { AuthenticatedKey } from '../../common/auth/authenticated-key';
import { Public } from '../../common/auth/public.decorator';
import { CreateKeyDto } from './dto/create-key.dto';
import { KeysService } from './keys.service';

@ApiTags('API Keys')
@Controller({ path: 'keys', version: '1' })
export class KeysController {
  constructor(private readonly keys: KeysService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Crear una API key (demo)',
    description:
      'Genera una API key de plan FREE para probar el resto de la API. ' +
      'La clave completa solo se muestra en esta respuesta.',
  })
  create(@Body() dto: CreateKeyDto) {
    return this.keys.create(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Información de la API key actual',
    description: 'Devuelve los metadatos de la API key usada en la petición.',
  })
  me(@CurrentKey() key: AuthenticatedKey) {
    return this.keys.findById(key.id);
  }
}
