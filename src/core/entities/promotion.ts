import { DiscountRate } from '../value-objects/discount-rate.vo';
import { PromotionRule } from './promotion-rule';

/**
 * A promotion applies to products of a specific saga.
 * It contains a list of rules sorted by `minQuantity` (descending),
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
    // Highest minQuantity first — first matching rule wins.
    this.sortedRules = [...rules].sort(
      (a, b) => b.minQuantity - a.minQuantity,
    );
  }

  /**
   * Returns the applicable discount rate based on the total quantity
   * of saga items present in the cart. Falls back to zero if no rule matches.
   *
   * Examples (per saga):
   *   1 item  -> 0%
   *   2 items -> 10%
   *   3+ items -> 20%
   */
  resolveDiscountRate(totalQuantity: number): DiscountRate {
    for (const rule of this.sortedRules) {
      if (rule.appliesTo(totalQuantity)) {
        return rule.discountRate;
      }
    }
    return DiscountRate.zero();
  }

  getRules(): ReadonlyArray<PromotionRule> {
    return this.sortedRules;
  }
}
