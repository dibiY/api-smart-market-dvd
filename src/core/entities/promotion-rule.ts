import { DiscountRate } from '../value-objects/discount-rate.vo';

/**
 * A single condition-discount pair that belongs to a Promotion.
 * Immutable value object: identified by its content, not by an id.
 */
export class PromotionRule {
  public readonly discountRate: DiscountRate;

  constructor(
    /** Minimum number of distinct volumes required to trigger this rule. */
    public readonly minVolumes: number,
    discountRate: DiscountRate,
  ) {
    if (minVolumes < 1) {
      throw new Error(`minVolumes must be at least 1, got ${minVolumes}`);
    }
    this.discountRate = discountRate;
  }

  appliesTo(volumeCount: number): boolean {
    return volumeCount >= this.minVolumes;
  }
}
