import React, { useState } from 'react';
import AuthCard, { Field, primaryButtonClass } from './AuthCard';
import PasswordInput from './PasswordInput';
import { ApiError } from '../services/api';
import { Session, changePassword, login } from '../services/auth';
import { loginErrorMessage } from './LoginScreen';

const MIN_LENGTH = 10;
const MAX_LENGTH = 200;

/** Same rule the API enforces; checking here only saves a round trip. */
export function passwordProblem(current: string, next: string, confirm: string): string | null {
  if (next.length < MIN_LENGTH) return `La nueva contraseña debe tener al menos ${MIN_LENGTH} caracteres.`;
  if (next.length > MAX_LENGTH) return `La nueva contraseña no puede superar ${MAX_LENGTH} caracteres.`;
  if (!/\p{L}/u.test(next) || !/[^\p{L}]/u.test(next)) return 'Debe incluir al menos una letra y un número o símbolo.';
  if (next === current) return 'La nueva contraseña debe ser distinta de la actual.';
  if (next !== confirm) return 'La confirmación no coincide.';
  return null;
}

interface ChangePasswordScreenProps {
  session: Session;
  /** Receives a fresh session (the old token still says "password change pending"). */
  onChanged: (session: Session) => void;
  onExpired: () => void;
  onLogout: () => void;
}

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ session, onChanged, onExpired, onLogout }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(current, next, confirm);
    if (problem) {
      setError(problem);
      return;
    }

    setBusy(true);
    setError('');
    try {
      await changePassword(session.accessToken, current, next);
      onChanged(await login(session.tenantSlug, session.username, next));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onExpired();
      if (err instanceof ApiError && err.code === 'invalid_current_password') setError('La contraseña actual es incorrecta.');
      else if (err instanceof ApiError && err.code === 'weak_password') setError(err.message);
      else setError(loginErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard subtitle="Define tu contraseña">
      <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">
        Hola {session.user.displayName}. Entraste con una contraseña temporal: elige una propia para continuar.
      </p>
      <form onSubmit={submit} className="space-y-6">
        <Field label="Contraseña actual">
          <PasswordInput value={current} onChange={setCurrent} autoComplete="current-password" autoFocus />
        </Field>
        <Field label="Nueva contraseña">
          <PasswordInput value={next} onChange={setNext} autoComplete="new-password" />
        </Field>
        <Field label="Repite la nueva contraseña">
          <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" />
        </Field>
        {error && <p role="alert" className="text-red-500 text-sm font-bold text-center">{error}</p>}
        <button disabled={busy} className={primaryButtonClass}>
          {busy ? 'Guardando…' : 'Guardar y entrar'}
        </button>
        <button type="button" onClick={onLogout} className="w-full text-slate-500 hover:text-blue-500 text-sm font-bold transition-colors">
          Cancelar y salir
        </button>
      </form>
    </AuthCard>
  );
};

export default ChangePasswordScreen;
