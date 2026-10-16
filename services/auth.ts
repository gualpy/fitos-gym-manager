import { apiRequest } from './api';
import { UserRole } from '../types';

export type ApiRole = 'platform_admin' | 'owner' | 'admin' | 'reception' | 'customer';

export interface SessionUser {
  id: string;
  tenantId: string | null;
  displayName: string;
  role: ApiRole;
  mustChangePassword: boolean;
  customerId: string | null;
}

export interface Session {
  accessToken: string;
  expiresAt: string;
  user: SessionUser;
  /** What the user typed to log in; needed to log in again right after a forced password change. Not secret. */
  tenantSlug: string;
  username: string;
}

interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  user: SessionUser;
}

export async function login(tenantSlug: string, username: string, password: string): Promise<Session> {
  const response = await apiRequest<LoginResponse>('/auth/login', {
    body: { username, password },
    tenantSlug,
  });
  return { accessToken: response.accessToken, expiresAt: response.expiresAt, user: response.user, tenantSlug, username };
}

/** Asks the server whether the token is still valid (signature, expiry). */
export const fetchMe = (token: string) => apiRequest<{ id: string }>('/auth/me', { token });

export const changePassword = (token: string, currentPassword: string, newPassword: string) =>
  apiRequest<void>('/auth/change-password', { body: { currentPassword, newPassword }, token });

/** Platform administrators have no gym; this panel is for gym staff and customers. */
export const toUiRole = (role: ApiRole): UserRole | null => {
  switch (role) {
    case 'customer':
      return UserRole.CUSTOMER;
    case 'owner':
    case 'admin':
    case 'reception':
      return UserRole.ADMIN;
    default:
      return null;
  }
};

export const roleLabel = (role: ApiRole): string =>
  ({ platform_admin: 'Plataforma', owner: 'Propietario', admin: 'Administrador', reception: 'Recepción', customer: 'Socio' })[role];

// ---- session storage -----------------------------------------------------------------------------
// sessionStorage: the token disappears when the tab is closed. (There is no refresh token yet.)
const STORAGE_KEY = 'fitos.session';

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    const valid = typeof session.accessToken === 'string' && session.user?.id && Date.parse(session.expiresAt) > Date.now();
    return valid ? session : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage blocked (private mode): the session just will not survive a reload.
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}

// ---- gym (tenant) --------------------------------------------------------------------------------
const LAST_TENANT_KEY = 'fitos.lastTenant';

/** In production the gym is the sub-domain (titan.<VITE_BASE_DOMAIN>); without that config it is typed. */
export function tenantFromHost(hostname: string = window.location.hostname): string | null {
  const base = import.meta.env.VITE_BASE_DOMAIN?.trim().toLowerCase();
  const host = hostname.toLowerCase();
  if (!base || !host.endsWith(`.${base}`)) return null;
  const label = host.slice(0, -(base.length + 1));
  return /^[a-z0-9][a-z0-9-]{0,62}$/.test(label) ? label : null;
}

export const rememberTenant = (slug: string): void => {
  try {
    localStorage.setItem(LAST_TENANT_KEY, slug);
  } catch {
    // convenience only
  }
};

export const lastTenant = (): string => {
  try {
    return localStorage.getItem(LAST_TENANT_KEY) ?? '';
  } catch {
    return '';
  }
};
