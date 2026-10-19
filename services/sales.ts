import { apiRequest } from './api';

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'transfer' | 'other';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'debit_card', label: 'Tarjeta de débito' },
  { value: 'credit_card', label: 'Tarjeta de crédito' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'other', label: 'Otro' },
];

export interface SaleInput {
  customerId?: string;
  lines: { productId: string; quantity: number }[];
  payments: { method: PaymentMethod; amount: number }[];
}

export interface Sale {
  id: string;
  customerId: string | null;
  createdAt: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  lines: { productId: string; description: string; quantity: number; unitPrice: number; ivaRate: number; lineTotal: number }[];
  payments: { method: PaymentMethod; amount: number }[];
}

export const createSale = (input: SaleInput) => apiRequest<Sale>('/sales', { method: 'POST', body: input, auth: true });

export interface CartLine {
  price: number;
  ivaRate: number;
  quantity: number;
}

/**
 * What the server will charge, for the screen only: same rules (IVA on the sum of each rate, half-up cents).
 * The server recomputes everything from its own catalogue and refuses the sale if the amounts differ.
 */
export function cartTotals(lines: CartLine[]): { subtotal: number; tax: number; total: number } {
  const cents = (value: number) => Math.round(value * 100);
  const byRate = new Map<number, number>();
  let subtotal = 0;
  for (const line of lines) {
    const lineCents = cents(line.price) * line.quantity;
    subtotal += lineCents;
    byRate.set(line.ivaRate, (byRate.get(line.ivaRate) ?? 0) + lineCents);
  }
  let tax = 0;
  for (const [rate, base] of byRate) tax += Math.round((base * rate) / 100);
  return { subtotal: subtotal / 100, tax: tax / 100, total: (subtotal + tax) / 100 };
}
