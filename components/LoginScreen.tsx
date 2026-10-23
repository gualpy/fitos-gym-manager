import React, { useState } from 'react';
import AuthCard, { Field, primaryButtonClass, textInputClass } from './AuthCard';
import PasswordInput from './PasswordInput';
import { ApiConfigError, ApiError, ApiUnreachableError } from '../services/api';
import { PendingLogin, Session, lastTenant, login, rememberTenant, tenantFromHost } from '../services/auth';

interface LoginScreenProps {
  onLoggedIn: (session: Session) => void;
  /** Platform administrators: the password was right and the confirmation link was e-mailed. */
  onPending: (pending: PendingLogin) => void;
  /** Shown when the previous session ended (expired, signed out elsewhere). */
  notice?: string;
}

export function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiConfigError) return error.message;
  if (error instanceof ApiUnreachableError) return 'No se pudo conectar con el servidor. Verifica que la API esté en marcha.';
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Usuario o contraseña incorrectos.';
    if (error.code === 'email_unavailable') return 'No se pudo enviar el correo de confirmación. Inténtalo de nuevo en un momento.';
    if (error.code === 'tenant_inactive') return 'La suscripción de tu gimnasio está vencida o suspendida. Contacta al administrador de la plataforma.';
    if (error.code === 'confirmation_unavailable') return 'Esta cuenta no tiene un correo para confirmar el acceso. Pídele al administrador del sistema que lo configure.';
    if (error.code === 'invalid_link' || error.code === 'link_expired') return 'El enlace no es válido, venció o se abrió en otro navegador. Inicia sesión de nuevo.';
    if (error.status === 429) return 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.';
    if (error.code === 'invalid_host') return 'Gimnasio no válido.';
    if (error.status === 400) return 'Revisa los datos ingresados.';
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoggedIn, onPending, notice }) => {
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
      const outcome = await login(slug, username.trim(), password);
      if (!hostTenant) rememberTenant(slug);
      if ('session' in outcome) onLoggedIn(outcome.session);
      else onPending(outcome.pending);
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
