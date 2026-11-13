import { describe, expect, it } from 'vitest';
import type { Order, OrderStatus } from '../../src/domain/order.js';
import {
  canTransition,
  InvalidTransitionError,
  transition,
  type OrderAction,
} from '../../src/domain/order-status.js';

const CREATED_AT = new Date('2026-11-13T12:00:00.000Z');
const NOW = new Date('2026-11-13T13:00:00.000Z');

function orderWith(status: OrderStatus): Order {
  return {
    id: 'order-1',
    customerName: 'Ana Souza',
    items: [{ sku: 'CAFE-500G', quantity: 1, unitPriceCents: 3490 }],
    totalCents: 3490,
    status,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
}

describe('valid transitions', () => {
  const valid: [OrderStatus, OrderAction, OrderStatus][] = [
    ['pending', 'pay', 'paid'],
    ['paid', 'ship', 'shipped'],
    ['pending', 'cancel', 'cancelled'],
  ];

  it.each(valid)('%s + %s -> %s', (from, action, to) => {
    const result = transition(orderWith(from), action, NOW);

    expect(result.status).toBe(to);
    expect(result.updatedAt).toEqual(NOW);
    expect(canTransition(from, action)).toBe(true);
  });

  it('does not mutate the original order', () => {
    const original = orderWith('pending');

    const result = transition(original, 'pay', NOW);

    expect(result).not.toBe(original);
    expect(original.status).toBe('pending');
    expect(original.updatedAt).toEqual(CREATED_AT);
  });

  it('preserves the other order fields', () => {
    const original = orderWith('pending');

    const result = transition(original, 'pay', NOW);

    expect(result.id).toBe(original.id);
    expect(result.customerName).toBe(original.customerName);
    expect(result.items).toEqual(original.items);
    expect(result.totalCents).toBe(original.totalCents);
    expect(result.createdAt).toEqual(CREATED_AT);
  });

  it('allows the full flow pending -> paid -> shipped', () => {
    const paid = transition(orderWith('pending'), 'pay', NOW);
    const shipped = transition(paid, 'ship', NOW);

    expect(shipped.status).toBe('shipped');
  });
});

describe('invalid transitions', () => {
  const invalid: [OrderStatus, OrderAction][] = [
    ['pending', 'ship'],
    ['paid', 'pay'],
    ['paid', 'cancel'],
    ['shipped', 'pay'],
    ['shipped', 'ship'],
    ['shipped', 'cancel'],
    ['cancelled', 'pay'],
    ['cancelled', 'ship'],
    ['cancelled', 'cancel'],
  ];

  it.each(invalid)('%s + %s throws InvalidTransitionError', (from, action) => {
    expect(() => transition(orderWith(from), action, NOW)).toThrow(InvalidTransitionError);
    expect(canTransition(from, action)).toBe(false);
  });

  it('reports the source status and the action in the error', () => {
    try {
      transition(orderWith('shipped'), 'cancel', NOW);
      expect.unreachable('should have thrown InvalidTransitionError');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTransitionError);
      const typed = error as InvalidTransitionError;
      expect(typed.from).toBe('shipped');
      expect(typed.action).toBe('cancel');
      expect(typed.message).toContain('cancel');
      expect(typed.message).toContain('shipped');
    }
  });

  it('does not change the order when the transition is invalid', () => {
    const original = orderWith('shipped');

    expect(() => transition(original, 'cancel', NOW)).toThrow();

    expect(original.status).toBe('shipped');
    expect(original.updatedAt).toEqual(CREATED_AT);
  });
});
