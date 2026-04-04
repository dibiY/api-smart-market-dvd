import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Saga } from '../../core/entities/saga';
import type { ISagaRepository } from '../../core/repositories/saga.repository.interface';
import { sagaToDomain, sagaToOrm } from '../mapping/saga.mapper';
import { SagaOrmEntity } from './orm-entities/saga.orm-entity';

@Injectable()
export class TypeOrmSagaRepository implements ISagaRepository {
  constructor(
    @InjectRepository(SagaOrmEntity)
    private readonly repo: Repository<SagaOrmEntity>,
  ) {}

  async findAll(): Promise<Saga[]> {
    const rows = await this.repo.find();
    return rows.map((row) => sagaToDomain(row));
  }

  async findById(id: string): Promise<Saga | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? sagaToDomain(row) : null;
  }

  async save(saga: Saga): Promise<void> {
    await this.repo.save(sagaToOrm(saga));
  }
}
