import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export type Base64Action = 'encode' | 'decode';

const BASE64_ACTIONS: Base64Action[] = ['encode', 'decode'];

export class Base64Dto {
  @ApiProperty({
    description:
      'Texto a codificar (UTF-8) o cadena base64 a decodificar, según `action`.',
    example: 'Hola mundo',
  })
  @IsString()
  @MaxLength(10000)
  text!: string;

  @ApiProperty({
    description: 'Operación a realizar sobre `text`.',
    enum: BASE64_ACTIONS,
    example: 'encode',
  })
  @IsIn(BASE64_ACTIONS)
  action!: Base64Action;

  @ApiPropertyOptional({
    description:
      'Usa el alfabeto base64url (`-`/`_`, sin padding) en vez del estándar ' +
      '(`+`/`/`, con padding `=`). En `decode` se acepta cualquiera de las ' +
      'dos variantes independientemente de este flag.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  urlSafe: boolean = false;
}
