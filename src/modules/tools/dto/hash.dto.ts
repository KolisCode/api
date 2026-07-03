import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha512';
export type HashEncoding = 'hex' | 'base64';

export const HASH_ALGORITHMS: HashAlgorithm[] = [
  'md5',
  'sha1',
  'sha256',
  'sha512',
];
const HASH_ENCODINGS: HashEncoding[] = ['hex', 'base64'];

export class CreateHashDto {
  @ApiProperty({
    description: 'Texto a partir del cual generar el hash / HMAC.',
    example: 'Hola mundo',
  })
  @IsString()
  @MaxLength(10000)
  text!: string;

  @ApiPropertyOptional({
    description:
      'Algoritmos a calcular. Por defecto se calculan los cuatro soportados.',
    enum: HASH_ALGORITHMS,
    isArray: true,
    default: HASH_ALGORITHMS,
  })
  @IsOptional()
  @IsArray()
  @IsIn(HASH_ALGORITHMS, { each: true })
  algorithms: HashAlgorithm[] = HASH_ALGORITHMS;

  @ApiPropertyOptional({
    description: 'Codificación de salida de los digests.',
    enum: HASH_ENCODINGS,
    default: 'hex',
  })
  @IsOptional()
  @IsIn(HASH_ENCODINGS)
  encoding: HashEncoding = 'hex';

  @ApiPropertyOptional({
    description:
      'Clave secreta para calcular HMAC en vez de un hash plano. Si se ' +
      'omite, se calcula un hash normal sobre el texto.',
    example: 'clave-secreta',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  hmacKey?: string;
}
