export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled';

export interface OrderItem {
  sku: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalCents: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  customerName: string;
  items: OrderItem[];
}

export const MAX_CUSTOMER_NAME_LENGTH = 100;

export class InvalidOrderError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Pedido inválido: ${problems.join('; ')}`);
    this.name = 'InvalidOrderError';
  }
}

// id and date are injected so the function is deterministic in tests.
export function createOrder(input: CreateOrderInput, id: string, now: Date): Order {
  const problems = validate(input);
  if (problems.length > 0) {
    throw new InvalidOrderError(problems);
  }

  return {
    id,
    customerName: input.customerName.trim(),
    items: input.items.map((item) => ({ ...item, sku: item.sku.trim() })),
    totalCents: calculateTotal(input.items),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
}

// Collects every problem instead of stopping at the first one (RN10).
function validate(input: CreateOrderInput): string[] {
  const problems: string[] = [];
  const customerName = input.customerName.trim();

  if (customerName === '') {
    problems.push('customerName é obrigatório');
  } else if (customerName.length > MAX_CUSTOMER_NAME_LENGTH) {
    problems.push(`customerName deve ter no máximo ${MAX_CUSTOMER_NAME_LENGTH} caracteres`);
  }

  if (input.items.length === 0) {
    problems.push('o pedido precisa de pelo menos 1 item');
  }

  input.items.forEach((item, index) => {
    if (item.sku.trim() === '') {
      problems.push(`items[${index}].sku é obrigatório`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      problems.push(`items[${index}].quantity deve ser um inteiro maior que 0`);
    }
    if (!Number.isInteger(item.unitPriceCents) || item.unitPriceCents < 0) {
      problems.push(`items[${index}].unitPriceCents deve ser um inteiro maior ou igual a 0`);
    }
  });

  return problems;
}

// Money as integer cents avoids floating-point rounding errors (0.1 + 0.2 !== 0.3).
function calculateTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + item.quantity * item.unitPriceCents, 0);
}
