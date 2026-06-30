import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, MaxLength } from 'class-validator';

export class ConvertUnitsQuery {
  @ApiProperty({ description: 'Valor a convertir.', example: 100 })
  @Type(() => Number)
  @IsNumber()
  value!: number;

  @ApiProperty({
    description:
      'Unidad origen. Categorías: length (m,km,cm,mm,mi,yd,ft,in,nmi), ' +
      'mass (g,kg,mg,t,lb,oz,st), volume (l,ml,m3,gal,qt,pt,cup,floz), ' +
      'area (m2,km2,cm2,ha,acre,ft2,mi2), speed (m/s,km/h,mph,kn,ft/s), ' +
      'time (s,ms,min,h,d,wk), data (B,KB,MB,GB,TB,bit,Kb,Mb,Gb), temperature (C,F,K).',
    example: 'km',
  })
  @IsString()
  @MaxLength(8)
  from!: string;

  @ApiProperty({
    description: 'Unidad destino (misma categoría que el origen).',
    example: 'mi',
  })
  @IsString()
  @MaxLength(8)
  to!: string;
}
