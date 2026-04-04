import { Promotion } from '../../core/entities/promotion';
import { PromotionRule } from '../../core/entities/promotion-rule';
import { DiscountRate } from '../../core/value-objects/discount-rate.vo';
import { PromotionOrmEntity } from '../persistence/orm-entities/promotion.orm-entity';
import { PromotionRuleOrmEntity } from '../persistence/orm-entities/promotion-rule.orm-entity';

export function promotionToDomain(row: PromotionOrmEntity): Promotion {
  const rules = (row.rules ?? []).map(
    (r) =>
      new PromotionRule(r.minQuantity, DiscountRate.of(Number(r.discountRate))),
  );
  return new Promotion(row.id, row.name, row.sagaId, rules);
}

export function promotionToOrm(promotion: Promotion): PromotionOrmEntity {
  const row = new PromotionOrmEntity();
  row.id = promotion.id;
  row.name = promotion.name;
  row.sagaId = promotion.sagaId;
  row.rules = promotion.getRules().map((rule) => {
    const ruleRow = new PromotionRuleOrmEntity();
    ruleRow.minQuantity = rule.minQuantity;
    ruleRow.discountRate = rule.discountRate.value;
    ruleRow.promotionId = promotion.id;
    return ruleRow;
  });
  return row;
}
