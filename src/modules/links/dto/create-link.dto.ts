import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateLinkDto {
  @ApiProperty({
    description: 'URL de destino a la que apuntará el enlace corto.',
    example: 'https://docs.koliskit.dev/getting-started',
  })
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  targetUrl!: string;

  @ApiPropertyOptional({
    description:
      'Código personalizado (3-32 caracteres alfanuméricos, "-" o "_"). ' +
      'Si se omite, se genera uno automáticamente.',
    example: 'mi-enlace',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{3,32}$/, {
    message:
      'code debe tener 3-32 caracteres alfanuméricos, guiones o guiones bajos.',
  })
  code?: string;

  @ApiPropertyOptional({
    description: 'Fecha de expiración en formato ISO 8601 (opcional).',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
