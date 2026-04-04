import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CartRequestDto } from '../../application/dtos/cart-request.dto';
import { PricedCartResponseDto } from '../../application/dtos/priced-cart-response.dto';
import { CalculateCartPriceUseCase } from '../../application/use-cases/calculate-cart-price.use-case';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly calculateCartPrice: CalculateCartPriceUseCase) {}

  @Post('price')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate cart price',
    description:
      'Returns the final price of each line and the cart total.\n\n' +
      'Promotions are applied automatically based on the number of distinct ' +
      'saga volumes present in the cart.',
  })
  @ApiOkResponse({ type: PricedCartResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation error (missing fields, quantity < 1…)',
  })
  @ApiNotFoundResponse({
    description: 'One of the requested products does not exist',
  })
  calculatePrice(@Body() dto: CartRequestDto): Promise<PricedCartResponseDto> {
    return this.calculateCartPrice.execute(dto);
  }
}
