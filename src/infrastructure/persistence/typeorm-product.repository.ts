import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../core/entities/product';
import type { IProductRepository } from '../../core/repositories/product.repository.interface';
import { Money } from '../../core/value-objects/money.vo';
import { ProductOrmEntity } from './orm-entities/product.orm-entity';

@Injectable()
export class TypeOrmProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repo: Repository<ProductOrmEntity>,
  ) {}

  async findAll(): Promise<Product[]> {
    const rows = await this.repo.find();
    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? this.toDomain(row) : null;
  }

  async findBySagaId(sagaId: string): Promise<Product[]> {
    const rows = await this.repo.findBy({ sagaId });
    return rows.map((row) => this.toDomain(row));
  }

  async save(product: Product): Promise<void> {
    const row = this.toOrm(product);
    await this.repo.save(row);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  // ---------------------------------------------------------------------------
  // Mappers
  // ---------------------------------------------------------------------------

  private toDomain(row: ProductOrmEntity): Product {
    return new Product(
      row.id,
      row.name,
      Money.of(Number(row.basePrice), row.currency),
      row.description ?? '',
      row.imageUrl ?? '',
      row.sagaId,
      row.volumeNumber,
    );
  }

  private toOrm(product: Product): ProductOrmEntity {
    const row = new ProductOrmEntity();
    row.id = product.id;
    row.name = product.name;
    row.basePrice = product.basePrice.amount;
    row.currency = product.basePrice.currency;
    row.description = product.description;
    row.imageUrl = product.imageUrl;
    row.sagaId = product.sagaId;
    row.volumeNumber = product.volumeNumber;
    return row;
  }
}
