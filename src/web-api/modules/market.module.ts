import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalculateCartPriceUseCase } from '../../application/use-cases/calculate-cart-price.use-case';
import { GetProductsUseCase } from '../../application/use-cases/get-products.use-case';
import { PRODUCT_REPOSITORY } from '../../core/repositories/product.repository.interface';
import { PROMOTION_REPOSITORY } from '../../core/repositories/promotion.repository.interface';
import { SAGA_REPOSITORY } from '../../core/repositories/saga.repository.interface';
import { PricingEngineService } from '../../core/services/pricing-engine.service';
import { ProductOrmEntity } from '../../infrastructure/persistence/orm-entities/product.orm-entity';
import { PromotionOrmEntity } from '../../infrastructure/persistence/orm-entities/promotion.orm-entity';
import { PromotionRuleOrmEntity } from '../../infrastructure/persistence/orm-entities/promotion-rule.orm-entity';
import { SagaOrmEntity } from '../../infrastructure/persistence/orm-entities/saga.orm-entity';
import { TypeOrmProductRepository } from '../../infrastructure/persistence/typeorm-product.repository';
import { TypeOrmPromotionRepository } from '../../infrastructure/persistence/typeorm-promotion.repository';
import { TypeOrmSagaRepository } from '../../infrastructure/persistence/typeorm-saga.repository';
import { DatabaseSeeder } from '../../infrastructure/seeder/database.seeder';
import { CartController } from '../controllers/cart.controller';
import { ProductController } from '../controllers/product.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SagaOrmEntity,
      ProductOrmEntity,
      PromotionOrmEntity,
      PromotionRuleOrmEntity,
    ]),
  ],
  controllers: [CartController, ProductController],
  providers: [
    // --- Infrastructure bindings ---
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
    { provide: PROMOTION_REPOSITORY, useClass: TypeOrmPromotionRepository },
    { provide: SAGA_REPOSITORY, useClass: TypeOrmSagaRepository },

    // --- Domain service ---
    PricingEngineService,

    // --- Application use cases ---
    CalculateCartPriceUseCase,
    GetProductsUseCase,

    // --- Seeder ---
    DatabaseSeeder,
  ],
})
export class MarketModule {}
