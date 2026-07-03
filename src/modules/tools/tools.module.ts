import { Module } from '@nestjs/common';
import { ColorController } from './color.controller';
import { EncodeController } from './encode.controller';
import { HashController } from './hash.controller';
import { MockController } from './mock.controller';
import { TimeController } from './time.controller';
import { ToolsController } from './tools.controller';
import { ValidateController } from './validate.controller';
import { ColorService } from './color.service';
import { EncodeService } from './encode.service';
import { HashService } from './hash.service';
import { TimeService } from './time.service';
import { ToolsService } from './tools.service';

@Module({
  controllers: [
    ColorController,
    EncodeController,
    HashController,
    MockController,
    TimeController,
    ToolsController,
    ValidateController,
  ],
  providers: [
    ColorService,
    EncodeService,
    HashService,
    TimeService,
    ToolsService,
  ],
})
export class ToolsModule {}
