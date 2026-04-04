import { DiscountRate } from '../value-objects/discount-rate.vo';
import { PromotionRule } from './promotion-rule';

/**
 * A promotion applies to products of a specific saga.
 * It contains a list of rules sorted by `minVolumes` (descending),
 * so the most generous matching rule is always resolved first.
 */
export class Promotion {
  private readonly sortedRules: PromotionRule[];

  constructor(
    public readonly id: string,
    public readonly name: string,
    /** The saga this promotion covers. */
    public readonly sagaId: string,
    rules: PromotionRule[],
  ) {
    // Highest minVolumes first — first matching rule wins.
    this.sortedRules = [...rules].sort((a, b) => b.minVolumes - a.minVolumes);
  }

  /**
   * Returns the applicable discount rate for a given number of distinct
   * volumes present in the cart. Falls back to zero if no rule matches.
   */
  resolveDiscountRate(distinctVolumeCount: number): DiscountRate {
    for (const rule of this.sortedRules) {
      if (rule.appliesTo(distinctVolumeCount)) {
        return rule.discountRate;
      }
    }
    return DiscountRate.zero();
  }

  getRules(): ReadonlyArray<PromotionRule> {
    return this.sortedRules;
  }
}
