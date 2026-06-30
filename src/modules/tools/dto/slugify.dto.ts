import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class SlugifyDto {
  @ApiProperty({
    description: 'Texto a convertir en slug.',
    example: 'Canción del Ñandú: ¡Hola Mundo!',
  })
  @IsString()
  @MaxLength(500)
  text!: string;

  @ApiPropertyOptional({
    description: 'Separador entre palabras.',
    enum: ['-', '_'],
    default: '-',
  })
  @IsOptional()
  @IsIn(['-', '_'])
  separator: '-' | '_' = '-';
}
