import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CalculateCartPriceUseCase } from '../../src/application/use-cases/calculate-cart-price.use-case';
import { GetProductsUseCase } from '../../src/application/use-cases/get-products.use-case';
import { Product } from '../../src/core/entities/product';
import { Promotion } from '../../src/core/entities/promotion';
import { PromotionRule } from '../../src/core/entities/promotion-rule';
import { PRODUCT_REPOSITORY } from '../../src/core/repositories/product.repository.interface';
import { PROMOTION_REPOSITORY } from '../../src/core/repositories/promotion.repository.interface';
import { SAGA_REPOSITORY } from '../../src/core/repositories/saga.repository.interface';
import { PricingEngineService } from '../../src/core/services/pricing-engine.service';
import { DiscountRate } from '../../src/core/value-objects/discount-rate.vo';
import { Money } from '../../src/core/value-objects/money.vo';
import { CartController } from '../../src/web-api/controllers/cart.controller';
import { ProductController } from '../../src/web-api/controllers/product.controller';

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

export const SEED_PRODUCTS: Product[] = [
  new Product(
    'bttf-1',
    'Back to the Future 1',
    Money.of(15),
    'Vol. 1',
    '',
    'bttf',
    1,
  ),
  new Product(
    'bttf-2',
    'Back to the Future 2',
    Money.of(15),
    'Vol. 2',
    '',
    'bttf',
    2,
  ),
  new Product(
    'bttf-3',
    'Back to the Future 3',
    Money.of(15),
    'Vol. 3',
    '',
    'bttf',
    3,
  ),
  new Product(
    'chevre',
    'La chèvre',
    Money.of(20),
    'Comédie française',
    '',
    null,
    null,
  ),
];

export const SEED_PROMOTIONS: Promotion[] = [
  new Promotion('promo-bttf', 'Back to the Future Discount', 'bttf', [
    new PromotionRule(1, DiscountRate.of(0)),
    new PromotionRule(2, DiscountRate.of(10)),
    new PromotionRule(3, DiscountRate.of(20)),
  ]),
];

// ---------------------------------------------------------------------------
// Build test application (no TypeORM, no DB)
// ---------------------------------------------------------------------------

export async function createTestApp(): Promise<INestApplication> {
  const productMap = new Map(SEED_PRODUCTS.map((p) => [p.id, p]));
  const promotionMap = new Map(SEED_PROMOTIONS.map((p) => [p.sagaId, p]));

  const mockProductRepo = {
    findAll: () => Promise.resolve(SEED_PRODUCTS),
    findById: (id: string) => Promise.resolve(productMap.get(id) ?? null),
    findBySagaId: (sagaId: string) =>
      Promise.resolve(SEED_PRODUCTS.filter((p) => p.sagaId === sagaId)),
    save: () => Promise.resolve(),
    delete: () => Promise.resolve(),
  };

  const mockPromotionRepo = {
    findAll: () => Promise.resolve(SEED_PROMOTIONS),
    findBySagaId: (sagaId: string) =>
      Promise.resolve(promotionMap.get(sagaId) ?? null),
    save: () => Promise.resolve(),
  };

  const mockSagaRepo = {
    findAll: () => Promise.resolve([]),
    findById: () => Promise.resolve(null),
    save: () => Promise.resolve(),
  };

  const moduleRef = await Test.createTestingModule({
    controllers: [ProductController, CartController],
    providers: [
      { provide: PRODUCT_REPOSITORY, useValue: mockProductRepo },
      { provide: PROMOTION_REPOSITORY, useValue: mockPromotionRepo },
      { provide: SAGA_REPOSITORY, useValue: mockSagaRepo },
      PricingEngineService,
      GetProductsUseCase,
      CalculateCartPriceUseCase,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();

  // Same global pipes as main.ts
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}
