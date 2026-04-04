import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import type {
  PricedCartResponseDto,
  PricedLineResponseDto,
} from '../src/application/dtos/priced-cart-response.dto';
import { createTestApp } from './helpers/create-test-app';

describe('POST /cart/price (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Response shape ────────────────────────────────────────────────────────

  describe('response shape', () => {
    it('returns HTTP 200 for a valid request', () => {
      return request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({ items: [{ productId: 'bttf-1', quantity: 1 }] })
        .expect(200);
    });

    it('response has lines, total and currency fields', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({ items: [{ productId: 'bttf-1', quantity: 1 }] })
        .expect(200);
      const body = response.body as PricedCartResponseDto;

      expect(body).toHaveProperty('lines');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('currency', 'EUR');
      expect(Array.isArray(body.lines)).toBe(true);
    });

    it('each line has the expected fields', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({ items: [{ productId: 'bttf-1', quantity: 1 }] })
        .expect(200);
      const body = response.body as PricedCartResponseDto;

      const line = body.lines[0];
      expect(line).toHaveProperty('productId', 'bttf-1');
      expect(line).toHaveProperty('productName');
      expect(line).toHaveProperty('quantity', 1);
      expect(line).toHaveProperty('unitPrice');
      expect(line).toHaveProperty('lineTotal');
      expect(line).toHaveProperty('discountRate');
      expect(line).toHaveProperty('currency', 'EUR');
    });
  });

  // ─── Business examples ─────────────────────────────────────────────────────

  describe('business examples', () => {
    /**
     * Example 1: 3 saga volumes -> 20% -> total 36 EUR
     */
    it('example 1 — 3 saga items -> 20% -> 36 EUR', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({
          items: [
            { productId: 'bttf-1', quantity: 1 },
            { productId: 'bttf-2', quantity: 1 },
            { productId: 'bttf-3', quantity: 1 },
          ],
        })
        .expect(200);
      const body = response.body as PricedCartResponseDto;

      expect(body.total).toBe(36);
      body.lines.forEach((l: PricedLineResponseDto) =>
        expect(l.discountRate).toBe(20),
      );
    });

    /**
     * Example 2: 2 saga volumes -> 10% -> total 27 EUR
     */
    it('example 2 — 2 saga items -> 10% -> 27 EUR', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({
          items: [
            { productId: 'bttf-1', quantity: 1 },
            { productId: 'bttf-3', quantity: 1 },
          ],
        })
        .expect(200);
      const body = response.body as PricedCartResponseDto;

      expect(body.total).toBe(27);
      body.lines.forEach((l: PricedLineResponseDto) =>
        expect(l.discountRate).toBe(10),
      );
    });

    /**
     * Example 3: 1 saga volume -> 0% -> total 15 EUR
     */
    it('example 3 — 1 saga item -> 0% -> 15 EUR', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({ items: [{ productId: 'bttf-1', quantity: 1 }] })
        .expect(200);
      const body = response.body as PricedCartResponseDto;

      expect(body.total).toBe(15);
      body.lines.forEach((l: PricedLineResponseDto) =>
        expect(l.discountRate).toBe(0),
      );
    });

    /**
     * Example 4: vol1 + vol2 (qty 2) + vol3 -> 4 items -> 20% -> 48 EUR
     */
    it('example 4 — 4 saga items (vol2 x2) -> 20% -> 48 EUR', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({
          items: [
            { productId: 'bttf-1', quantity: 1 },
            { productId: 'bttf-2', quantity: 2 },
            { productId: 'bttf-3', quantity: 1 },
          ],
        })
        .expect(200);
      const body = response.body as PricedCartResponseDto;

      expect(body.total).toBe(48);
    });

    /**
     * Example 5: 3 saga volumes + standalone -> 36 + 20 = 56 EUR
     */
    it('example 5 — 3 saga items + standalone -> 56 EUR', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({
          items: [
            { productId: 'bttf-1', quantity: 1 },
            { productId: 'bttf-2', quantity: 1 },
            { productId: 'bttf-3', quantity: 1 },
            { productId: 'chevre', quantity: 1 },
          ],
        })
        .expect(200);
      const body = response.body as PricedCartResponseDto;

      expect(body.total).toBe(56);

      const sagaLines = body.lines.filter(
        (l: PricedLineResponseDto) => l.discountRate === 20,
      );
      const standaloneLines = body.lines.filter(
        (l: PricedLineResponseDto) => l.productId === 'chevre',
      );

      expect(sagaLines).toHaveLength(3);
      expect(standaloneLines[0].discountRate).toBe(0);
      expect(standaloneLines[0].lineTotal).toBe(20);
    });
  });

  // ─── Error handling ────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('returns 404 when a product does not exist', () => {
      return request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({ items: [{ productId: 'unknown-id', quantity: 1 }] })
        .expect(404);
    });

    it('404 body includes a meaningful message', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({ items: [{ productId: 'unknown-id', quantity: 1 }] })
        .expect(404);
      const body = response.body as { message: string };

      expect(body.message).toContain('unknown-id');
    });
  });

  // ─── Input validation (ValidationPipe) ────────────────────────────────────

  describe('input validation', () => {
    it('returns 400 when body is empty', () => {
      return request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({})
        .expect(400);
    });

    it('returns 400 when items array is empty', () => {
      return request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({ items: [] })
        .expect(400);
    });

    it('returns 400 when quantity is 0', () => {
      return request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({ items: [{ productId: 'bttf-1', quantity: 0 }] })
        .expect(400);
    });

    it('returns 400 when quantity is negative', () => {
      return request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({ items: [{ productId: 'bttf-1', quantity: -1 }] })
        .expect(400);
    });

    it('returns 400 when productId is missing', () => {
      return request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({ items: [{ quantity: 1 }] })
        .expect(400);
    });

    it('returns 400 when productId is empty string', () => {
      return request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({ items: [{ productId: '', quantity: 1 }] })
        .expect(400);
    });

    it('returns 400 when unknown fields are passed (forbidNonWhitelisted)', () => {
      return request(app.getHttpServer() as Server)
        .post('/cart/price')
        .send({
          items: [{ productId: 'bttf-1', quantity: 1 }],
          extraField: 'hack',
        })
        .expect(400);
    });
  });
});
