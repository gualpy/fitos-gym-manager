import { ApiError, apiRequest, setAuthHooks } from './api';
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
  /** Rotates on every renewal; the server revokes the whole session if an old one is replayed. */
  refreshToken: string;
  refreshExpiresAt: string;
  user: SessionUser;
  /** What the user typed to log in; needed to log in again right after a forced password change. Not secret. */
  tenantSlug: string;
  username: string;
}

interface TokenResponse {
  accessToken: string;
  expiresAt: string;
  refreshToken: string;
  refreshExpiresAt: string;
  user: SessionUser;
}

export async function login(tenantSlug: string, username: string, password: string): Promise<Session> {
  const response = await apiRequest<TokenResponse>('/auth/login', { body: { username, password }, tenantSlug });
  return { ...response, tenantSlug, username };
}

/** Asks the server whether the session is still valid (renewing it if the access token just expired). */
export const fetchMe = () => apiRequest<{ id: string }>('/auth/me', { auth: true });

export const changePassword = (currentPassword: string, newPassword: string) =>
  apiRequest<void>('/auth/change-password', { body: { currentPassword, newPassword }, auth: true });

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

// ---- the current session -------------------------------------------------------------------------
// Kept in memory and mirrored in sessionStorage (it disappears when the tab closes).
const STORAGE_KEY = 'fitos.session';
const RENEW_BEFORE_EXPIRY_MS = 60_000;
const RETRY_AFTER_FAILURE_MS = 30_000;

export type SessionEndReason = 'expired';
type Listener = (session: Session | null, reason?: SessionEndReason) => void;

let current: Session | null = null;
let renewTimer: ReturnType<typeof setTimeout> | undefined;
let inFlight: Promise<boolean> | null = null;
const listeners = new Set<Listener>();

export const getSession = (): Session | null => current;

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const publish = (reason?: SessionEndReason) => listeners.forEach((listener) => listener(current, reason));

function persist(session: Session | null): void {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode): the session just will not survive a reload.
  }
}

function loadStored(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    // What matters is whether it can still be renewed, not whether the short access token has expired.
    const valid = typeof session.accessToken === 'string' && typeof session.refreshToken === 'string' && session.user?.id && Date.parse(session.refreshExpiresAt) > Date.now();
    return valid ? session : null;
  } catch {
    return null;
  }
}

function scheduleRenewal(delay?: number): void {
  clearTimeout(renewTimer);
  if (!current) return;
  const wait = delay ?? Math.max(5_000, Date.parse(current.expiresAt) - Date.now() - RENEW_BEFORE_EXPIRY_MS);
  renewTimer = setTimeout(() => void refreshSession(), wait);
}

/** Starts (or replaces) the session: a fresh login, or tokens just renewed. */
export function setSession(next: Session): void {
  current = next;
  persist(next);
  scheduleRenewal();
  publish();
}

export function clearSession(reason?: SessionEndReason): void {
  current = null;
  clearTimeout(renewTimer);
  persist(null);
  publish(reason);
}

/**
 * Renews the session. One renewal at a time: a second caller shares the first one's result, which matters because
 * the renewal token is single-use. A rejected token ends the session; a network failure does not (it retries later).
 */
export function refreshSession(): Promise<boolean> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const session = current;
    if (!session) return false;
    try {
      const renewed = await apiRequest<TokenResponse>('/auth/refresh', { body: { refreshToken: session.refreshToken } });
      setSession({ ...session, ...renewed });
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession('expired');
      } else {
        scheduleRenewal(RETRY_AFTER_FAILURE_MS); // server unreachable or busy: keep the session and try again
      }
      return false;
    }
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

/** Ends the session here at once and tells the server so the tokens stop working everywhere. */
export async function logout(): Promise<void> {
  const session = current;
  clearSession();
  if (!session) return;
  try {
    await apiRequest<void>('/auth/logout', { method: 'POST', token: session.accessToken });
  } catch {
    // Offline or already expired: the session is gone locally and its renewal token dies on its own.
  }
}

export type RestoreResult = 'none' | 'ok' | 'offline' | 'expired';

/** Picks up the session of this tab after a reload, but only if the server still accepts it. */
export async function restoreSession(): Promise<RestoreResult> {
  const stored = loadStored();
  if (!stored) {
    persist(null);
    return 'none';
  }

  current = stored;
  try {
    await fetchMe(); // renews transparently when the access token has just expired
    scheduleRenewal();
    publish();
    return 'ok';
  } catch (err) {
    if (!current || (err instanceof ApiError && err.status === 401)) {
      if (current) clearSession('expired');
      return 'expired';
    }
    scheduleRenewal(RETRY_AFTER_FAILURE_MS);
    publish();
    return 'offline'; // server unreachable: keep what we have
  }
}

setAuthHooks({ getAccessToken: () => current?.accessToken ?? null, refresh: refreshSession });

// A background tab's timers are throttled: renew as soon as the person comes back if the token is about to expire.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && current && Date.parse(current.expiresAt) - Date.now() < RENEW_BEFORE_EXPIRY_MS) {
      void refreshSession();
    }
  });
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
