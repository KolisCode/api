import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreditCardDto {
  @ApiProperty({
    description: 'Número de tarjeta (se aceptan espacios y guiones).',
    example: '4242 4242 4242 4242',
  })
  @IsString()
  @MaxLength(40)
  number!: string;
}
