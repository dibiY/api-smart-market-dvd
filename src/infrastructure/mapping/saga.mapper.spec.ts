import { Saga } from '../../core/entities/saga';
import { SagaOrmEntity } from '../persistence/orm-entities/saga.orm-entity';
import { sagaToDomain, sagaToOrm } from './saga.mapper';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOrmRow(overrides: Partial<SagaOrmEntity> = {}): SagaOrmEntity {
  const row = new SagaOrmEntity();
  row.id = 'bttf';
  row.name = 'Back to the Future';
  row.products = [];
  row.promotions = [];
  return Object.assign(row, overrides);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('sagaToDomain', () => {
  it('maps id and name correctly', () => {
    const saga = sagaToDomain(makeOrmRow());

    expect(saga.id).toBe('bttf');
    expect(saga.name).toBe('Back to the Future');
  });

  it('returns a Saga instance', () => {
    expect(sagaToDomain(makeOrmRow())).toBeInstanceOf(Saga);
  });
});

describe('sagaToOrm', () => {
  it('maps id and name correctly', () => {
    const saga = new Saga('bttf', 'Back to the Future');
    const row = sagaToOrm(saga);

    expect(row.id).toBe('bttf');
    expect(row.name).toBe('Back to the Future');
  });

  it('returns a SagaOrmEntity instance', () => {
    const saga = new Saga('bttf', 'Back to the Future');
    expect(sagaToOrm(saga)).toBeInstanceOf(SagaOrmEntity);
  });

  it('is the inverse of sagaToDomain for a round-trip', () => {
    const original = makeOrmRow();
    const roundTrip = sagaToOrm(sagaToDomain(original));

    expect(roundTrip.id).toBe(original.id);
    expect(roundTrip.name).toBe(original.name);
  });
});
