import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Saga } from '../../core/entities/saga';
import type { ISagaRepository } from '../../core/repositories/saga.repository.interface';
import { SagaOrmEntity } from './orm-entities/saga.orm-entity';

@Injectable()
export class TypeOrmSagaRepository implements ISagaRepository {
  constructor(
    @InjectRepository(SagaOrmEntity)
    private readonly repo: Repository<SagaOrmEntity>,
  ) {}

  async findAll(): Promise<Saga[]> {
    const rows = await this.repo.find();
    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<Saga | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? this.toDomain(row) : null;
  }

  async save(saga: Saga): Promise<void> {
    const row = this.toOrm(saga);
    await this.repo.save(row);
  }

  // ---------------------------------------------------------------------------
  // Mappers
  // ---------------------------------------------------------------------------

  private toDomain(row: SagaOrmEntity): Saga {
    return new Saga(row.id, row.name);
  }

  private toOrm(saga: Saga): SagaOrmEntity {
    const row = new SagaOrmEntity();
    row.id = saga.id;
    row.name = saga.name;
    return row;
  }
}
