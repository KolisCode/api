import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsHexColor,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import type { QrEcLevel, QrFormat } from '../../qr/dto/create-qr.dto';

/** Opciones del QR de un enlace (el contenido es el shortUrl). */
export class LinkQrQuery {
  @ApiPropertyOptional({ enum: ['png', 'svg'], default: 'png' })
  @IsOptional()
  @IsIn(['png', 'svg'])
  format: QrFormat = 'png';

  @ApiPropertyOptional({ minimum: 64, maximum: 1024, default: 256 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(64)
  @Max(1024)
  size = 256;

  @ApiPropertyOptional({ minimum: 0, maximum: 10, default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  margin = 2;

  @ApiPropertyOptional({ default: '#000000' })
  @IsOptional()
  @IsHexColor()
  dark = '#000000';

  @ApiPropertyOptional({ default: '#FFFFFF' })
  @IsOptional()
  @IsHexColor()
  light = '#FFFFFF';

  @ApiPropertyOptional({ enum: ['L', 'M', 'Q', 'H'], default: 'M' })
  @IsOptional()
  @IsIn(['L', 'M', 'Q', 'H'])
  ecLevel: QrEcLevel = 'M';
}
