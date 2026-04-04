import { DiscountRate } from '../value-objects/discount-rate.vo';

/**
 * A single condition-discount pair that belongs to a Promotion.
 * Immutable value object: identified by its content, not by an id.
 */
export class PromotionRule {
  public readonly discountRate: DiscountRate;

  constructor(
    /** Minimum total quantity of saga items in the cart to trigger this rule. */
    public readonly minQuantity: number,
    discountRate: DiscountRate,
  ) {
    if (minQuantity < 1) {
      throw new Error(`minQuantity must be at least 1, got ${minQuantity}`);
    }
    this.discountRate = discountRate;
  }

  appliesTo(totalQuantity: number): boolean {
    return totalQuantity >= this.minQuantity;
  }
}
