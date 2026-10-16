import React, { useState } from 'react';
import AuthCard, { Field, primaryButtonClass, textInputClass } from './AuthCard';
import PasswordInput from './PasswordInput';
import { ApiConfigError, ApiError, ApiUnreachableError } from '../services/api';
import { Session, lastTenant, login, rememberTenant, tenantFromHost } from '../services/auth';

interface LoginScreenProps {
  onLoggedIn: (session: Session) => void;
  /** Shown when the previous session ended (expired, signed out elsewhere). */
  notice?: string;
}

export function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiConfigError) return error.message;
  if (error instanceof ApiUnreachableError) return 'No se pudo conectar con el servidor. Verifica que la API esté en marcha.';
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Usuario o contraseña incorrectos.';
    if (error.status === 429) return 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.';
    if (error.code === 'invalid_host') return 'Gimnasio no válido.';
    if (error.status === 400) return 'Revisa los datos ingresados.';
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoggedIn, notice }) => {
  const hostTenant = tenantFromHost();
  const [tenant, setTenant] = useState(hostTenant ?? lastTenant());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const slug = (hostTenant ?? tenant).trim().toLowerCase();
      const session = await login(slug, username.trim(), password);
      if (!hostTenant) rememberTenant(slug);
      onLoggedIn(session);
    } catch (err) {
      setError(loginErrorMessage(err));
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard subtitle="Gym Intelligence System">
      <form onSubmit={submit} className="space-y-6">
        {!hostTenant && (
          <Field label="Gimnasio">
            <input
              type="text"
              required
              autoComplete="organization"
              value={tenant}
              onChange={(e) => setTenant(e.target.value)}
              placeholder="Identificador del gimnasio"
              className={textInputClass}
            />
          </Field>
        )}
        <Field label="Acceso de Usuario">
          <input
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuario"
            className={textInputClass}
          />
        </Field>
        <Field label="Contraseña">
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
        </Field>
        {notice && !error && <p role="status" className="text-amber-500 text-sm font-bold text-center">{notice}</p>}
        {error && <p role="alert" className="text-red-500 text-sm font-bold text-center">{error}</p>}
        <button disabled={busy} className={primaryButtonClass}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthCard>
  );
};

export default LoginScreen;
