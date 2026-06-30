import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentKey } from '../../common/auth/current-key.decorator';
import type { AuthenticatedKey } from '../../common/auth/authenticated-key';
import { QrService } from '../qr/qr.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { LinkQrQuery } from './dto/link-qr.query';
import { ListLinksQuery } from './dto/list-links.query';
import { LinksService } from './links.service';

@ApiTags('Links')
@ApiBearerAuth()
@Controller({ path: 'links', version: '1' })
export class LinksController {
  constructor(
    private readonly links: LinksService,
    private readonly qr: QrService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un enlace corto' })
  create(@CurrentKey() key: AuthenticatedKey, @Body() dto: CreateLinkDto) {
    return this.links.create(key.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mis enlaces (paginación por cursor)' })
  list(@CurrentKey() key: AuthenticatedKey, @Query() query: ListLinksQuery) {
    return this.links.list(key.id, query);
  }

  @Get(':code/stats')
  @ApiOperation({
    summary: 'Analytics de un enlace',
    description:
      'Clics totales, desglose por dispositivo, navegador, país, ' +
      'top referrers y timeline diaria.',
  })
  stats(@CurrentKey() key: AuthenticatedKey, @Param('code') code: string) {
    return this.links.stats(key.id, code);
  }

  @Get(':code/qr')
  @ApiOperation({
    summary: 'QR del enlace corto',
    description: 'Genera un código QR que apunta al shortUrl del enlace.',
  })
  @ApiProduces('image/png', 'image/svg+xml')
  async qrCode(
    @CurrentKey() key: AuthenticatedKey,
    @Param('code') code: string,
    @Query() query: LinkQrQuery,
    @Res() res: Response,
  ) {
    const url = await this.links.shortUrlFor(key.id, code);
    const { body, contentType } = await this.qr.render({ data: url, ...query });
    res.type(contentType).send(body);
  }
}
