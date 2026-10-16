/** Failure answered by the API: status, stable machine code and, for validation, per-field details. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** The request never got an answer (server down, CORS refused, offline). */
export class ApiUnreachableError extends Error {
  constructor() {
    super('No se pudo conectar con el servidor.');
    this.name = 'ApiUnreachableError';
  }
}

export class ApiConfigError extends Error {
  constructor() {
    super('Falta configurar VITE_API_URL (ver .env.example).');
    this.name = 'ApiConfigError';
  }
}

export const apiBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL?.trim();
  if (!url) {
    throw new ApiConfigError();
  }
  return url.replace(/\/+$/, '');
};

/** Registered by the session manager so this module needs no knowledge of sessions (and no circular import). */
interface AuthHooks {
  getAccessToken: () => string | null;
  /** Renews the session; resolves true when a new access token is available. */
  refresh: () => Promise<boolean>;
}

let authHooks: AuthHooks | null = null;

export const setAuthHooks = (hooks: AuthHooks): void => {
  authHooks = hooks;
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Explicit bearer token (used where the session is being created or torn down). */
  token?: string;
  /** Use the current session's access token; on a 401 renew the session once and retry. */
  auth?: boolean;
  /** Gym slug. The API only honours it in development; in production the gym comes from the host name. */
  tenantSlug?: string;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await send<T>(path, options, options.auth ? (authHooks?.getAccessToken() ?? undefined) : options.token);
  } catch (err) {
    // The access token is short-lived: renew the session once and replay the request.
    if (options.auth && authHooks && err instanceof ApiError && err.status === 401 && (await authHooks.refresh())) {
      return send<T>(path, options, authHooks.getAccessToken() ?? undefined);
    }
    throw err;
  }
}

async function send<T>(path: string, options: RequestOptions, token: string | undefined): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.tenantSlug) headers['X-Tenant-Slug'] = options.tenantSlug;

  const url = `${apiBaseUrl()}${path}`; // throws ApiConfigError before any network call
  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiUnreachableError();
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Not JSON (proxy error page): fall through with a generic error.
  }

  if (!response.ok) {
    const error = (json as { error?: { code?: string; message?: string; details?: Record<string, string> } } | null)?.error;
    throw new ApiError(response.status, error?.code ?? `http_${response.status}`, error?.message ?? response.statusText, error?.details);
  }

  return json as T;
}
