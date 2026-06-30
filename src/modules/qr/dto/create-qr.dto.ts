import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsHexColor,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export type QrFormat = 'png' | 'svg';
export type QrEcLevel = 'L' | 'M' | 'Q' | 'H';

export class CreateQrDto {
  @ApiProperty({
    description: 'Texto o URL a codificar en el QR.',
    example: 'https://koliskit.dev',
  })
  @IsString()
  @MaxLength(2048)
  data!: string;

  @ApiPropertyOptional({
    description: 'Formato de salida.',
    enum: ['png', 'svg'],
    default: 'png',
  })
  @IsOptional()
  @IsIn(['png', 'svg'])
  format: QrFormat = 'png';

  @ApiPropertyOptional({
    description: 'Lado de la imagen en píxeles (solo PNG).',
    minimum: 64,
    maximum: 1024,
    default: 256,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(64)
  @Max(1024)
  size = 256;

  @ApiPropertyOptional({
    description: 'Margen (módulos) alrededor del QR.',
    minimum: 0,
    maximum: 10,
    default: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  margin = 2;

  @ApiPropertyOptional({
    description: 'Color de los módulos (hex).',
    default: '#000000',
  })
  @IsOptional()
  @IsHexColor()
  dark = '#000000';

  @ApiPropertyOptional({
    description: 'Color de fondo (hex).',
    default: '#FFFFFF',
  })
  @IsOptional()
  @IsHexColor()
  light = '#FFFFFF';

  @ApiPropertyOptional({
    description: 'Nivel de corrección de errores.',
    enum: ['L', 'M', 'Q', 'H'],
    default: 'M',
  })
  @IsOptional()
  @IsIn(['L', 'M', 'Q', 'H'])
  ecLevel: QrEcLevel = 'M';
}
