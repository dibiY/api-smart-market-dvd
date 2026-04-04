import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromotionOrmEntity } from '../persistence/orm-entities/promotion.orm-entity';
import { PromotionRuleOrmEntity } from '../persistence/orm-entities/promotion-rule.orm-entity';
import { ProductOrmEntity } from '../persistence/orm-entities/product.orm-entity';
import { SagaOrmEntity } from '../persistence/orm-entities/saga.orm-entity';

/**
 * Seeds reference data on application startup when tables are empty.
 * Safe to run repeatedly — checks for existing records first.
 */
@Injectable()
export class DatabaseSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    @InjectRepository(SagaOrmEntity)
    private readonly sagaRepo: Repository<SagaOrmEntity>,
    @InjectRepository(ProductOrmEntity)
    private readonly productRepo: Repository<ProductOrmEntity>,
    @InjectRepository(PromotionOrmEntity)
    private readonly promotionRepo: Repository<PromotionOrmEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedSagas();
    await this.seedProducts();
    await this.seedPromotions();
  }

  private async seedSagas(): Promise<void> {
    const count = await this.sagaRepo.count();
    if (count > 0) return;

    await this.sagaRepo.save({ id: 'star-wars', name: 'Star Wars' });
    this.logger.log('Sagas seeded');
  }

  private async seedProducts(): Promise<void> {
    const count = await this.productRepo.count();
    if (count > 0) return;

    await this.productRepo.save([
      {
        id: 'sw-vol-1',
        name: 'Star Wars - Vol. 1: A New Hope',
        basePrice: 15,
        currency: 'EUR',
        description: 'The saga begins.',
        imageUrl: '',
        sagaId: 'star-wars',
        volumeNumber: 1,
      },
      {
        id: 'sw-vol-2',
        name: 'Star Wars - Vol. 2: The Empire Strikes Back',
        basePrice: 15,
        currency: 'EUR',
        description: 'The Empire strikes back.',
        imageUrl: '',
        sagaId: 'star-wars',
        volumeNumber: 2,
      },
      {
        id: 'sw-vol-3',
        name: 'Star Wars - Vol. 3: Return of the Jedi',
        basePrice: 15,
        currency: 'EUR',
        description: 'The saga concludes.',
        imageUrl: '',
        sagaId: 'star-wars',
        volumeNumber: 3,
      },
      {
        id: 'matrix-dvd',
        name: 'The Matrix',
        basePrice: 20,
        currency: 'EUR',
        description: 'There is no spoon.',
        imageUrl: '',
        sagaId: null,
        volumeNumber: null,
      },
    ]);
    this.logger.log('Products seeded');
  }

  private async seedPromotions(): Promise<void> {
    const count = await this.promotionRepo.count();
    if (count > 0) return;

    const rules: Partial<PromotionRuleOrmEntity>[] = [
      { minQuantity: 1, discountRate: 0, promotionId: 'promo-star-wars' },
      { minQuantity: 2, discountRate: 10, promotionId: 'promo-star-wars' },
      { minQuantity: 3, discountRate: 20, promotionId: 'promo-star-wars' },
    ];

    await this.promotionRepo.save({
      id: 'promo-star-wars',
      name: 'Star Wars Saga Discount',
      sagaId: 'star-wars',
      rules,
    });
    this.logger.log('Promotions seeded');
  }
}
