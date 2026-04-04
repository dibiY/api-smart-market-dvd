import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PromotionOrmEntity } from './promotion.orm-entity';

@Entity('promotion_rules')
export class PromotionRuleOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  minVolumes: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  discountRate: number;

  @Column({ type: 'varchar', length: 36 })
  promotionId: string;

  @ManyToOne(() => PromotionOrmEntity, (promotion) => promotion.rules, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'promotionId' })
  promotion: PromotionOrmEntity;
}
