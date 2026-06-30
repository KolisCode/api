import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../../common/auth/public.decorator';
import { buildClickContext } from './click-context.util';
import { LinksService } from './links.service';

/** Redirect público: `GET /r/:code` → 302 al destino. */
@ApiExcludeController()
@Controller({ path: 'r', version: VERSION_NEUTRAL })
export class RedirectController {
  constructor(private readonly links: LinksService) {}

  @Public()
  @Get(':code')
  async redirect(
    @Param('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const target = await this.links.resolveAndTrack(
      code,
      buildClickContext(req),
    );
    res.redirect(302, target);
  }
}
