import { ProductController } from './product.controller';
import { GetProductsUseCase } from '../../application/use-cases/get-products.use-case';
import { ProductResponseDto } from '../../application/dtos/product-response.dto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUseCase(
  products: ProductResponseDto[],
): jest.Mocked<GetProductsUseCase> {
  return {
    execute: jest.fn().mockResolvedValue(products),
  } as unknown as jest.Mocked<GetProductsUseCase>;
}

function makeProductDto(
  id: string,
  sagaId: string | null = null,
): ProductResponseDto {
  return {
    id,
    name: `Product ${id}`,
    price: 15,
    currency: 'EUR',
    description: '',
    imageUrl: '',
    sagaId,
    sagaName: sagaId ? `Saga of ${id}` : null,
    volumeNumber: sagaId ? 1 : null,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProductController', () => {
  describe('getAll()', () => {
    it('delegates to GetProductsUseCase.execute()', async () => {
      const useCase = makeUseCase([]);
      const controller = new ProductController(useCase);

      await controller.getAll();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const { execute } = useCase;
      expect(execute).toHaveBeenCalledTimes(1);
      expect(execute).toHaveBeenCalledWith();
    });

    it('returns the array produced by the use case', async () => {
      const products = [
        makeProductDto('bttf-1', 'bttf'),
        makeProductDto('bttf-2', 'bttf'),
        makeProductDto('chevre'),
      ];
      const useCase = makeUseCase(products);
      const controller = new ProductController(useCase);

      const result = await controller.getAll();

      expect(result).toBe(products);
    });

    it('returns an empty array when the catalogue is empty', async () => {
      const useCase = makeUseCase([]);
      const controller = new ProductController(useCase);

      const result = await controller.getAll();

      expect(result).toEqual([]);
    });

    it('propagates errors thrown by the use case', async () => {
      const useCase = {
        execute: jest.fn().mockRejectedValue(new Error('DB unavailable')),
      } as unknown as jest.Mocked<GetProductsUseCase>;
      const controller = new ProductController(useCase);

      await expect(controller.getAll()).rejects.toThrow('DB unavailable');
    });
  });
});
