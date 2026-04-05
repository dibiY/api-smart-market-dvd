import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../core/entities/product';
import type { IProductRepository } from '../../core/repositories/product.repository.interface';
import { productToDomain, productToOrm } from '../mapping/product.mapper';
import { ProductOrmEntity } from './orm-entities/product.orm-entity';

@Injectable()
export class TypeOrmProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repo: Repository<ProductOrmEntity>,
  ) {}

  async findAll(): Promise<Product[]> {
    const rows = await this.repo.find({ relations: { saga: true } });
    return rows.map((row) => productToDomain(row));
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.repo.findOne({
      where: { id },
      relations: { saga: true },
    });
    return row ? productToDomain(row) : null;
  }

  async findBySagaId(sagaId: string): Promise<Product[]> {
    const rows = await this.repo.find({
      where: { sagaId },
      relations: { saga: true },
    });
    return rows.map((row) => productToDomain(row));
  }

  async save(product: Product): Promise<void> {
    await this.repo.save(productToOrm(product));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
