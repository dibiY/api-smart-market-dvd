import { Product } from '../../core/entities/product';
import { Money } from '../../core/value-objects/money.vo';
import { ProductOrmEntity } from '../persistence/orm-entities/product.orm-entity';
import { productToDomain, productToOrm } from './product.mapper';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOrmRow(overrides: Partial<ProductOrmEntity> = {}): ProductOrmEntity {
  const row = new ProductOrmEntity();
  row.id = 'bttf-1';
  row.name = 'Back to the Future 1';
  row.basePrice = 15;
  row.currency = 'EUR';
  row.description = 'The original.';
  row.imageUrl = 'http://img.test/bttf-1.jpg';
  row.sagaId = 'bttf';
  row.volumeNumber = 1;
  row.saga = null;
  return Object.assign(row, overrides);
}

function makeDomainProduct(overrides: Partial<ConstructorParameters<typeof Product>[number]> = {}): Product {
  return new Product(
    'bttf-1',
    'Back to the Future 1',
    Money.of(15, 'EUR'),
    'The original.',
    'http://img.test/bttf-1.jpg',
    'bttf',
    1,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('productToDomain', () => {
  it('maps all scalar fields correctly', () => {
    const row = makeOrmRow();
    const product = productToDomain(row);

    expect(product.id).toBe('bttf-1');
    expect(product.name).toBe('Back to the Future 1');
    expect(product.description).toBe('The original.');
    expect(product.imageUrl).toBe('http://img.test/bttf-1.jpg');
    expect(product.sagaId).toBe('bttf');
    expect(product.volumeNumber).toBe(1);
  });

  it('maps basePrice as a Money value object with correct amount and currency', () => {
    const row = makeOrmRow({ basePrice: 19.99, currency: 'EUR' });
    const product = productToDomain(row);

    expect(product.basePrice.amount).toBe(19.99);
    expect(product.basePrice.currency).toBe('EUR');
  });

  it('converts decimal string basePrice to a number', () => {
    const row = makeOrmRow();
    // TypeORM returns DECIMAL columns as strings from MySQL
    (row as any).basePrice = '15.00';
    const product = productToDomain(row);

    expect(product.basePrice.amount).toBe(15);
  });

  it('falls back to empty string when description is null', () => {
    const row = makeOrmRow({ description: null });
    const product = productToDomain(row);

    expect(product.description).toBe('');
  });

  it('falls back to empty string when imageUrl is null', () => {
    const row = makeOrmRow({ imageUrl: null });
    const product = productToDomain(row);

    expect(product.imageUrl).toBe('');
  });

  it('maps standalone product with null sagaId and volumeNumber', () => {
    const row = makeOrmRow({ sagaId: null, volumeNumber: null });
    const product = productToDomain(row);

    expect(product.sagaId).toBeNull();
    expect(product.volumeNumber).toBeNull();
    expect(product.belongsToSaga()).toBe(false);
  });

  it('returns a Product instance', () => {
    expect(productToDomain(makeOrmRow())).toBeInstanceOf(Product);
  });
});

describe('productToOrm', () => {
  it('maps all scalar fields correctly', () => {
    const product = makeDomainProduct();
    const row = productToOrm(product);

    expect(row.id).toBe('bttf-1');
    expect(row.name).toBe('Back to the Future 1');
    expect(row.description).toBe('The original.');
    expect(row.imageUrl).toBe('http://img.test/bttf-1.jpg');
    expect(row.sagaId).toBe('bttf');
    expect(row.volumeNumber).toBe(1);
  });

  it('maps basePrice as the numeric amount', () => {
    const product = makeDomainProduct();
    const row = productToOrm(product);

    expect(row.basePrice).toBe(15);
  });

  it('maps currency from the Money value object', () => {
    const product = makeDomainProduct();
    const row = productToOrm(product);

    expect(row.currency).toBe('EUR');
  });

  it('maps a standalone product with null sagaId and volumeNumber', () => {
    const product = new Product('chevre', 'La chèvre', Money.of(20), '', '', null, null);
    const row = productToOrm(product);

    expect(row.sagaId).toBeNull();
    expect(row.volumeNumber).toBeNull();
  });

  it('returns a ProductOrmEntity instance', () => {
    expect(productToOrm(makeDomainProduct())).toBeInstanceOf(ProductOrmEntity);
  });

  it('is the inverse of productToDomain for a round-trip', () => {
    const original = makeOrmRow();
    const roundTrip = productToOrm(productToDomain(original));

    expect(roundTrip.id).toBe(original.id);
    expect(roundTrip.name).toBe(original.name);
    expect(Number(roundTrip.basePrice)).toBe(Number(original.basePrice));
    expect(roundTrip.currency).toBe(original.currency);
    expect(roundTrip.sagaId).toBe(original.sagaId);
    expect(roundTrip.volumeNumber).toBe(original.volumeNumber);
  });
});
