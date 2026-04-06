import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromotionOrmEntity } from '../persistence/orm-entities/promotion.orm-entity';
import { PromotionRuleOrmEntity } from '../persistence/orm-entities/promotion-rule.orm-entity';
import { ProductOrmEntity } from '../persistence/orm-entities/product.orm-entity';
import { SagaOrmEntity } from '../persistence/orm-entities/saga.orm-entity';

// ─────────────────────────────────────────────────────────────────────────────
// Seed catalogue
//
// Each entry is checked individually before insert so the seeder is fully
// idempotent: restarting the container never causes duplicate-key errors.
// ─────────────────────────────────────────────────────────────────────────────

const SAGAS: SagaOrmEntity[] = [
  { id: 'star-wars', name: 'Star Wars', products: [], promotions: [] },
  { id: 'bttf', name: 'Back to the Future', products: [], promotions: [] },
];

const PRODUCTS: Omit<ProductOrmEntity, 'saga'>[] = [
  // ── Star Wars ──────────────────────────────────────────────────────────────
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
  // ── Back to the Future ─────────────────────────────────────────────────────
  {
    id: 'bttf-1',
    name: 'Back to the Future 1',
    basePrice: 15,
    currency: 'EUR',
    description: 'Marty McFly travels back to 1955.',
    imageUrl: '',
    sagaId: 'bttf',
    volumeNumber: 1,
  },
  {
    id: 'bttf-2',
    name: 'Back to the Future 2',
    basePrice: 15,
    currency: 'EUR',
    description: 'The future is now — October 21, 2015.',
    imageUrl: '',
    sagaId: 'bttf',
    volumeNumber: 2,
  },
  {
    id: 'bttf-3',
    name: 'Back to the Future 3',
    basePrice: 15,
    currency: 'EUR',
    description: 'Back to the Wild West.',
    imageUrl: '',
    sagaId: 'bttf',
    volumeNumber: 3,
  },
  // ── Standalone ─────────────────────────────────────────────────────────────
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
  {
    id: 'la-chevre',
    name: 'La chèvre',
    basePrice: 20,
    currency: 'EUR',
    description: 'Comédie française de Francis Veber (1981).',
    imageUrl: '',
    sagaId: null,
    volumeNumber: null,
  },
];

// Promotions are defined as { entity, rules } pairs so cascade insert works
// cleanly. Rules reference the promotion ID before the promotion is persisted:
// TypeORM resolves the FK because we pass them as nested objects.
const PROMOTIONS: Array<{
  entity: Omit<PromotionOrmEntity, 'saga' | 'rules'>;
  rules: Array<Pick<PromotionRuleOrmEntity, 'minQuantity' | 'discountRate'>>;
}> = [
  {
    entity: {
      id: 'promo-star-wars',
      name: 'Star Wars Saga Discount',
      sagaId: 'star-wars',
    },
    rules: [
      { minQuantity: 1, discountRate: 0 },
      { minQuantity: 2, discountRate: 10 },
      { minQuantity: 3, discountRate: 20 },
    ],
  },
  {
    entity: {
      id: 'promo-bttf',
      name: 'Back to the Future Saga Discount',
      sagaId: 'bttf',
    },
    // Palier 1: 2 volumes différents → 10 %
    // Palier 2: 3 volumes différents → 20 %
    // (minQuantity: 1 → 0 % garantit que 1 seul film n'est pas remisé)
    rules: [
      { minQuantity: 1, discountRate: 0 },
      { minQuantity: 2, discountRate: 10 },
      { minQuantity: 3, discountRate: 20 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seeds reference data on application startup.
 *
 * Idempotency: each record is checked individually by primary key before
 * insert. Restarting the container or running in dev mode never causes
 * duplicate-key errors, regardless of how many times the seeder runs.
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
    let inserted = 0;
    for (const saga of SAGAS) {
      const exists = await this.sagaRepo.existsBy({ id: saga.id });
      if (!exists) {
        await this.sagaRepo.save({ id: saga.id, name: saga.name });
        inserted++;
      }
    }
    if (inserted > 0) this.logger.log(`Sagas seeded (${inserted} inserted)`);
  }

  private async seedProducts(): Promise<void> {
    let inserted = 0;
    for (const product of PRODUCTS) {
      const exists = await this.productRepo.existsBy({ id: product.id });
      if (!exists) {
        await this.productRepo.save(product);
        inserted++;
      }
    }
    if (inserted > 0) this.logger.log(`Products seeded (${inserted} inserted)`);
  }

  private async seedPromotions(): Promise<void> {
    let inserted = 0;
    for (const { entity, rules } of PROMOTIONS) {
      const exists = await this.promotionRepo.existsBy({ id: entity.id });
      if (!exists) {
        await this.promotionRepo.save({
          ...entity,
          rules: rules.map((r) => ({ ...r, promotionId: entity.id })),
        });
        inserted++;
      }
    }
    if (inserted > 0)
      this.logger.log(`Promotions seeded (${inserted} inserted)`);
  }
}
