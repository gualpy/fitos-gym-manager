import React, { useEffect, useRef, useState } from 'react';
import AuthCard, { Field, primaryButtonClass } from './AuthCard';
import PasswordInput from './PasswordInput';
import { loginErrorMessage } from './LoginScreen';
import { passwordProblem } from './ChangePasswordScreen';
import { ApiError } from '../services/api';
import { PendingLogin, Session, SetupInfo, clearPending, confirmLogin, setPasswordFromLink, setupInfo } from '../services/auth';

/** The password was right: tell the administrator to open the link in the e-mail, in this same browser. */
export const ConfirmationSentScreen: React.FC<{ pending: PendingLogin; onBack: () => void }> = ({ pending, onBack }) => {
  const minutes = Math.max(1, Math.round((Date.parse(pending.expiresAt) - Date.now()) / 60_000));
  return (
    <AuthCard subtitle="Confirma tu acceso">
      <p className="text-slate-600 dark:text-slate-300 text-sm text-center mb-4">
        Te enviamos un enlace al correo de la cuenta. Ábrelo <strong>en este mismo navegador</strong> para entrar.
      </p>
      <p className="text-slate-500 dark:text-slate-400 text-xs text-center mb-8">Vence en unos {minutes} minutos y sirve una sola vez.</p>
      <button type="button" onClick={() => { clearPending(); onBack(); }} className="w-full text-slate-500 hover:text-blue-500 text-sm font-bold transition-colors">
        Volver al inicio de sesión
      </button>
    </AuthCard>
  );
};

/** Opened from the e-mailed link (#confirm=…): finishes the login. A link works once, so it is spent exactly once. */
export const ConfirmLoginScreen: React.FC<{ token: string; onLoggedIn: (session: Session) => void; onDone: () => void }> = ({ token, onLoggedIn, onDone }) => {
  const [error, setError] = useState('');
  const started = useRef(false); // React may run effects twice in development: the link must not be burnt by the first run

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    confirmLogin(token)
      .then((session) => {
        onLoggedIn(session);
        onDone();
      })
      .catch((err) => setError(err instanceof ApiError || err instanceof Error ? loginErrorMessage(err) : 'No se pudo confirmar el acceso.'));
  }, [token, onLoggedIn, onDone]);

  return (
    <AuthCard subtitle="Confirma tu acceso">
      {error ? (
        <>
          <p role="alert" className="text-red-500 text-sm font-bold text-center mb-6">{error}</p>
          <button type="button" onClick={onDone} className={primaryButtonClass}>Ir al inicio de sesión</button>
        </>
      ) : (
        <p role="status" className="text-slate-500 text-sm font-bold text-center">Confirmando…</p>
      )}
    </AuthCard>
  );
};

/** Opened from a gym owner's welcome e-mail (#setup=…): choose the first password. */
export const SetPasswordScreen: React.FC<{ token: string; onDone: () => void }> = ({ token, onDone }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  // Who the link is for and which gym: shown right away, and an invalid link is reported before anything is typed.
  const [info, setInfo] = useState<SetupInfo | null>(null);
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setupInfo(token)
      .then((data) => !cancelled && setInfo(data))
      .catch((err) => !cancelled && setLinkError(err instanceof ApiError && err.code === 'invalid_link'
        ? 'El enlace no es válido, ya se usó o venció. Pide uno nuevo.'
        : loginErrorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem('', password, confirm);
    if (problem) {
      setError(problem);
      return;
    }

    setBusy(true);
    setError('');
    try {
      await setPasswordFromLink(token, password);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'invalid_link') setError('El enlace no es válido o ya se usó. Pide uno nuevo al administrador de la plataforma.');
      else if (err instanceof ApiError && err.code === 'link_expired') setError('El enlace venció. Pide uno nuevo al administrador de la plataforma.');
      else if (err instanceof ApiError && err.code === 'weak_password') setError(err.message);
      else setError(loginErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const title = info?.gymName ?? undefined;

  if (linkError) {
    return (
      <AuthCard subtitle="Enlace no disponible">
        <p role="alert" className="text-red-500 text-sm font-bold text-center mb-6">{linkError}</p>
        <button type="button" onClick={onDone} className={primaryButtonClass}>Ir al inicio de sesión</button>
      </AuthCard>
    );
  }

  if (saved) {
    return (
      <AuthCard subtitle="Contraseña creada" title={title}>
        <p className="text-slate-600 dark:text-slate-300 text-sm text-center mb-8">Listo. Ya puedes iniciar sesión con tu usuario y la contraseña que elegiste.</p>
        <button type="button" onClick={onDone} className={primaryButtonClass}>Iniciar sesión</button>
      </AuthCard>
    );
  }

  return (
    <AuthCard subtitle="Crea tu contraseña" title={title}>
      {info && <p className="text-slate-600 dark:text-slate-300 text-sm text-center mb-6">Hola {info.displayName}, elige la contraseña con la que entrarás.</p>}
      <form onSubmit={submit} className="space-y-6">
        <Field label="Contraseña">
          <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" autoFocus />
        </Field>
        <Field label="Repite la contraseña">
          <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" />
        </Field>
        {error && <p role="alert" className="text-red-500 text-sm font-bold text-center">{error}</p>}
        <button disabled={busy} className={primaryButtonClass}>{busy ? 'Guardando…' : 'Guardar contraseña'}</button>
      </form>
    </AuthCard>
  );
};
