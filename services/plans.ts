import { apiRequest } from './api';

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  ivaRate: number;
  durationMonths: number;
  isPromotion: boolean;
  isActive: boolean;
}

export interface PlanInput {
  name: string;
  description: string;
  price: number;
  ivaRate?: number;
  durationMonths: number;
  isPromotion: boolean;
}

export const listPlans = (includeInactive = false) =>
  apiRequest<Plan[]>(`/plans${includeInactive ? '?includeInactive=true' : ''}`, { auth: true });

export const createPlan = (input: PlanInput) => apiRequest<Plan>('/plans', { method: 'POST', body: input, auth: true });

export const updatePlan = (id: string, input: PlanInput) =>
  apiRequest<Plan>(`/plans/${id}`, { method: 'PUT', body: input, auth: true });

export const setPlanActive = (id: string, isActive: boolean) =>
  apiRequest<Plan>(`/plans/${id}/active`, { method: 'PUT', body: { isActive }, auth: true });
