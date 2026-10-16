import { ApiConfigError, ApiError, ApiUnreachableError } from '../services/api';

/** A message safe to show a person for anything the API layer can throw. */
export function errorText(error: unknown, fallback: string): string {
  if (error instanceof ApiConfigError) return error.message;
  if (error instanceof ApiUnreachableError) return 'No se pudo conectar con el servidor. Verifica que la API esté en marcha.';
  if (error instanceof ApiError) {
    if (error.status === 403) return 'No tienes permiso para ver esto.';
    if (error.status === 429) return 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.';
    if (error.status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en un momento.';
  }
  return error instanceof Error && !(error instanceof ApiError) ? error.message : fallback;
}
