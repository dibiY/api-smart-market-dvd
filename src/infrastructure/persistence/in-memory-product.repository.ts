import { Injectable } from '@nestjs/common';
import { Product } from '../../core/entities/product';
import type { IProductRepository } from '../../core/repositories/product.repository.interface';
import { Money } from '../../core/value-objects/money.vo';

@Injectable()
export class InMemoryProductRepository implements IProductRepository {
  private readonly store = new Map<string, Product>([
    // --- Star Wars saga (3 volumes) ---
    [
      'sw-vol-1',
      new Product(
        'sw-vol-1',
        'Star Wars - Vol. 1: A New Hope',
        Money.of(20),
        'The saga begins.',
        '',
        'star-wars',
        1,
      ),
    ],
    [
      'sw-vol-2',
      new Product(
        'sw-vol-2',
        'Star Wars - Vol. 2: The Empire Strikes Back',
        Money.of(20),
        'The Empire strikes back.',
        '',
        'star-wars',
        2,
      ),
    ],
    [
      'sw-vol-3',
      new Product(
        'sw-vol-3',
        'Star Wars - Vol. 3: Return of the Jedi',
        Money.of(20),
        'The saga concludes.',
        '',
        'star-wars',
        3,
      ),
    ],
    // --- Standalone product (no saga, no promotion) ---
    [
      'matrix-dvd',
      new Product(
        'matrix-dvd',
        'The Matrix',
        Money.of(15),
        'There is no spoon.',
        '',
        null,
        null,
      ),
    ],
  ]);

  findAll(): Promise<Product[]> {
    return Promise.resolve([...this.store.values()]);
  }

  findById(id: string): Promise<Product | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  findBySagaId(sagaId: string): Promise<Product[]> {
    return Promise.resolve(
      [...this.store.values()].filter((p) => p.sagaId === sagaId),
    );
  }

  save(product: Product): Promise<void> {
    this.store.set(product.id, product);
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    this.store.delete(id);
    return Promise.resolve();
  }
}
