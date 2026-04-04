import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ProductOrmEntity } from '../../src/infrastructure/persistence/orm-entities/product.orm-entity';
import { PromotionOrmEntity } from '../../src/infrastructure/persistence/orm-entities/promotion.orm-entity';
import { PromotionRuleOrmEntity } from '../../src/infrastructure/persistence/orm-entities/promotion-rule.orm-entity';
import { SagaOrmEntity } from '../../src/infrastructure/persistence/orm-entities/saga.orm-entity';
import { DatabaseSeeder } from '../../src/infrastructure/seeder/database.seeder';
import { MarketModule } from '../../src/web-api/modules/market.module';

// ---------------------------------------------------------------------------
// Seed data (plain DB rows — matches test expectations)
// ---------------------------------------------------------------------------

export const E2E_SAGA = { id: 'bttf', name: 'Back to the Future' };

export const E2E_PRODUCTS = [
  {
    id: 'bttf-1',
    name: 'Back to the Future 1',
    basePrice: 15,
    currency: 'EUR',
    description: 'Vol. 1',
    imageUrl: '',
    sagaId: 'bttf',
    volumeNumber: 1,
  },
  {
    id: 'bttf-2',
    name: 'Back to the Future 2',
    basePrice: 15,
    currency: 'EUR',
    description: 'Vol. 2',
    imageUrl: '',
    sagaId: 'bttf',
    volumeNumber: 2,
  },
  {
    id: 'bttf-3',
    name: 'Back to the Future 3',
    basePrice: 15,
    currency: 'EUR',
    description: 'Vol. 3',
    imageUrl: '',
    sagaId: 'bttf',
    volumeNumber: 3,
  },
  {
    id: 'chevre',
    name: 'La chèvre',
    basePrice: 20,
    currency: 'EUR',
    description: 'Comédie française',
    imageUrl: '',
    sagaId: null,
    volumeNumber: null,
  },
];

export const E2E_PROMOTION = {
  id: 'promo-bttf',
  name: 'Back to the Future Discount',
  sagaId: 'bttf',
  rules: [
    { minQuantity: 1, discountRate: 0, promotionId: 'promo-bttf' },
    { minQuantity: 2, discountRate: 10, promotionId: 'promo-bttf' },
    { minQuantity: 3, discountRate: 20, promotionId: 'promo-bttf' },
  ],
};

/** Number of products in the test dataset (used for array-length assertions). */
export const E2E_PRODUCT_COUNT = E2E_PRODUCTS.length;

/**
 * Seeds the in-memory SQLite database with E2E test data.
 * Call this in `beforeAll` after `createTestApp`.
 */
export async function seedDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.getRepository(SagaOrmEntity).save(E2E_SAGA);
  await dataSource.getRepository(ProductOrmEntity).save(E2E_PRODUCTS);
  await dataSource.getRepository(PromotionOrmEntity).save(E2E_PROMOTION);
}

// ---------------------------------------------------------------------------
// Build test application (real TypeORM, SQLite in-memory)
// ---------------------------------------------------------------------------

export interface TestApp {
  app: INestApplication;
  dataSource: DataSource;
}

/**
 * Creates a NestJS test application backed by a fresh SQLite in-memory
 * database. Uses the real `MarketModule` (TypeORM repositories, pricing
 * engine, controllers) but bypasses the `DatabaseSeeder` so each test suite
 * controls its own seed data via `seedDatabase()`.
 */
export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: ':memory:',
        synchronize: true,
        dropSchema: true,
        entities: [
          SagaOrmEntity,
          ProductOrmEntity,
          PromotionOrmEntity,
          PromotionRuleOrmEntity,
        ],
        logging: false,
      }),
      MarketModule,
    ],
  })
    // Prevent the production seeder from running during tests
    .overrideProvider(DatabaseSeeder)
    .useValue({ onApplicationBootstrap: async (): Promise<void> => {} })
    .compile();

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

  const dataSource = moduleRef.get(DataSource);
  return { app, dataSource };
}
