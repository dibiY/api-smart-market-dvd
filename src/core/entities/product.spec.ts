import { Money } from '../value-objects/money.vo';
import { Product } from './product';

describe('Product', () => {
  describe('belongsToSaga()', () => {
    it('returns true when sagaId is set', () => {
      const product = new Product('1', 'Vol 1', Money.of(15), '', '', 'bttf', 1);
      expect(product.belongsToSaga()).toBe(true);
    });

    it('returns false when sagaId is null', () => {
      const product = new Product('2', 'La chèvre', Money.of(20), '', '', null);
      expect(product.belongsToSaga()).toBe(false);
    });
  });

  describe('sagaId and volumeNumber defaults', () => {
    it('defaults sagaId to null', () => {
      const product = new Product('3', 'Standalone', Money.of(20), '', '');
      expect(product.sagaId).toBeNull();
    });

    it('defaults volumeNumber to null', () => {
      const product = new Product('3', 'Standalone', Money.of(20), '', '');
      expect(product.volumeNumber).toBeNull();
    });
  });

  describe('basePrice', () => {
    it('exposes the Money value object', () => {
      const product = new Product('1', 'Vol 1', Money.of(15), '', '');
      expect(product.basePrice.amount).toBe(15);
      expect(product.basePrice.currency).toBe('EUR');
    });
  });
});
