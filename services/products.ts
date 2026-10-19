import { apiRequest } from './api';

export interface Product {
  id: string;
  sku: string | null;
  barcode: string | null;
  name: string;
  category: string | null;
  /** Without IVA. */
  price: number;
  ivaRate: number;
  stock: number;
  isActive: boolean;
}

export interface ProductInput {
  sku: string;
  barcode: string;
  name: string;
  category: string;
  price: number;
  ivaRate: number;
  /** Opening stock; only used when creating. */
  stock?: number;
}

export type StockReason = 'purchase' | 'adjustment';

export const listProducts = (options: { q?: string; includeInactive?: boolean } = {}) => {
  const params = new URLSearchParams();
  if (options.q) params.set('q', options.q);
  if (options.includeInactive) params.set('includeInactive', 'true');
  const query = params.toString();
  return apiRequest<Product[]>(`/products${query ? `?${query}` : ''}`, { auth: true });
};

export const createProduct = (input: ProductInput) => apiRequest<Product>('/products', { method: 'POST', body: input, auth: true });

export const updateProduct = (id: string, input: ProductInput) =>
  apiRequest<Product>(`/products/${id}`, { method: 'PUT', body: input, auth: true });

export const setProductActive = (id: string, isActive: boolean) =>
  apiRequest<Product>(`/products/${id}/active`, { method: 'PUT', body: { isActive }, auth: true });

export const adjustStock = (id: string, delta: number, reason: StockReason) =>
  apiRequest<Product>(`/products/${id}/stock`, { method: 'POST', body: { delta, reason }, auth: true });
