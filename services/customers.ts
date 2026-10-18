import { apiRequest } from './api';

export type CustomerStatus = 'active' | 'inactive';

export interface Customer {
  id: string;
  clientCode: number;
  name: string;
  identificationType: string | null;
  identification: string | null;
  email: string | null;
  phone: string | null;
  gender: 'M' | 'F' | 'O' | null;
  birthDate: string | null;
  rfidCard: string | null;
  status: CustomerStatus;
  joinedAt: string;
  /** Last day of the membership covering today; null when there is none. */
  activeUntil: string | null;
}

export interface CustomerInput {
  name: string;
  identificationType?: string;
  identification?: string;
  email?: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  rfidCard?: string;
}

export interface CustomerPage {
  items: Customer[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CustomerFilters {
  q?: string;
  status?: CustomerStatus;
  page?: number;
  pageSize?: number;
}

export const searchCustomers = (filters: CustomerFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  const query = params.toString();
  return apiRequest<CustomerPage>(`/customers${query ? `?${query}` : ''}`, { auth: true });
};

export const createCustomer = (input: CustomerInput) =>
  apiRequest<Customer>('/customers', { method: 'POST', body: input, auth: true });

export const setCustomerStatus = (id: string, status: CustomerStatus) =>
  apiRequest<Customer>(`/customers/${id}/status`, { method: 'PUT', body: { status }, auth: true });

export const assignMembership = (customerId: string, planId: string, startsOn?: string) =>
  apiRequest<unknown>(`/customers/${customerId}/memberships`, { method: 'POST', body: { planId, startsOn }, auth: true });

/** Whole years between a birth date (YYYY-MM-DD) and today, or null when unknown. */
export const ageOf = (birthDate: string | null): number | null => {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
};
