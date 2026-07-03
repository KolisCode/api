import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ColorQuery {
  @ApiProperty({
    description:
      'Color a convertir. Acepta hex (#fff, #ffffff, con o sin "#"), ' +
      'rgb(r, g, b) o hsl(h, s%, l%), con o sin espacios.',
    example: '#fbbf24',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  value!: string;
}
