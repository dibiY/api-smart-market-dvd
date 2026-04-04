import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { ProductOrmEntity } from './product.orm-entity';
import { PromotionOrmEntity } from './promotion.orm-entity';

@Entity('sagas')
export class SagaOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @OneToMany(() => ProductOrmEntity, (product) => product.saga)
  products: ProductOrmEntity[];

  @OneToMany(() => PromotionOrmEntity, (promotion) => promotion.saga)
  promotions: PromotionOrmEntity[];
}
