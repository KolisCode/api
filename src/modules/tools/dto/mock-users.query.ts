import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import type { SupportedLocale } from '../tools.service';

export class MockUsersQuery {
  @ApiPropertyOptional({
    description: 'Cantidad de usuarios a generar (1-100).',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  count = 10;

  @ApiPropertyOptional({
    description: 'Locale de los datos.',
    enum: ['en', 'es'],
    default: 'en',
  })
  @IsOptional()
  @IsIn(['en', 'es'])
  locale: SupportedLocale = 'en';

  @ApiPropertyOptional({
    description:
      'Semilla para resultados reproducibles (mismo seed → mismos datos).',
    example: 42,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seed?: number;
}
