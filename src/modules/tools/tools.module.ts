import { Module } from '@nestjs/common';
import { EncodeController } from './encode.controller';
import { HashController } from './hash.controller';
import { MockController } from './mock.controller';
import { TimeController } from './time.controller';
import { ToolsController } from './tools.controller';
import { ValidateController } from './validate.controller';
import { EncodeService } from './encode.service';
import { HashService } from './hash.service';
import { TimeService } from './time.service';
import { ToolsService } from './tools.service';

@Module({
  controllers: [
    EncodeController,
    HashController,
    MockController,
    TimeController,
    ToolsController,
    ValidateController,
  ],
  providers: [EncodeService, HashService, TimeService, ToolsService],
})
export class ToolsModule {}
