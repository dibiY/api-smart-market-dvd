import { Injectable } from '@nestjs/common';
import { Promotion } from '../../core/entities/promotion';
import { PromotionRule } from '../../core/entities/promotion-rule';
import type { IPromotionRepository } from '../../core/repositories/promotion.repository.interface';
import { DiscountRate } from '../../core/value-objects/discount-rate.vo';

@Injectable()
export class InMemoryPromotionRepository implements IPromotionRepository {
  /**
   * Keyed by sagaId for O(1) lookup.
   *
   * Seeded with the Star Wars saga promotion rules:
   *   - 1 item  in saga → 0 %
   *   - 2 items in saga → 10 %
   *   - 3+ items in saga → 20 %
   */
  private readonly store = new Map<string, Promotion>([
    [
      'star-wars',
      new Promotion('promo-star-wars', 'Star Wars Saga Discount', 'star-wars', [
        new PromotionRule(1, DiscountRate.of(0)),
        new PromotionRule(2, DiscountRate.of(10)),
        new PromotionRule(3, DiscountRate.of(20)),
      ]),
    ],
  ]);

  findAll(): Promise<Promotion[]> {
    return Promise.resolve([...this.store.values()]);
  }

  findBySagaId(sagaId: string): Promise<Promotion | null> {
    return Promise.resolve(this.store.get(sagaId) ?? null);
  }

  save(promotion: Promotion): Promise<void> {
    this.store.set(promotion.sagaId, promotion);
    return Promise.resolve();
  }
}
