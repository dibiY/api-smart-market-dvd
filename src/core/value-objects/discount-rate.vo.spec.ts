import { DiscountRate } from './discount-rate.vo';

describe('DiscountRate', () => {
  describe('of()', () => {
    it('creates a valid discount rate', () => {
      const rate = DiscountRate.of(20);
      expect(rate.value).toBe(20);
    });

    it('accepts boundary value 0', () => {
      expect(DiscountRate.of(0).value).toBe(0);
    });

    it('accepts boundary value 100', () => {
      expect(DiscountRate.of(100).value).toBe(100);
    });

    it('throws when value is negative', () => {
      expect(() => DiscountRate.of(-1)).toThrow(
        'Discount rate must be between 0 and 100',
      );
    });

    it('throws when value exceeds 100', () => {
      expect(() => DiscountRate.of(101)).toThrow(
        'Discount rate must be between 0 and 100',
      );
    });
  });

  describe('zero()', () => {
    it('creates a zero discount rate', () => {
      expect(DiscountRate.zero().value).toBe(0);
    });
  });

  describe('isZero()', () => {
    it('returns true for a zero rate', () => {
      expect(DiscountRate.zero().isZero()).toBe(true);
    });

    it('returns false for a non-zero rate', () => {
      expect(DiscountRate.of(10).isZero()).toBe(false);
    });
  });

  describe('equals()', () => {
    it('returns true for equal rates', () => {
      expect(DiscountRate.of(10).equals(DiscountRate.of(10))).toBe(true);
    });

    it('returns false for different rates', () => {
      expect(DiscountRate.of(10).equals(DiscountRate.of(20))).toBe(false);
    });
  });
});
