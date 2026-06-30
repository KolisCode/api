import { Module } from '@nestjs/common';
import { MockController } from './mock.controller';
import { ToolsController } from './tools.controller';
import { ValidateController } from './validate.controller';
import { ToolsService } from './tools.service';

@Module({
  controllers: [MockController, ToolsController, ValidateController],
  providers: [ToolsService],
})
export class ToolsModule {}
