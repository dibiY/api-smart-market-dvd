import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import { DataSource } from 'typeorm';
import request from 'supertest';
import type { ProductResponseDto } from '../src/application/dtos/product-response.dto';
import {
  createTestApp,
  E2E_PRODUCT_COUNT,
  seedDatabase,
} from './helpers/create-test-app';

describe('GET /products (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    let dataSource: DataSource;
    ({ app, dataSource } = await createTestApp());
    await seedDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns HTTP 200', () => {
    return request(app.getHttpServer() as Server)
      .get('/products')
      .expect(200);
  });

  it('returns an array of all seeded products', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/products')
      .expect(200);
    const body = response.body as ProductResponseDto[];

    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(E2E_PRODUCT_COUNT);
  });

  it('each product has the expected fields', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/products')
      .expect(200);
    const body = response.body as ProductResponseDto[];

    for (const product of body) {
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('currency', 'EUR');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('imageUrl');
      expect(product).toHaveProperty('sagaId');
      expect(product).toHaveProperty('volumeNumber');
    }
  });

  it('saga products have a sagaId and volumeNumber', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/products')
      .expect(200);
    const body = response.body as ProductResponseDto[];

    const sagaProducts = body.filter(
      (p: ProductResponseDto) => p.sagaId !== null,
    );
    expect(sagaProducts.length).toBeGreaterThan(0);
    sagaProducts.forEach((p: ProductResponseDto) => {
      expect(typeof p.sagaId).toBe('string');
      expect(typeof p.volumeNumber).toBe('number');
    });
  });

  it('standalone products have null sagaId and volumeNumber', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/products')
      .expect(200);
    const body = response.body as ProductResponseDto[];

    const standalone = body.filter(
      (p: ProductResponseDto) => p.sagaId === null,
    );
    expect(standalone.length).toBeGreaterThan(0);
    standalone.forEach((p: ProductResponseDto) => {
      expect(p.sagaId).toBeNull();
      expect(p.volumeNumber).toBeNull();
    });
  });

  it('includes Back to the Future 1 at 15 EUR', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/products')
      .expect(200);
    const body = response.body as ProductResponseDto[];

    const bttf1 = body.find((p: ProductResponseDto) => p.id === 'bttf-1');
    expect(bttf1).toBeDefined();
    expect(bttf1!.price).toBe(15);
    expect(bttf1!.sagaId).toBe('bttf');
  });
});
