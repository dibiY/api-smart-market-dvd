import { NotFoundException } from '@nestjs/common';
import { CalculateCartPriceUseCase } from './calculate-cart-price.use-case';
import type { IProductRepository } from '../../core/repositories/product.repository.interface';
import type { IPromotionRepository } from '../../core/repositories/promotion.repository.interface';
import { PricingEngineService } from '../../core/services/pricing-engine.service';
import { Product } from '../../core/entities/product';
import { Promotion } from '../../core/entities/promotion';
import { PromotionRule } from '../../core/entities/promotion-rule';
import { Money } from '../../core/value-objects/money.vo';
import { DiscountRate } from '../../core/value-objects/discount-rate.vo';
import { CartItemRequestDto, CartRequestDto } from '../dtos/cart-request.dto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProduct(
  id: string,
  price: number,
  sagaId: string | null = null,
  volumeNumber: number | null = null,
): Product {
  return new Product(
    id,
    `Product ${id}`,
    Money.of(price),
    '',
    '',
    sagaId,
    volumeNumber,
  );
}

function makeBttfPromotion(): Promotion {
  return new Promotion('promo-bttf', 'Buy saga discount', 'bttf', [
    new PromotionRule(1, DiscountRate.of(0)),
    new PromotionRule(2, DiscountRate.of(10)),
    new PromotionRule(3, DiscountRate.of(20)),
  ]);
}

