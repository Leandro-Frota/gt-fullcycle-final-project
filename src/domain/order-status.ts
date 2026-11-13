import type { Order, OrderStatus } from './order.js';

export type OrderAction = 'pay' | 'ship' | 'cancel';

// Single source of truth for the lifecycle:
// pending -> paid -> shipped, and pending -> cancelled.
// Anything not listed here is an invalid transition.
const TRANSITIONS: Record<OrderStatus, Partial<Record<OrderAction, OrderStatus>>> = {
  pending: { pay: 'paid', cancel: 'cancelled' },
  paid: { ship: 'shipped' },
  shipped: {},
  cancelled: {},
};

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: OrderStatus,
    public readonly action: OrderAction,
  ) {
    super(`Transição inválida: não é possível executar "${action}" em um pedido ${from}`);
    this.name = 'InvalidTransitionError';
  }
}

export function canTransition(from: OrderStatus, action: OrderAction): boolean {
  return TRANSITIONS[from][action] !== undefined;
}

// Returns a new order; the original is never mutated.
export function transition(order: Order, action: OrderAction, now: Date): Order {
  const next = TRANSITIONS[order.status][action];
  if (next === undefined) {
    throw new InvalidTransitionError(order.status, action);
  }
  return { ...order, status: next, updatedAt: now };
}
