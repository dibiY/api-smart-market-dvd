import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from '../../core/entities/promotion';
import type { IPromotionRepository } from '../../core/repositories/promotion.repository.interface';
import { promotionToDomain, promotionToOrm } from '../mapping/promotion.mapper';
import { PromotionOrmEntity } from './orm-entities/promotion.orm-entity';

@Injectable()
export class TypeOrmPromotionRepository implements IPromotionRepository {
  constructor(
    @InjectRepository(PromotionOrmEntity)
    private readonly repo: Repository<PromotionOrmEntity>,
  ) {}

  async findAll(): Promise<Promotion[]> {
    const rows = await this.repo.find({ relations: ['rules'] });
    return rows.map((row) => promotionToDomain(row));
  }

  async findBySagaId(sagaId: string): Promise<Promotion | null> {
    const row = await this.repo.findOne({
      where: { sagaId },
      relations: ['rules'],
    });
    return row ? promotionToDomain(row) : null;
  }

  async save(promotion: Promotion): Promise<void> {
    await this.repo.save(promotionToOrm(promotion));
  }
}
