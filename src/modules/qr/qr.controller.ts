import { Body, Controller, Post, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CreateQrDto } from './dto/create-qr.dto';
import { QrService } from './qr.service';

@ApiTags('QR')
@ApiBearerAuth()
@Controller({ path: 'qr', version: '1' })
export class QrController {
  constructor(private readonly qr: QrService) {}

  @Post()
  @ApiOperation({
    summary: 'Generar un código QR',
    description: 'Devuelve la imagen del QR (PNG por defecto, o SVG).',
  })
  @ApiProduces('image/png', 'image/svg+xml')
  @ApiOkResponse({
    description: 'Imagen del QR',
    content: {
      'image/png': { schema: { type: 'string', format: 'binary' } },
      'image/svg+xml': { schema: { type: 'string' } },
    },
  })
  async create(@Body() dto: CreateQrDto, @Res() res: Response) {
    const { body, contentType } = await this.qr.render(dto);
    res.type(contentType).send(body);
  }
}
