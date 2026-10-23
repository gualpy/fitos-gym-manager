import { apiRequest } from './api';

export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired';

export interface TenantRow {
  id: string;
  name: string;
  slug: string;
  /** What is stored; `effectiveStatus` also accounts for an expired subscription. */
  status: TenantStatus;
  effectiveStatus: TenantStatus;
  subscriptionEndsOn: string;
  daysLeft: number;
  createdAt: string;
  customers: number;
}

export interface MonthRevenue {
  month: string;
  total: number;
  payments: number;
}

export interface NewTenant {
  slug: string;
  name: string;
  ruc: string;
  legalName: string;
  tradeName?: string;
  headOfficeAddress: string;
  regime: string;
  accountingRequired: boolean;
  providerCompanyId: string;
  providerApiKey: string;
  ownerUsername: string;
  ownerDisplayName: string;
  ownerEmail: string;
  environment: 'test' | 'production';
  sriEstablishment: string;
  emissionPointCode: string;
}

export interface OnboardResult {
  tenantId: string;
  slug: string;
  ownerUsername: string;
  /** False when the gym was created but the mail server refused the welcome message (resend it from the list). */
  welcomeEmailSent: boolean;
}

export const listTenants = () => apiRequest<TenantRow[]>('/platform/tenants', { auth: true });

export const onboardTenant = (input: NewTenant) =>
  apiRequest<OnboardResult>('/platform/tenants', { body: input, auth: true });

export const extendSubscription = (tenantId: string, months: number, amount: number) =>
  apiRequest<{ subscriptionEndsOn: string }>(`/platform/tenants/${tenantId}/subscription`, { body: { months, amount }, auth: true });

export const setTenantSuspended = (tenantId: string, suspended: boolean) =>
  apiRequest<void>(`/platform/tenants/${tenantId}/${suspended ? 'suspend' : 'reactivate'}`, { method: 'POST', auth: true });

export const resendWelcome = (tenantId: string) =>
  apiRequest<void>(`/platform/tenants/${tenantId}/resend-welcome`, { method: 'POST', auth: true });

export const monthlyRevenue = () => apiRequest<MonthRevenue[]>('/platform/revenue', { auth: true });

export const STATUS_LABELS: Record<TenantStatus, string> = {
  trial: 'En prueba',
  active: 'Activo',
  suspended: 'Suspendido',
  cancelled: 'Cancelado',
  expired: 'Vencido',
};
