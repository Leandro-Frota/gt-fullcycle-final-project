import { randomUUID } from 'node:crypto';
import { createOrder, type CreateOrderInput, type Order } from '../domain/order.js';
import type { OrderRepository } from '../domain/order-repository.js';

export class OrderNotFoundError extends Error {
  constructor(public readonly orderId: string) {
    super(`Order ${orderId} not found`);
    this.name = 'OrderNotFoundError';
  }
}

// Use cases for orders. Knows the domain and the repository interface,
// but nothing about HTTP or which database is behind the repository.
export class OrderService {
  constructor(private readonly repository: OrderRepository) {}

  async create(input: CreateOrderInput): Promise<Order> {
    const order = createOrder(input, randomUUID(), new Date());
    await this.repository.insert(order);
    return order;
  }

  async getById(id: string): Promise<Order> {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new OrderNotFoundError(id);
    }
    return order;
  }
}
