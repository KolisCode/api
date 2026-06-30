import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Length } from 'class-validator';

export class ConvertCurrencyQuery {
  @ApiProperty({ description: 'Importe a convertir.', example: 100 })
  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @ApiProperty({
    description: 'Moneda origen (código ISO 4217).',
    example: 'USD',
  })
  @IsString()
  @Length(3, 3)
  from!: string;

  @ApiProperty({
    description: 'Moneda destino (código ISO 4217).',
    example: 'EUR',
  })
  @IsString()
  @Length(3, 3)
  to!: string;
}
