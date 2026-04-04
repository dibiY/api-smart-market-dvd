import { Promotion } from '../../core/entities/promotion';
import { PromotionRule } from '../../core/entities/promotion-rule';
import { DiscountRate } from '../../core/value-objects/discount-rate.vo';
import { PromotionOrmEntity } from '../persistence/orm-entities/promotion.orm-entity';
import { PromotionRuleOrmEntity } from '../persistence/orm-entities/promotion-rule.orm-entity';
import { promotionToDomain, promotionToOrm } from './promotion.mapper';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRuleOrm(
  minQuantity: number,
  discountRate: number,
): PromotionRuleOrmEntity {
  const r = new PromotionRuleOrmEntity();
  r.id = minQuantity;
  r.minQuantity = minQuantity;
  r.discountRate = discountRate;
  r.promotionId = 'promo-bttf';
  return r;
}

function makeOrmRow(
  overrides: Partial<PromotionOrmEntity> = {},
): PromotionOrmEntity {
  const row = new PromotionOrmEntity();
  row.id = 'promo-bttf';
  row.name = 'Back to the Future Discount';
  row.sagaId = 'bttf';
  row.rules = [makeRuleOrm(1, 0), makeRuleOrm(2, 10), makeRuleOrm(3, 20)];
  return Object.assign(row, overrides);
}

function makeDomainPromotion(): Promotion {
  return new Promotion('promo-bttf', 'Back to the Future Discount', 'bttf', [
    new PromotionRule(1, DiscountRate.of(0)),
    new PromotionRule(2, DiscountRate.of(10)),
    new PromotionRule(3, DiscountRate.of(20)),
  ]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('promotionToDomain', () => {
  it('maps scalar fields correctly', () => {
    const promotion = promotionToDomain(makeOrmRow());

    expect(promotion.id).toBe('promo-bttf');
    expect(promotion.name).toBe('Back to the Future Discount');
    expect(promotion.sagaId).toBe('bttf');
  });

  it('maps all rules with correct minQuantity and discountRate', () => {
    const promotion = promotionToDomain(makeOrmRow());
    const rules = promotion.getRules();

    expect(rules).toHaveLength(3);
    // Promotion sorts rules descending by minQuantity
    expect(rules[0].minQuantity).toBe(3);
    expect(rules[0].discountRate.value).toBe(20);
    expect(rules[1].minQuantity).toBe(2);
    expect(rules[1].discountRate.value).toBe(10);
    expect(rules[2].minQuantity).toBe(1);
    expect(rules[2].discountRate.value).toBe(0);
  });

  it('converts decimal string discountRate to a number', () => {
    const row = makeOrmRow({
      rules: [makeRuleOrm(2, 10)],
    });
    // TypeORM returns DECIMAL columns as strings from MySQL
    (row.rules[0] as unknown as { discountRate: string }).discountRate =
      '10.00';
    const promotion = promotionToDomain(row);

    expect(promotion.getRules()[0].discountRate.value).toBe(10);
  });

  it('produces an empty rules array when row.rules is undefined', () => {
    const row = makeOrmRow();
    (row as unknown as { rules: undefined }).rules = undefined;
    const promotion = promotionToDomain(row);

    expect(promotion.getRules()).toHaveLength(0);
  });

  it('returns a Promotion instance', () => {
    expect(promotionToDomain(makeOrmRow())).toBeInstanceOf(Promotion);
  });
});

describe('promotionToOrm', () => {
  it('maps scalar fields correctly', () => {
    const row = promotionToOrm(makeDomainPromotion());

    expect(row.id).toBe('promo-bttf');
    expect(row.name).toBe('Back to the Future Discount');
    expect(row.sagaId).toBe('bttf');
  });

  it('maps all rules with correct minQuantity, discountRate and promotionId', () => {
    const row = promotionToOrm(makeDomainPromotion());

    expect(row.rules).toHaveLength(3);
    // getRules() returns rules sorted descending by minQuantity
    expect(row.rules[0].minQuantity).toBe(3);
    expect(row.rules[0].discountRate).toBe(20);
    expect(row.rules[0].promotionId).toBe('promo-bttf');
    expect(row.rules[2].minQuantity).toBe(1);
    expect(row.rules[2].discountRate).toBe(0);
  });

  it('returns a PromotionOrmEntity instance', () => {
    expect(promotionToOrm(makeDomainPromotion())).toBeInstanceOf(
      PromotionOrmEntity,
    );
  });

  it('rule rows are PromotionRuleOrmEntity instances', () => {
    const row = promotionToOrm(makeDomainPromotion());
    row.rules.forEach((r) => expect(r).toBeInstanceOf(PromotionRuleOrmEntity));
  });
});
