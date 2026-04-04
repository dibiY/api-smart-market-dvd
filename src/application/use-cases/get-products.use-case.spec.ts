import { GetProductsUseCase } from './get-products.use-case';
import type { IProductRepository } from '../../core/repositories/product.repository.interface';
import { Product } from '../../core/entities/product';
import { Money } from '../../core/value-objects/money.vo';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProduct(
  id: string,
  name: string,
  price: number,
  sagaId: string | null = null,
  volumeNumber: number | null = null,
): Product {
  return new Product(
    id,
    name,
    Money.of(price),
    'Some description',
    'http://img.test/' + id,
    sagaId,
    volumeNumber,
  );
}

function makeRepo(products: Product[]): jest.Mocked<IProductRepository> {
  return {
    findAll: jest.fn().mockResolvedValue(products),
    findById: jest.fn(),
    findBySagaId: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GetProductsUseCase', () => {
  it('returns an empty array when the repository has no products', async () => {
    const repo = makeRepo([]);
    const useCase = new GetProductsUseCase(repo);

    const result = await useCase.execute();

    expect(result).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { findAll } = repo;
    expect(findAll).toHaveBeenCalledTimes(1);
  });

  describe('DTO mapping', () => {
    it('maps a saga product to ProductResponseDto correctly', async () => {
      const product = makeProduct(
        'bttf-1',
        'Back to the Future 1',
        15,
        'bttf',
        1,
      );
      const repo = makeRepo([product]);
      const useCase = new GetProductsUseCase(repo);

      const [dto] = await useCase.execute();

      expect(dto).toEqual({
        id: 'bttf-1',
        name: 'Back to the Future 1',
        price: 15,
        currency: 'EUR',
        description: 'Some description',
        imageUrl: 'http://img.test/bttf-1',
        sagaId: 'bttf',
        volumeNumber: 1,
      });
    });

    it('maps a standalone product with null sagaId and volumeNumber', async () => {
      const product = makeProduct('chevre', 'La chèvre', 20);
      const repo = makeRepo([product]);
      const useCase = new GetProductsUseCase(repo);

      const [dto] = await useCase.execute();

      expect(dto.sagaId).toBeNull();
      expect(dto.volumeNumber).toBeNull();
    });

    it('returns one DTO per product', async () => {
      const products = [
        makeProduct('bttf-1', 'Back to the Future 1', 15, 'bttf', 1),
        makeProduct('bttf-2', 'Back to the Future 2', 15, 'bttf', 2),
        makeProduct('chevre', 'La chèvre', 20),
      ];
      const repo = makeRepo(products);
      const useCase = new GetProductsUseCase(repo);

      const result = await useCase.execute();

      expect(result).toHaveLength(3);
      expect(result.map((d) => d.id)).toEqual(['bttf-1', 'bttf-2', 'chevre']);
    });

    it('preserves the currency from the product base price', async () => {
      const product = makeProduct('chevre', 'La chèvre', 20);
      const repo = makeRepo([product]);
      const useCase = new GetProductsUseCase(repo);

      const [dto] = await useCase.execute();

      expect(dto.currency).toBe('EUR');
    });
  });
});
