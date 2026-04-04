import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { PromotionRuleOrmEntity } from './promotion-rule.orm-entity';
import { SagaOrmEntity } from './saga.orm-entity';

@Entity('promotions')
export class PromotionOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 36 })
  sagaId: string;

  @ManyToOne(() => SagaOrmEntity, (saga) => saga.promotions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sagaId' })
  saga: SagaOrmEntity;

  @OneToMany(() => PromotionRuleOrmEntity, (rule) => rule.promotion, {
    cascade: true,
    eager: true,
  })
  rules: PromotionRuleOrmEntity[];
}
