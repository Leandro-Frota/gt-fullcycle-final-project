import express, { type ErrorRequestHandler } from 'express';
import { z } from 'zod';
import { OrderNotFoundError, type OrderService } from '../application/order-service.js';
import { InvalidOrderError } from '../domain/order.js';

// zod only checks the shape and types of the JSON body.
// The business rules (RN01–RN07) stay in the domain, in createOrder.
const createOrderBody = z.object({
  customerName: z.string(),
  items: z.array(
    z.object({
      sku: z.string(),
      quantity: z.number(),
      unitPriceCents: z.number(),
    }),
  ),
});

// Builds the app without opening a port, so tests can use it directly.
export function createApp(orderService: OrderService) {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/orders', async (req, res) => {
    const input = createOrderBody.parse(req.body);
    const order = await orderService.create(input);
    res.status(201).json(order);
  });

  app.get('/orders/:id', async (req, res) => {
    const order = await orderService.getById(req.params.id);
    res.json(order);
  });

  app.use(errorHandler);
  return app;
}

// Turns errors into the JSON format agreed in section 4.3 of the plan:
// { "error": { "code", "message", "details"? } }
const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof z.ZodError) {
    const details = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    res.status(400).json({ error: { code: 'INVALID_ORDER', message: 'Formato da requisição inválido', details } });
    return;
  }

  if (error instanceof InvalidOrderError) {
    res.status(400).json({ error: { code: 'INVALID_ORDER', message: error.message, details: error.problems } });
    return;
  }

  if (error instanceof OrderNotFoundError) {
    res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: error.message } });
    return;
  }

  // Malformed JSON body, rejected by express.json() before reaching the routes.
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: { code: 'INVALID_ORDER', message: 'O corpo da requisição não é um JSON válido' } });
    return;
  }

  console.error(error);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno inesperado' } });
};
