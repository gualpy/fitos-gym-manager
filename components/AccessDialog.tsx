import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ApiError } from '../services/api';
import { AccessStatus, getAccess, grantAccess, resendAccess } from '../services/team';
import { errorText, formErrorText } from '../utils/errors';

interface AccessDialogProps {
  customer: { id: string; name: string; email: string | null };
  onClose: () => void;
}

const fieldClass =
  'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none w-full';
const primary = 'w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-sm';

/** Gives a customer a login for the app: an invitation e-mail (in the gym's name) lets them create a password. */
const AccessDialog: React.FC<AccessDialogProps> = ({ customer, onClose }) => {
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const [email, setEmail] = useState(customer.email ?? '');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAccess(customer.id)
      .then((s) => !cancelled && setStatus(s))
      .catch((err) => !cancelled && !(err instanceof ApiError && err.status === 401) && setError(errorText(err, 'No se pudo consultar el acceso.')));
    return () => {
      cancelled = true;
    };
  }, [customer.id]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await grantAccess(customer.id, email.trim());
      setNotice(result.emailSent ? `Invitación enviada a ${email.trim()}.` : 'Se creó el acceso, pero el correo no salió. Puedes reenviarlo desde aquí.');
      setStatus(await getAccess(customer.id));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) setError(formErrorText(err, 'No se pudo dar acceso.'));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await resendAccess(customer.id);
      setNotice(result.emailSent ? 'Invitación reenviada.' : 'El correo no salió. Revisa la configuración del correo.');
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) setError(formErrorText(err, 'No se pudo reenviar.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Acceso a la app · {customer.name}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-colors"><X className="w-8 h-8" /></button>
        </div>
        <div className="p-10 space-y-6">
          {error && <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>}
          {notice && <p role="status" className="text-sm font-bold text-green-700 dark:text-green-400">{notice}</p>}
          {status === null && !error && <p className="text-slate-500 font-bold">Consultando…</p>}

          {status?.hasAccess ? (
            <>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                {status.passwordSet
                  ? <>Este socio ya tiene acceso. Entra con <strong>{status.email}</strong>.</>
                  : <>Invitación enviada a <strong>{status.email}</strong>. Aún no crea su contraseña.</>}
              </p>
              {!status.passwordSet && <button type="button" disabled={busy} onClick={resend} className={primary}>{busy ? 'Enviando…' : 'Reenviar invitación'}</button>}
            </>
          ) : status && (
            <form onSubmit={send} autoComplete="off" className="space-y-6">
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Le llegará un correo con un enlace para crear su contraseña. Entrará con su correo.
              </p>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1 block">
                Correo del socio
                <input autoComplete="off" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${fieldClass} mt-1`} />
              </label>
              <button disabled={busy} className={primary}>{busy ? 'Enviando…' : 'Enviar invitación'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessDialog;
