import { Product } from '../../core/entities/product';
import { Money } from '../../core/value-objects/money.vo';
import { ProductOrmEntity } from '../persistence/orm-entities/product.orm-entity';

export function productToDomain(row: ProductOrmEntity): Product {
  return new Product(
    row.id,
    row.name,
    Money.of(Number(row.basePrice), row.currency),
    row.description ?? '',
    row.imageUrl ?? '',
    row.sagaId,
    row.volumeNumber,
  );
}

export function productToOrm(product: Product): ProductOrmEntity {
  const row = new ProductOrmEntity();
  row.id = product.id;
  row.name = product.name;
  row.basePrice = product.basePrice.amount;
  row.currency = product.basePrice.currency;
  row.description = product.description;
  row.imageUrl = product.imageUrl;
  row.sagaId = product.sagaId;
  row.volumeNumber = product.volumeNumber;
  return row;
}
