import { Saga } from '../../core/entities/saga';
import { SagaOrmEntity } from '../persistence/orm-entities/saga.orm-entity';

export function sagaToDomain(row: SagaOrmEntity): Saga {
  return new Saga(row.id, row.name);
}

export function sagaToOrm(saga: Saga): SagaOrmEntity {
  const row = new SagaOrmEntity();
  row.id = saga.id;
  row.name = saga.name;
  return row;
}
