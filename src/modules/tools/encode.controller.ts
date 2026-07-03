import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Base64Dto } from './dto/base64.dto';
import { JwtDecodeDto } from './dto/jwt-decode.dto';
import { EncodeService } from './encode.service';

@ApiTags('Toolbox')
@ApiBearerAuth()
@Controller({ path: 'tools', version: '1' })
export class EncodeController {
  constructor(private readonly encode: EncodeService) {}

  @Post('base64')
  @ApiOperation({
    summary: 'Codificar / decodificar texto en base64',
    description:
      'Con `action: "encode"` codifica un texto UTF-8 en base64 (estándar ' +
      'o base64url según `urlSafe`). Con `action: "decode"` acepta tanto ' +
      'base64 estándar como base64url sin importar `urlSafe`.',
  })
  base64(@Body() dto: Base64Dto) {
    return this.encode.base64(dto);
  }

  @Post('jwt/decode')
  @ApiOperation({
    summary: 'Decodificar un JWT',
    description:
      'Decodifica el header y el payload de un JWT (base64url → JSON) y ' +
      'reporta si está expirado según `exp`. Solo decodifica, NO verifica ' +
      'la firma del token.',
  })
  jwtDecode(@Body() dto: JwtDecodeDto) {
    return this.encode.jwtDecode(dto);
  }
}
