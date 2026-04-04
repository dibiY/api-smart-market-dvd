import { Saga } from '../entities/saga';

export const SAGA_REPOSITORY = 'ISagaRepository';

export interface ISagaRepository {
  findAll(): Promise<Saga[]>;
  findById(id: string): Promise<Saga | null>;
  save(saga: Saga): Promise<void>;
}
