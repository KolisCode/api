import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class JwtDecodeDto {
  @ApiProperty({
    description:
      'Token JWT completo (header.payload.signature) a decodificar. ' +
      'Solo se decodifica, NO se verifica la firma.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOiIxMjM0NTY3ODkwIn0.' +
      'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  @IsString()
  @MaxLength(8192)
  token!: string;
}
