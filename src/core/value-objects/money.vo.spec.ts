import { DiscountRate } from './discount-rate.vo';
import { Money } from './money.vo';

describe('Money', () => {
  describe('of()', () => {
    it('creates money with a given amount and default EUR currency', () => {
      const m = Money.of(15);
      expect(m.amount).toBe(15);
      expect(m.currency).toBe('EUR');
    });

    it('creates money with a custom currency', () => {
      const m = Money.of(10, 'USD');
      expect(m.currency).toBe('USD');
    });

    it('rounds to 2 decimal places', () => {
      expect(Money.of(10.005).amount).toBe(10.01);
    });

    it('throws when amount is negative', () => {
      expect(() => Money.of(-1)).toThrow('Money amount cannot be negative');
    });

    it('accepts zero amount', () => {
      expect(Money.of(0).amount).toBe(0);
    });
  });

  describe('add()', () => {
    it('adds two amounts of the same currency', () => {
      const result = Money.of(10).add(Money.of(5));
      expect(result.amount).toBe(15);
      expect(result.currency).toBe('EUR');
    });

    it('throws when currencies differ', () => {
      expect(() => Money.of(10, 'EUR').add(Money.of(5, 'USD'))).toThrow(
        'Currency mismatch',
      );
    });
  });

  describe('multiply()', () => {
    it('multiplies amount by a positive factor', () => {
      expect(Money.of(15).multiply(3).amount).toBe(45);
    });

    it('multiplies amount by zero', () => {
      expect(Money.of(15).multiply(0).amount).toBe(0);
    });
  });

  describe('applyDiscountRate()', () => {
    it('applies a 20% discount to 45 EUR -> 36 EUR', () => {
      const result = Money.of(45).applyDiscountRate(DiscountRate.of(20));
      expect(result.amount).toBe(36);
    });

    it('applies a 10% discount to 30 EUR -> 27 EUR', () => {
      const result = Money.of(30).applyDiscountRate(DiscountRate.of(10));
      expect(result.amount).toBe(27);
    });

    it('applies a 0% discount and returns same amount', () => {
      const result = Money.of(15).applyDiscountRate(DiscountRate.zero());
      expect(result.amount).toBe(15);
    });
  });

  describe('equals()', () => {
    it('returns true for same amount and currency', () => {
      expect(Money.of(10).equals(Money.of(10))).toBe(true);
    });

    it('returns false for different amounts', () => {
      expect(Money.of(10).equals(Money.of(20))).toBe(false);
    });

    it('returns false for different currencies', () => {
      expect(Money.of(10, 'EUR').equals(Money.of(10, 'USD'))).toBe(false);
    });
  });
});
