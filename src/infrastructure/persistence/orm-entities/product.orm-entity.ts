import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { SagaOrmEntity } from './saga.orm-entity';

@Entity('products')
export class ProductOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  sagaId: string | null;

  @Column({ type: 'int', nullable: true })
  volumeNumber: number | null;

  @ManyToOne(() => SagaOrmEntity, (saga) => saga.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sagaId' })
  saga: SagaOrmEntity | null;
}
