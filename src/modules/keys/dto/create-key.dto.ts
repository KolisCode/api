import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateKeyDto {
  @ApiProperty({
    description: 'Nombre descriptivo para identificar la API key.',
    example: 'Mi app de prueba',
    minLength: 2,
    maxLength: 60,
  })
  @IsString()
  @Length(2, 60)
  name!: string;
}
