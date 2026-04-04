import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp, seedDatabase } from './helpers/create-test-app';

/**
 * Smoke test — verifies the NestJS application bootstraps correctly
 * and the main routes are reachable against a real SQLite in-memory database.
 */
describe('Application bootstrap (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    let dataSource: DataSource;
    ({ app, dataSource } = await createTestApp());
    await seedDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /products is reachable (HTTP 200)', () => {
    return request(app.getHttpServer() as Server)
      .get('/products')
      .expect(200);
  });

  it('POST /cart/price is reachable (HTTP 200)', () => {
    return request(app.getHttpServer() as Server)
      .post('/cart/price')
      .send({ items: [{ productId: 'bttf-1', quantity: 1 }] })
      .expect(200);
  });
});
