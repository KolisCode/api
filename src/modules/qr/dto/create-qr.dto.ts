import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { QrOptionsDto } from './qr-options.dto';

export type { QrEcLevel, QrFormat } from './qr-options.dto';

export class CreateQrDto extends QrOptionsDto {
  @ApiProperty({
    description: 'Texto o URL a codificar en el QR.',
    example: 'https://koliskit.dev',
  })
  @IsString()
  @MaxLength(2048)
  data!: string;
}
