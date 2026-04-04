import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Promotion } from '../../core/entities/promotion';
import type { IProductRepository } from '../../core/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY } from '../../core/repositories/product.repository.interface';
import type { IPromotionRepository } from '../../core/repositories/promotion.repository.interface';
import { PROMOTION_REPOSITORY } from '../../core/repositories/promotion.repository.interface';
import {
  PricingEngineService,
  CartItem,
} from '../../core/services/pricing-engine.service';
import { CartRequestDto } from '../dtos/cart-request.dto';
import { PricedCartResponseDto } from '../dtos/priced-cart-response.dto';

@Injectable()
export class CalculateCartPriceUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
    private readonly pricingEngine: PricingEngineService,
  ) {}

  async execute(dto: CartRequestDto): Promise<PricedCartResponseDto> {
    // 1. Resolve all products referenced in the cart
    const cartItems: CartItem[] = await this.resolveCartItems(dto);

    // 2. Collect unique saga IDs and fetch their promotions
    const promotionMap = await this.resolvePromotions(cartItems);

    // 3. Delegate pure price calculation to the domain service
    const pricedCart = this.pricingEngine.calculate(cartItems, promotionMap);

    // 4. Map domain result → response DTO
    return {
      lines: pricedCart.lines.map((line) => ({
        productId: line.product.id,
        productName: line.product.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice.amount,
        lineTotal: line.lineTotal.amount,
        discountRate: line.discountRate,
        currency: line.lineTotal.currency,
      })),
      total: pricedCart.total.amount,
      currency: pricedCart.total.currency,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async resolveCartItems(dto: CartRequestDto): Promise<CartItem[]> {
    const items: CartItem[] = [];
    for (const requestItem of dto.items) {
      const product = await this.productRepository.findById(
        requestItem.productId,
      );
      if (!product) {
        throw new NotFoundException(
          `Product with id "${requestItem.productId}" not found`,
        );
      }
      items.push({ product, quantity: requestItem.quantity });
    }
    return items;
  }

  private async resolvePromotions(
    cartItems: CartItem[],
  ): Promise<Map<string, Promotion>> {
    const sagaIds = [
      ...new Set(
        cartItems
          .filter((i) => i.product.belongsToSaga())
          .map((i) => i.product.sagaId as string),
      ),
    ];

    const promotionMap = new Map<string, Promotion>();
    for (const sagaId of sagaIds) {
      const promotion = await this.promotionRepository.findBySagaId(sagaId);
      if (promotion) {
        promotionMap.set(sagaId, promotion);
      }
    }
    return promotionMap;
  }
}
