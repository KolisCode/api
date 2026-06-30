import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

/** Convierte 'true'/'false' de la query string en booleano real. */
const toBool = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value === 'true' : Boolean(value);

export class PasswordQuery {
  @ApiPropertyOptional({
    description: 'Longitud de cada contraseña.',
    default: 16,
    minimum: 8,
    maximum: 128,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(8)
  @Max(128)
  length = 16;

  @ApiPropertyOptional({
    description: 'Incluir mayúsculas (A-Z).',
    default: true,
  })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  uppercase = true;

  @ApiPropertyOptional({
    description: 'Incluir minúsculas (a-z).',
    default: true,
  })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  lowercase = true;

  @ApiPropertyOptional({ description: 'Incluir números (0-9).', default: true })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  numbers = true;

  @ApiPropertyOptional({
    description: 'Incluir símbolos (!@#$…).',
    default: true,
  })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  symbols = true;

  @ApiPropertyOptional({
    description: 'Excluir caracteres confundibles (i, l, 1, L, o, 0, O).',
    default: false,
  })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  excludeSimilar = false;

  @ApiPropertyOptional({
    description: 'Cantidad de contraseñas a generar.',
    default: 1,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  count = 1;
}
