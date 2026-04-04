import { Injectable } from '@nestjs/common';
import { Saga } from '../../core/entities/saga';
import type { ISagaRepository } from '../../core/repositories/saga.repository.interface';

@Injectable()
export class InMemorySagaRepository implements ISagaRepository {
  private readonly store = new Map<string, Saga>([
    ['star-wars', new Saga('star-wars', 'Star Wars')],
  ]);

  findAll(): Promise<Saga[]> {
    return Promise.resolve([...this.store.values()]);
  }

  findById(id: string): Promise<Saga | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  save(saga: Saga): Promise<void> {
    this.store.set(saga.id, saga);
    return Promise.resolve();
  }
}
