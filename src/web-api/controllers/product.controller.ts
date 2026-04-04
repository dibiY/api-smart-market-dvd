import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductResponseDto } from '../../application/dtos/product-response.dto';
import { GetProductsUseCase } from '../../application/use-cases/get-products.use-case';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly getProducts: GetProductsUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Get all products',
    description: 'Returns the full DVD catalogue.',
  })
  @ApiOkResponse({ type: [ProductResponseDto] })
  getAll(): Promise<ProductResponseDto[]> {
    return this.getProducts.execute();
  }
}
