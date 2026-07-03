import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TimestampQuery {
  @ApiProperty({
    description:
      'Valor a convertir: epoch en segundos, epoch en milisegundos, fecha ' +
      'ISO 8601, o el literal "now".',
    example: '1700003600',
  })
  @IsString()
  @IsNotEmpty()
  value!: string;

  @ApiPropertyOptional({
    description:
      'Timezone IANA para formatear el resultado en hora local (ej. ' +
      '"America/Bogota"). Sin ella, `local` queda en null.',
    example: 'America/Bogota',
  })
  @IsOptional()
  @IsString()
  tz?: string;
}
