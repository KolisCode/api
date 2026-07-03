import { Module } from '@nestjs/common';
import { HashController } from './hash.controller';
import { MockController } from './mock.controller';
import { ToolsController } from './tools.controller';
import { ValidateController } from './validate.controller';
import { HashService } from './hash.service';
import { ToolsService } from './tools.service';

@Module({
  controllers: [
    HashController,
    MockController,
    ToolsController,
    ValidateController,
  ],
  providers: [HashService, ToolsService],
})
export class ToolsModule {}
