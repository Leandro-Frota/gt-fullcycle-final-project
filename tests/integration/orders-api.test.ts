import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderService } from '../../src/application/order-service.js';
import { createApp } from '../../src/http/app.js';
import { InMemoryOrderRepository } from '../../src/infra/in-memory-order-repository.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// A valid UUID that is never generated, so it never matches a saved order.
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

const validBody = {
  customerName: 'Ana Souza',
  items: [
    { sku: 'CAFE-500G', quantity: 2, unitPriceCents: 3490 },
    { sku: 'FILTRO-103', quantity: 1, unitPriceCents: 1250 },
  ],
};

// Integration test: real HTTP layer -> service -> domain -> repository.
// Only the database is swapped for the in-memory repository.
describe('Orders API', () => {
  let orderService: OrderService;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    orderService = new OrderService(new InMemoryOrderRepository());
    app = createApp(orderService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /health answers ok (RF06)', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('creates an order and then retrieves it by id (RF01, RF02)', async () => {
    const created = await request(app).post('/orders').send(validBody);

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      customerName: 'Ana Souza',
      totalCents: 2 * 3490 + 1250,
      status: 'pending',
    });
    expect(created.body.id).toMatch(UUID);

    const fetched = await request(app).get(`/orders/${created.body.id}`);

    expect(fetched.status).toBe(200);
    expect(fetched.body).toEqual(created.body);
  });

  it('returns 400 with every broken business rule (RN01, RN02, RN10)', async () => {
    const response = await request(app).post('/orders').send({ customerName: '', items: [] });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({
      code: 'INVALID_ORDER',
      details: ['customerName is required', 'order must have at least 1 item'],
    });
  });

  it('returns 400 when the body has the wrong shape', async () => {
    const response = await request(app).post('/orders').send({ customerName: 42 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_ORDER');
    expect(response.body.error.details).toHaveLength(2);
  });

  it('returns 400 when the body is not valid JSON', async () => {
    const response = await request(app)
      .post('/orders')
      .set('content-type', 'application/json')
      .send('{"customerName": ');

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual({
      code: 'INVALID_ORDER',
      message: 'Request body is not valid JSON',
    });
  });

  it('returns 404 for an order that does not exist (RF02)', async () => {
    const response = await request(app).get(`/orders/${UNKNOWN_ID}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toEqual({
      code: 'ORDER_NOT_FOUND',
      message: `Order ${UNKNOWN_ID} not found`,
    });
  });

  it('returns a generic 500 without leaking internal details', async () => {
    vi.spyOn(orderService, 'getById').mockRejectedValue(new Error('database password is wrong'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(app).get(`/orders/${UNKNOWN_ID}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected internal error' } });
    expect(consoleError).toHaveBeenCalled();
  });
});
