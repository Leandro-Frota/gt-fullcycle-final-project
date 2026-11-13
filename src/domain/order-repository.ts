import type { Order } from './order.js';

// Repository pattern: the rest of the app depends on this interface, not on a database.
// The in-memory and Postgres implementations are interchangeable.
export interface OrderRepository {
  insert(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
}
