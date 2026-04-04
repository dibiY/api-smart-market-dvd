import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from '../../core/entities/promotion';
import { PromotionRule } from '../../core/entities/promotion-rule';
import type { IPromotionRepository } from '../../core/repositories/promotion.repository.interface';
import { DiscountRate } from '../../core/value-objects/discount-rate.vo';
import { PromotionOrmEntity } from './orm-entities/promotion.orm-entity';
import { PromotionRuleOrmEntity } from './orm-entities/promotion-rule.orm-entity';

@Injectable()
export class TypeOrmPromotionRepository implements IPromotionRepository {
  constructor(
    @InjectRepository(PromotionOrmEntity)
    private readonly repo: Repository<PromotionOrmEntity>,
  ) {}

  async findAll(): Promise<Promotion[]> {
    const rows = await this.repo.find({ relations: ['rules'] });
    return rows.map((row) => this.toDomain(row));
  }

  async findBySagaId(sagaId: string): Promise<Promotion | null> {
    const row = await this.repo.findOne({
      where: { sagaId },
      relations: ['rules'],
    });
    return row ? this.toDomain(row) : null;
  }

  async save(promotion: Promotion): Promise<void> {
    const row = this.toOrm(promotion);
    await this.repo.save(row);
  }

  // ---------------------------------------------------------------------------
  // Mappers
  // ---------------------------------------------------------------------------

  private toDomain(row: PromotionOrmEntity): Promotion {
    const rules = (row.rules ?? []).map(
      (r) =>
        new PromotionRule(
          r.minQuantity,
          DiscountRate.of(Number(r.discountRate)),
        ),
    );
    return new Promotion(row.id, row.name, row.sagaId, rules);
  }

  private toOrm(promotion: Promotion): PromotionOrmEntity {
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
}
