import { Injectable } from '@nestjs/common';
import { Product } from '../entities/product';
import { Promotion } from '../entities/promotion';
import { Money } from '../value-objects/money.vo';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PricedLine {
  product: Product;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
  /** Applied discount percentage (0–100). */
  discountRate: number;
}

export interface PricedCart {
  lines: PricedLine[];
  total: Money;
}

/**
 * Domain service responsible for all pricing calculations.
 *
 * Rules:
 *  - Products belonging to a saga are grouped together.
 *    The number of *distinct* volumes in the group determines which
 *    promotion rule applies (if a promotion exists for that saga).
 *  - Products without a saga are always priced at their base price.
 */
@Injectable()
export class PricingEngineService {
  /**
   * @param cartItems   - List of items the customer wants to purchase.
   * @param promotions  - Map keyed by sagaId → active Promotion.
   */
  calculate(
    cartItems: CartItem[],
    promotions: Map<string, Promotion>,
  ): PricedCart {
    const sagaGroups = this.groupBySaga(cartItems);
    const lines: PricedLine[] = [];

    // --- Saga items (promotion-eligible) ---
    for (const [sagaId, items] of sagaGroups.entries()) {
      const promotion = promotions.get(sagaId) ?? null;
      const totalQuantity = this.countTotalQuantity(items);
      const discountRate = promotion
        ? promotion.resolveDiscountRate(totalQuantity)
        : null;

      for (const item of items) {
        const unitPrice = item.product.basePrice;
        const subtotal = unitPrice.multiply(item.quantity);
        const lineTotal =
          discountRate && !discountRate.isZero()
            ? subtotal.applyDiscountRate(discountRate)
            : subtotal;

        lines.push({
          product: item.product,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
          discountRate: discountRate?.value ?? 0,
        });
      }
    }

    // --- Standalone items (no promotion) ---
    for (const item of cartItems.filter((i) => !i.product.belongsToSaga())) {
      const unitPrice = item.product.basePrice;
      lines.push({
        product: item.product,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice.multiply(item.quantity),
        discountRate: 0,
      });
    }

    const total = lines.reduce(
      (acc, line) => acc.add(line.lineTotal),
      Money.of(0),
    );

    return { lines, total };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private groupBySaga(cartItems: CartItem[]): Map<string, CartItem[]> {
    const groups = new Map<string, CartItem[]>();
    for (const item of cartItems) {
      if (!item.product.belongsToSaga()) continue;
      const sagaId = item.product.sagaId as string;
      const group = groups.get(sagaId) ?? [];
      group.push(item);
      groups.set(sagaId, group);
    }
    return groups;
  }

  /**
   * Sums the total quantity of all items in a saga group.
   * This is the value compared against promotion rule minQuantity thresholds.
   *
   * Examples:
   *   [vol1 x1, vol2 x1, vol3 x1]       -> 3  (20% discount)
   *   [vol1 x1, vol3 x1]                -> 2  (10% discount)
   *   [vol1 x1, vol2 x2, vol3 x1]       -> 4  (20% discount)
   */
  private countTotalQuantity(items: CartItem[]): number {
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }
}