function makeProductRepo(
  map: Record<string, Product | null>,
): jest.Mocked<IProductRepository> {
  return {
    findAll: jest.fn(),
    findById: jest
      .fn()
      .mockImplementation((id: string) => Promise.resolve(map[id] ?? null)),
    findBySagaId: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

function makePromotionRepo(
  map: Record<string, Promotion | null> = {},
): jest.Mocked<IPromotionRepository> {
  return {
    findAll: jest.fn(),
    findBySagaId: jest
      .fn()
      .mockImplementation((sagaId: string) =>
        Promise.resolve(map[sagaId] ?? null),
      ),
    save: jest.fn(),
  };
}

function makeCartDto(
  ...items: { productId: string; quantity: number }[]
): CartRequestDto {
  const dto = new CartRequestDto();
  dto.items = items as CartItemRequestDto[];
  return dto;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CalculateCartPriceUseCase', () => {
  const vol1 = makeProduct('bttf-1', 15, 'bttf', 1);
  const vol2 = makeProduct('bttf-2', 15, 'bttf', 2);
  const vol3 = makeProduct('bttf-3', 15, 'bttf', 3);
  const chevre = makeProduct('chevre', 20);

  // ─── Error handling ─────────────────────────────────────────────────────

  describe('error handling', () => {
    it('throws NotFoundException when a product id does not exist', async () => {
      const productRepo = makeProductRepo({ 'bttf-1': null });
      const promotionRepo = makePromotionRepo();
      const engine = new PricingEngineService();
      const useCase = new CalculateCartPriceUseCase(
        productRepo,
        promotionRepo,
        engine,
      );

      await expect(
        useCase.execute(makeCartDto({ productId: 'bttf-1', quantity: 1 })),
      ).rejects.toThrow(NotFoundException);
    });

    it('includes the missing product id in the error message', async () => {
      const productRepo = makeProductRepo({ unknown: null });
      const promotionRepo = makePromotionRepo();
      const engine = new PricingEngineService();
      const useCase = new CalculateCartPriceUseCase(
        productRepo,
        promotionRepo,
        engine,
      );

      await expect(
        useCase.execute(makeCartDto({ productId: 'unknown', quantity: 1 })),
      ).rejects.toThrow('"unknown"');
    });
  });

  // ─── DTO mapping ─────────────────────────────────────────────────────────

  describe('response DTO mapping', () => {
    it('maps a single standalone product at full price', async () => {
      const productRepo = makeProductRepo({ chevre });
      const promotionRepo = makePromotionRepo();
      const engine = new PricingEngineService();
      const useCase = new CalculateCartPriceUseCase(
        productRepo,
        promotionRepo,
        engine,
      );

      const result = await useCase.execute(
        makeCartDto({ productId: 'chevre', quantity: 1 }),
      );

      expect(result.total).toBe(20);
      expect(result.currency).toBe('EUR');
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0]).toMatchObject({
        productId: 'chevre',
        quantity: 1,
        unitPrice: 20,
        lineTotal: 20,
        discountRate: 0,
        currency: 'EUR',
      });
    });

    it('maps productName from the product entity', async () => {
      const productRepo = makeProductRepo({ chevre });
      const promotionRepo = makePromotionRepo();
      const engine = new PricingEngineService();
      const useCase = new CalculateCartPriceUseCase(
        productRepo,
        promotionRepo,
        engine,
      );

      const result = await useCase.execute(
        makeCartDto({ productId: 'chevre', quantity: 1 }),
      );

      expect(result.lines[0].productName).toBe('Product chevre');
    });
  });

  // ─── Promotion resolution ─────────────────────────────────────────────────

  describe('promotion resolution', () => {
    it('does not call promotionRepo for standalone products', async () => {
      const productRepo = makeProductRepo({ chevre });
      const promotionRepo = makePromotionRepo();
      const engine = new PricingEngineService();
      const useCase = new CalculateCartPriceUseCase(
        productRepo,
        promotionRepo,
        engine,
      );

      await useCase.execute(makeCartDto({ productId: 'chevre', quantity: 1 }));

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const { findBySagaId } = promotionRepo;
      expect(findBySagaId).not.toHaveBeenCalled();
    });

    it('calls promotionRepo once per unique sagaId', async () => {
      const productRepo = makeProductRepo({ 'bttf-1': vol1, 'bttf-2': vol2 });
      const promotionRepo = makePromotionRepo({ bttf: makeBttfPromotion() });
      const engine = new PricingEngineService();
      const useCase = new CalculateCartPriceUseCase(
        productRepo,
        promotionRepo,
        engine,
      );

      await useCase.execute(
        makeCartDto(
          { productId: 'bttf-1', quantity: 1 },
          { productId: 'bttf-2', quantity: 1 },
        ),
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const { findBySagaId } = promotionRepo;
      expect(findBySagaId).toHaveBeenCalledTimes(1);
      expect(findBySagaId).toHaveBeenCalledWith('bttf');
    });
  });

  // ─── Business examples (end-to-end through domain) ───────────────────────

  describe('business examples', () => {
    /**
     * Example 1: 3 saga volumes -> 20% discount -> total 36 EUR
     */
    it('example 1 — 3 saga items -> 20% -> 36 EUR', async () => {
      const productRepo = makeProductRepo({
        'bttf-1': vol1,
        'bttf-2': vol2,
        'bttf-3': vol3,
      });
      const promotionRepo = makePromotionRepo({ bttf: makeBttfPromotion() });
      const engine = new PricingEngineService();
      const useCase = new CalculateCartPriceUseCase(
        productRepo,
        promotionRepo,
        engine,
      );

      const result = await useCase.execute(
        makeCartDto(
          { productId: 'bttf-1', quantity: 1 },
          { productId: 'bttf-2', quantity: 1 },
          { productId: 'bttf-3', quantity: 1 },
        ),
      );

      expect(result.total).toBe(36);
      result.lines.forEach((l) => expect(l.discountRate).toBe(20));
    });

    /**
     * Example 2: 2 saga volumes -> 10% discount -> total 27 EUR
     */
    it('example 2 — 2 saga items -> 10% -> 27 EUR', async () => {
      const productRepo = makeProductRepo({ 'bttf-1': vol1, 'bttf-3': vol3 });
      const promotionRepo = makePromotionRepo({ bttf: makeBttfPromotion() });
      const engine = new PricingEngineService();
      const useCase = new CalculateCartPriceUseCase(
        productRepo,
        promotionRepo,
        engine,
      );

      const result = await useCase.execute(
        makeCartDto(
          { productId: 'bttf-1', quantity: 1 },
          { productId: 'bttf-3', quantity: 1 },
        ),
      );

      expect(result.total).toBe(27);
    });

    /**
     * Example 5: 3 saga volumes + 1 standalone -> total 56 EUR
     */
    it('example 5 — 3 saga items + standalone -> 56 EUR', async () => {
      const productRepo = makeProductRepo({
        'bttf-1': vol1,
        'bttf-2': vol2,
        'bttf-3': vol3,
        chevre,
      });
      const promotionRepo = makePromotionRepo({ bttf: makeBttfPromotion() });
      const engine = new PricingEngineService();
      const useCase = new CalculateCartPriceUseCase(
        productRepo,
        promotionRepo,
        engine,
      );

      const result = await useCase.execute(
        makeCartDto(
          { productId: 'bttf-1', quantity: 1 },
          { productId: 'bttf-2', quantity: 1 },
          { productId: 'bttf-3', quantity: 1 },
          { productId: 'chevre', quantity: 1 },
        ),
      );

      expect(result.total).toBe(56);
    });

    it('applies no discount when saga has no promotion in the repository', async () => {
      const productRepo = makeProductRepo({ 'bttf-1': vol1, 'bttf-2': vol2 });
      const promotionRepo = makePromotionRepo({ bttf: null });
      const engine = new PricingEngineService();
      const useCase = new CalculateCartPriceUseCase(
        productRepo,
        promotionRepo,
        engine,
      );

      const result = await useCase.execute(
        makeCartDto(
          { productId: 'bttf-1', quantity: 1 },
          { productId: 'bttf-2', quantity: 1 },
        ),
      );

      expect(result.total).toBe(30);
      result.lines.forEach((l) => expect(l.discountRate).toBe(0));
    });
  });
});
