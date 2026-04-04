import { Promotion } from '../entities/promotion';

export const PROMOTION_REPOSITORY = 'IPromotionRepository';

export interface IPromotionRepository {
  findAll(): Promise<Promotion[]>;
  findBySagaId(sagaId: string): Promise<Promotion | null>;
  save(promotion: Promotion): Promise<void>;
}
