import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MockUsersQuery } from './dto/mock-users.query';
import { ToolsService } from './tools.service';

@ApiTags('Toolbox')
@ApiBearerAuth()
@Controller({ path: 'mock', version: '1' })
export class MockController {
  constructor(private readonly tools: ToolsService) {}

  @Get('users')
  @ApiOperation({
    summary: 'Generar usuarios fake',
    description:
      'Datos de prueba realistas. Usa `seed` para resultados reproducibles.',
  })
  users(@Query() query: MockUsersQuery) {
    const data = this.tools.mockUsers(query.count, query.locale, query.seed);
    return { count: data.length, seed: query.seed ?? null, data };
  }
}
