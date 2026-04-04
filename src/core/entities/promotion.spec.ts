import { DiscountRate } from '../value-objects/discount-rate.vo';
import { Promotion } from './promotion';
import { PromotionRule } from './promotion-rule';

/** Helper: builds the standard Back to the Future promotion. */
function buildBttfPromotion(): Promotion {
  return new Promotion('promo-bttf', 'Back to the Future Discount', 'bttf', [
    new PromotionRule(1, DiscountRate.of(0)),
    new PromotionRule(2, DiscountRate.of(10)),
    new PromotionRule(3, DiscountRate.of(20)),
  ]);
}

describe('Promotion', () => {
  describe('resolveDiscountRate()', () => {
    it('returns 0% for 1 item in the saga (example 3)', () => {
      const rate = buildBttfPromotion().resolveDiscountRate(1);
      expect(rate.value).toBe(0);
    });

    it('returns 10% for 2 items in the saga (example 2)', () => {
      const rate = buildBttfPromotion().resolveDiscountRate(2);
      expect(rate.value).toBe(10);
    });

    it('returns 20% for 3 items in the saga (example 1)', () => {
      const rate = buildBttfPromotion().resolveDiscountRate(3);
      expect(rate.value).toBe(20);
    });

    it('returns 20% for 4 items in the saga (example 4 - cap at highest rule)', () => {
      const rate = buildBttfPromotion().resolveDiscountRate(4);
      expect(rate.value).toBe(20);
    });

    it('returns 20% for quantities well above 3', () => {
      const rate = buildBttfPromotion().resolveDiscountRate(10);
      expect(rate.value).toBe(20);
    });

    it('returns 0% when no rule matches (promotion with no rules)', () => {
      const empty = new Promotion('p', 'empty', 'saga', []);
      expect(empty.resolveDiscountRate(3).value).toBe(0);
    });
  });

  describe('rule sorting', () => {
    it('sorts rules by minQuantity descending regardless of insertion order', () => {
      const shuffled = new Promotion('p', 'test', 'saga', [
        new PromotionRule(3, DiscountRate.of(20)),
        new PromotionRule(1, DiscountRate.of(0)),
        new PromotionRule(2, DiscountRate.of(10)),
      ]);
      // Should still resolve correctly
      expect(shuffled.resolveDiscountRate(2).value).toBe(10);
      expect(shuffled.resolveDiscountRate(3).value).toBe(20);
    });
  });

  describe('getRules()', () => {
    it('returns rules sorted by minQuantity descending', () => {
      const promo = buildBttfPromotion();
      const rules = promo.getRules();
      expect(rules[0].minQuantity).toBe(3);
      expect(rules[1].minQuantity).toBe(2);
      expect(rules[2].minQuantity).toBe(1);
    });
  });
});
