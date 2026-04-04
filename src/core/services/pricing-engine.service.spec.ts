import { DiscountRate } from '../value-objects/discount-rate.vo';
import { Money } from '../value-objects/money.vo';
import { Product } from '../entities/product';
import { Promotion } from '../entities/promotion';
import { PromotionRule } from '../entities/promotion-rule';
import { CartItem, PricingEngineService } from './pricing-engine.service';

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
  return new Product(id, name, Money.of(price), '', '', sagaId, volumeNumber);
}

function item(product: Product, quantity = 1): CartItem {
  return { product, quantity };
}

/** Standard Back to the Future promotion (same rules used in all examples). */
function bttfPromotion(): Promotion {
  return new Promotion('promo-bttf', 'Back to the Future Discount', 'bttf', [
    new PromotionRule(1, DiscountRate.of(0)),
    new PromotionRule(2, DiscountRate.of(10)),
    new PromotionRule(3, DiscountRate.of(20)),
  ]);
}

const vol1 = makeProduct('bttf-1', 'Back to the Future 1', 15, 'bttf', 1);
const vol2 = makeProduct('bttf-2', 'Back to the Future 2', 15, 'bttf', 2);
const vol3 = makeProduct('bttf-3', 'Back to the Future 3', 15, 'bttf', 3);
const laChevre = makeProduct('chevre', 'La chèvre', 20, null);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PricingEngineService', () => {
  let service: PricingEngineService;
  let promotions: Map<string, Promotion>;

  beforeEach(() => {
    service = new PricingEngineService();
    promotions = new Map([['bttf', bttfPromotion()]]);
  });

  // ─── Examples from the specifications ────────────────────────────────────

  describe('specification examples', () => {
    /**
     * Example 1:
     *   Input  : Back to the Future 1, 2, 3
     *   Output : 36
     *   Rule   : 3 items -> 20% -> (15*3)*0.8 = 36
     */
    it('example 1 — 3 saga items -> 20% discount -> total 36 EUR', () => {
      const cart = [item(vol1), item(vol2), item(vol3)];
      const result = service.calculate(cart, promotions);

      expect(result.total.amount).toBe(36);
      result.lines.forEach((l) => expect(l.discountRate).toBe(20));
    });

    /**
     * Example 2:
     *   Input  : Back to the Future 1, Back to the Future 3
     *   Output : 27
     *   Rule   : 2 items -> 10% -> (15*2)*0.9 = 27
     */
    it('example 2 — 2 saga items -> 10% discount -> total 27 EUR', () => {
      const cart = [item(vol1), item(vol3)];
      const result = service.calculate(cart, promotions);

      expect(result.total.amount).toBe(27);
      result.lines.forEach((l) => expect(l.discountRate).toBe(10));
    });

    /**
     * Example 3:
     *   Input  : Back to the Future 1
     *   Output : 15
     *   Rule   : 1 item -> 0% -> 15*1 = 15
     */
    it('example 3 — 1 saga item -> 0% discount -> total 15 EUR', () => {
      const cart = [item(vol1)];
      const result = service.calculate(cart, promotions);

      expect(result.total.amount).toBe(15);
      result.lines.forEach((l) => expect(l.discountRate).toBe(0));
    });

    /**
     * Example 4:
     *   Input  : Back to the Future 1, 2, 3 + Back to the Future 2 (again)
     *   Output : 48
     *   Rule   : 4 items total -> 20% -> (15*4)*0.8 = 48
     */
    it('example 4 — 4 saga items (vol2 twice) -> 20% discount -> total 48 EUR', () => {
      const cart = [item(vol1), item(vol2, 2), item(vol3)];
      const result = service.calculate(cart, promotions);

      expect(result.total.amount).toBe(48);
      result.lines.forEach((l) => expect(l.discountRate).toBe(20));
    });

    /**
     * Example 5:
     *   Input  : Back to the Future 1, 2, 3 + La chèvre
     *   Output : 56
     *   Rule   : saga 3 items -> 20%, standalone -> full price
     *            ((15*3)*0.8) + 20 = 36 + 20 = 56
     */
    it('example 5 — 3 saga items + standalone product -> total 56 EUR', () => {
      const cart = [item(vol1), item(vol2), item(vol3), item(laChevre)];
      const result = service.calculate(cart, promotions);

      expect(result.total.amount).toBe(56);

      const sagaLines = result.lines.filter((l) => l.product.belongsToSaga());
      const standaloneLines = result.lines.filter(
        (l) => !l.product.belongsToSaga(),
      );

      sagaLines.forEach((l) => expect(l.discountRate).toBe(20));
      standaloneLines.forEach((l) => {
        expect(l.discountRate).toBe(0);
        expect(l.lineTotal.amount).toBe(20);
      });
    });
  });

  // ─── Standalone products (no saga, no promotion) ─────────────────────────

  describe('standalone products', () => {
    it('prices a standalone product at full base price', () => {
      const cart = [item(laChevre)];
      const result = service.calculate(cart, new Map());

      expect(result.total.amount).toBe(20);
      expect(result.lines[0].discountRate).toBe(0);
    });

    it('applies no discount when saga has no promotion', () => {
      const cart = [item(vol1), item(vol2)];
      const result = service.calculate(cart, new Map()); // empty promotion map

      expect(result.total.amount).toBe(30);
      result.lines.forEach((l) => expect(l.discountRate).toBe(0));
    });
  });

  // ─── Cart totals ──────────────────────────────────────────────────────────

  describe('cart total', () => {
    it('is the sum of all line totals', () => {
      const cart = [item(vol1), item(vol2), item(laChevre)];
      const result = service.calculate(cart, promotions);

      const expectedTotal = result.lines.reduce(
        (sum, l) => sum + l.lineTotal.amount,
        0,
      );
      expect(result.total.amount).toBeCloseTo(expectedTotal, 2);
    });

    it('returns 0 EUR for an empty cart', () => {
      const result = service.calculate([], new Map());
      expect(result.total.amount).toBe(0);
      expect(result.lines).toHaveLength(0);
    });
  });

  // ─── Line details ─────────────────────────────────────────────────────────

  describe('line details', () => {
    it('exposes correct unitPrice per line', () => {
      const cart = [item(vol1)];
      const result = service.calculate(cart, promotions);

      expect(result.lines[0].unitPrice.amount).toBe(15);
    });

    it('multiplies unitPrice by quantity for lineTotal before discount', () => {
      const cart = [item(vol1, 3)];
      // 1 item line with quantity 3 -> total qty 3 -> 20% discount
      const result = service.calculate(cart, promotions);
      // 15 * 3 = 45, then 20% off -> 36
      expect(result.lines[0].lineTotal.amount).toBe(36);
    });
  });
});
