import type { Order } from '../domain/order.js';
import type { OrderRepository } from '../domain/order-repository.js';

// Keeps orders in a Map. Used by the tests and to run the API without a database.
export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();

  async insert(order: Order): Promise<void> {
    if (this.orders.has(order.id)) {
      throw new Error(`Order ${order.id} already exists`);
    }
    // Stores a copy, like a real database would, so later changes to the
    // caller's object don't leak into what was saved.
    this.orders.set(order.id, structuredClone(order));
  }

  async findById(id: string): Promise<Order | null> {
    const order = this.orders.get(id);
    return order ? structuredClone(order) : null;
  }
}
