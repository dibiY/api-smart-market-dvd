import { NotFoundException } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CalculateCartPriceUseCase } from '../../application/use-cases/calculate-cart-price.use-case';
import { CartRequestDto } from '../../application/dtos/cart-request.dto';
import { PricedCartResponseDto } from '../../application/dtos/priced-cart-response.dto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUseCase(
  result: PricedCartResponseDto,
): jest.Mocked<CalculateCartPriceUseCase> {
  return {
    execute: jest.fn().mockResolvedValue(result),
  } as unknown as jest.Mocked<CalculateCartPriceUseCase>;
}

function makeCartDto(
  ...items: { productId: string; quantity: number }[]
): CartRequestDto {
  const dto = new CartRequestDto();
  dto.items = items as CartRequestDto['items'];
  return dto;
}

function makePricedCartResponse(total: number): PricedCartResponseDto {
  return {
    lines: [
      {
        productId: 'bttf-1',
        productName: 'Back to the Future 1',
        quantity: 1,
        unitPrice: total,
        lineTotal: total,
        discountRate: 0,
        currency: 'EUR',
      },
    ],
    total,
    currency: 'EUR',
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CartController', () => {
  describe('calculatePrice()', () => {
    it('delegates to CalculateCartPriceUseCase.execute() with the DTO', async () => {
      const response = makePricedCartResponse(15);
      const useCase = makeUseCase(response);
      const controller = new CartController(useCase);
      const dto = makeCartDto({ productId: 'bttf-1', quantity: 1 });

      await controller.calculatePrice(dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const { execute } = useCase;
      expect(execute).toHaveBeenCalledTimes(1);
      expect(execute).toHaveBeenCalledWith(dto);
    });

    it('returns the PricedCartResponseDto produced by the use case', async () => {
      const response = makePricedCartResponse(36);
      const useCase = makeUseCase(response);
      const controller = new CartController(useCase);

      const result = await controller.calculatePrice(
        makeCartDto(
          { productId: 'bttf-1', quantity: 1 },
          { productId: 'bttf-2', quantity: 1 },
          { productId: 'bttf-3', quantity: 1 },
        ),
      );

      expect(result).toBe(response);
      expect(result.total).toBe(36);
    });

    it('propagates NotFoundException thrown by the use case', async () => {
      const useCase = {
        execute: jest
          .fn()
          .mockRejectedValue(
            new NotFoundException('Product with id "unknown" not found'),
          ),
      } as unknown as jest.Mocked<CalculateCartPriceUseCase>;
      const controller = new CartController(useCase);

      await expect(
        controller.calculatePrice(
          makeCartDto({ productId: 'unknown', quantity: 1 }),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('passes the entire DTO unchanged to the use case', async () => {
      const response = makePricedCartResponse(27);
      const useCase = makeUseCase(response);
      const controller = new CartController(useCase);
      const dto = makeCartDto(
        { productId: 'bttf-1', quantity: 2 },
        { productId: 'bttf-3', quantity: 1 },
      );

      await controller.calculatePrice(dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(useCase.execute).toHaveBeenCalledWith(dto);
    });
  });
});
