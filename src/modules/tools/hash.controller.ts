import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateHashDto } from './dto/hash.dto';
import { HashService } from './hash.service';

@ApiTags('Toolbox')
@ApiBearerAuth()
@Controller({ path: 'tools', version: '1' })
export class HashController {
  constructor(private readonly hash: HashService) {}

  @Post('hash')
  @ApiOperation({
    summary: 'Generar hash / HMAC de un texto',
    description:
      'Calcula MD5, SHA-1, SHA-256 y/o SHA-512 de un texto en hex o base64. ' +
      'Si se envía `hmacKey`, calcula el HMAC correspondiente en vez de un ' +
      'hash plano.',
  })
  create(@Body() dto: CreateHashDto) {
    return this.hash.generate(dto);
  }
}
