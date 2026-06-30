import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreditCardDto } from './dto/credit-card.dto';
import { ToolsService } from './tools.service';

@ApiTags('Toolbox')
@ApiBearerAuth()
@Controller({ path: 'validate', version: '1' })
export class ValidateController {
  constructor(private readonly tools: ToolsService) {}

  @Post('credit-card')
  @ApiOperation({
    summary: 'Validar tarjeta (Luhn) y detectar marca',
    description:
      'Comprueba el número con el algoritmo de Luhn e identifica la marca ' +
      '(visa, mastercard, amex, discover, diners, jcb).',
  })
  creditCard(@Body() dto: CreditCardDto) {
    return this.tools.validateCreditCard(dto.number);
  }
}
