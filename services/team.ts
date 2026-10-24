import { apiRequest } from './api';

export type StaffRole = 'owner' | 'admin' | 'reception';

export interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  role: StaffRole;
  isActive: boolean;
  /** False while the person has not yet created their password from the invitation. */
  passwordSet: boolean;
  lastLoginAt: string | null;
}

export interface Invited {
  id: string;
  /** False when the account exists but the mail server refused the invitation (resend it). */
  emailSent: boolean;
}

export const listTeam = () => apiRequest<TeamMember[]>('/users', { auth: true });

export const inviteStaff = (input: { name: string; email: string; role: 'admin' | 'reception' }) =>
  apiRequest<Invited>('/users', { body: input, auth: true });

export const updateStaff = (id: string, change: { isActive?: boolean; role?: 'admin' | 'reception' }) =>
  apiRequest<void>(`/users/${id}`, { method: 'PATCH', body: change, auth: true });

export const resendStaffInvite = (id: string) => apiRequest<{ emailSent: boolean }>(`/users/${id}/resend-invite`, { method: 'POST', auth: true });

export const ROLE_LABELS: Record<StaffRole, string> = { owner: 'Propietario', admin: 'Administrador', reception: 'Recepción' };

// ---- a customer's login for the app ---------------------------------------------------------------------------

export interface AccessStatus {
  hasAccess: boolean;
  email: string | null;
  isActive: boolean;
  passwordSet: boolean;
}

export const getAccess = (customerId: string) => apiRequest<AccessStatus>(`/customers/${customerId}/access`, { auth: true });

export const grantAccess = (customerId: string, email: string) =>
  apiRequest<Invited>(`/customers/${customerId}/access`, { body: { email }, auth: true });

export const resendAccess = (customerId: string) =>
  apiRequest<{ emailSent: boolean }>(`/customers/${customerId}/access/resend`, { method: 'POST', auth: true });
