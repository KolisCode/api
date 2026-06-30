import { Module } from '@nestjs/common';
import { QrModule } from '../qr/qr.module';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';
import { RedirectController } from './redirect.controller';

@Module({
  imports: [QrModule],
  controllers: [LinksController, RedirectController],
  providers: [LinksService],
})
export class LinksModule {}
