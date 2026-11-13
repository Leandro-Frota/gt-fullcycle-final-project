import { OrderService } from './application/order-service.js';
import { createApp } from './http/app.js';
import { InMemoryOrderRepository } from './infra/in-memory-order-repository.js';

// Wires the concrete pieces together. For now orders live in memory;
// the Postgres repository replaces it later (J9).
const port = Number(process.env.PORT ?? 3000);
const app = createApp(new OrderService(new InMemoryOrderRepository()));

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
