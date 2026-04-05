import { Inject, Injectable } from '@nestjs/common';
import type { IProductRepository } from '../../core/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY } from '../../core/repositories/product.repository.interface';
import { ProductResponseDto } from '../dtos/product-response.dto';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.findAll();
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.basePrice.amount,
      currency: product.basePrice.currency,
      description: product.description,
      imageUrl: product.imageUrl,
      sagaId: product.sagaId,
      sagaName: product.sagaName,
      volumeNumber: product.volumeNumber,
    }));
  }
}
