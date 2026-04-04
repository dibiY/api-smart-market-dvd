import { DiscountRate } from '../value-objects/discount-rate.vo';
import { PromotionRule } from './promotion-rule';

describe('PromotionRule', () => {
  describe('constructor', () => {
    it('creates a valid rule', () => {
      const rule = new PromotionRule(2, DiscountRate.of(10));
      expect(rule.minQuantity).toBe(2);
      expect(rule.discountRate.value).toBe(10);
    });

    it('throws when minQuantity is zero', () => {
      expect(() => new PromotionRule(0, DiscountRate.of(10))).toThrow(
        'minQuantity must be at least 1',
      );
    });

    it('throws when minQuantity is negative', () => {
      expect(() => new PromotionRule(-1, DiscountRate.of(10))).toThrow(
        'minQuantity must be at least 1',
      );
    });
  });

  describe('appliesTo()', () => {
    const rule = new PromotionRule(3, DiscountRate.of(20));

    it('returns true when totalQuantity equals minQuantity', () => {
      expect(rule.appliesTo(3)).toBe(true);
    });

    it('returns true when totalQuantity exceeds minQuantity', () => {
      expect(rule.appliesTo(5)).toBe(true);
    });

    it('returns false when totalQuantity is below minQuantity', () => {
      expect(rule.appliesTo(2)).toBe(false);
    });

    it('returns false for quantity 1 with minQuantity 2', () => {
      const r2 = new PromotionRule(2, DiscountRate.of(10));
      expect(r2.appliesTo(1)).toBe(false);
    });
  });
});
