import { describe, expect, it } from 'vitest';
import {
  createOrder,
  InvalidOrderError,
  MAX_CUSTOMER_NAME_LENGTH,
  type CreateOrderInput,
} from '../../src/domain/order.js';

const NOW = new Date('2026-11-13T12:00:00.000Z');

function validInput(overrides: Partial<CreateOrderInput> = {}): CreateOrderInput {
  return {
    customerName: 'Ana Souza',
    items: [
      { sku: 'CAFE-500G', quantity: 2, unitPriceCents: 3490 },
      { sku: 'FILTRO-103', quantity: 1, unitPriceCents: 1250 },
    ],
    ...overrides,
  };
}

// Runs createOrder expecting it to fail and returns the list of problems.
function problemsOf(input: CreateOrderInput): string[] {
  try {
    createOrder(input, 'order-1', NOW);
  } catch (error) {
    if (error instanceof InvalidOrderError) {
      return error.problems;
    }
    throw error;
  }
  throw new Error('expected createOrder to throw InvalidOrderError');
}

describe('createOrder', () => {
  it('creates a pending order with the total in cents (RN06, RN07)', () => {
    const order = createOrder(validInput(), 'order-1', NOW);

    expect(order).toEqual({
      id: 'order-1',
      customerName: 'Ana Souza',
      items: [
        { sku: 'CAFE-500G', quantity: 2, unitPriceCents: 3490 },
        { sku: 'FILTRO-103', quantity: 1, unitPriceCents: 1250 },
      ],
      totalCents: 2 * 3490 + 1250,
      status: 'pending',
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  it('trims spaces around the customer name and the sku', () => {
    const order = createOrder(
      validInput({
        customerName: '  Ana  ',
        items: [{ sku: ' CAFE-500G ', quantity: 1, unitPriceCents: 3490 }],
      }),
      'order-1',
      NOW,
    );

    expect(order.customerName).toBe('Ana');
    expect(order.items[0].sku).toBe('CAFE-500G');
  });

  it('accepts an item with price zero, like a free gift (RN05)', () => {
    const order = createOrder(
      validInput({ items: [{ sku: 'BRINDE', quantity: 1, unitPriceCents: 0 }] }),
      'order-1',
      NOW,
    );

    expect(order.totalCents).toBe(0);
  });

  it('rejects a blank customer name (RN01)', () => {
    expect(problemsOf(validInput({ customerName: '   ' }))).toEqual(['customerName is required']);
  });

  it('accepts a customer name exactly at the length limit (RN01)', () => {
    const customerName = 'a'.repeat(MAX_CUSTOMER_NAME_LENGTH);

    expect(createOrder(validInput({ customerName }), 'order-1', NOW).customerName).toBe(customerName);
  });

  it('rejects a customer name over the length limit (RN01)', () => {
    const customerName = 'a'.repeat(MAX_CUSTOMER_NAME_LENGTH + 1);

    expect(problemsOf(validInput({ customerName }))).toEqual([
      'customerName must be at most 100 characters',
    ]);
  });

  it('rejects an order without items (RN02)', () => {
    expect(problemsOf(validInput({ items: [] }))).toEqual(['order must have at least 1 item']);
  });

  it('rejects an item without sku (RN03)', () => {
    const items = [{ sku: '  ', quantity: 1, unitPriceCents: 100 }];

    expect(problemsOf(validInput({ items }))).toEqual(['items[0].sku is required']);
  });

  it.each([0, -1, 1.5])('rejects quantity %s (RN04)', (quantity) => {
    const items = [{ sku: 'CAFE-500G', quantity, unitPriceCents: 100 }];

    expect(problemsOf(validInput({ items }))).toEqual([
      'items[0].quantity must be an integer greater than 0',
    ]);
  });

  it.each([-1, 9.99])('rejects unit price %s (RN05)', (unitPriceCents) => {
    const items = [{ sku: 'CAFE-500G', quantity: 1, unitPriceCents }];

    expect(problemsOf(validInput({ items }))).toEqual([
      'items[0].unitPriceCents must be an integer greater than or equal to 0',
    ]);
  });

  it('reports every problem at once instead of only the first (RN10)', () => {
    const input = {
      customerName: '',
      items: [
        { sku: 'CAFE-500G', quantity: 1, unitPriceCents: 3490 },
        { sku: '', quantity: 0, unitPriceCents: -5 },
      ],
    };

    expect(problemsOf(input)).toEqual([
      'customerName is required',
      'items[1].sku is required',
      'items[1].quantity must be an integer greater than 0',
      'items[1].unitPriceCents must be an integer greater than or equal to 0',
    ]);
  });

  it('throws an InvalidOrderError whose message lists the problems', () => {
    expect(() => createOrder(validInput({ items: [] }), 'order-1', NOW)).toThrow(
      'Invalid order: order must have at least 1 item',
    );
  });
});
