import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, UserPlus } from 'lucide-react';
import { ApiError } from '../services/api';
import { Session } from '../services/auth';
import { ROLE_LABELS, StaffRole, TeamMember, inviteStaff, listTeam, resendStaffInvite, updateStaff } from '../services/team';
import { errorText, formErrorText } from '../utils/errors';

const cardClass = 'bg-white dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none';
const fieldClass =
  'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none w-full';
const buttonClass = 'px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50';
const primary = `${buttonClass} bg-blue-600 hover:bg-blue-500 text-white`;
const secondary = `${buttonClass} border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-500`;
const errorBox = 'text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-5 py-3';
const okBox = 'text-sm font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl px-5 py-3';

/** The people who work at the gym. The owner creates administrators and receptionists; an administrator only receptionists. */
const TeamManager: React.FC<{ session: Session }> = ({ session }) => {
  const isOwner = session.user.role === 'owner';
  const myId = session.user.id;
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'reception'>('reception');
  const [inviting, setInviting] = useState(false);

  const load = useCallback(() => {
    listTeam()
      .then(setMembers)
      .catch((err) => !(err instanceof ApiError && err.status === 401) && setError(errorText(err, 'No se pudo cargar el equipo.')));
  }, []);

  useEffect(load, [load]);

  /** Receptionists are the only role an administrator manages; the owner manages everyone but themselves. */
  const canManage = (m: TeamMember) => m.id !== myId && (isOwner ? true : m.role === 'reception');

  const run = async (key: string, action: () => Promise<string | void>) => {
    setBusy(key);
    setError('');
    setNotice('');
    try {
      const message = await action();
      if (message) setNotice(message);
      load();
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) setError(formErrorText(err, 'No se pudo completar la acción.'));
    } finally {
      setBusy(null);
    }
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError('');
    setNotice('');
    try {
      const result = await inviteStaff({ name: name.trim(), email: email.trim(), role });
      setNotice(result.emailSent
        ? `Invitación enviada a ${email.trim()}. Entrará con su correo.`
        : `La cuenta se creó, pero el correo no salió. Usa "Reenviar invitación" en la lista.`);
      setName('');
      setEmail('');
      load();
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) setError(formErrorText(err, 'No se pudo invitar.'));
    } finally {
      setInviting(false);
    }
  };

  const stateOf = (m: TeamMember) => (!m.isActive ? { label: 'Desactivado', cls: 'bg-red-500/10 text-red-600 dark:text-red-400' }
    : !m.passwordSet ? { label: 'Invitación pendiente', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
      : { label: 'Activo', cls: 'bg-green-500/10 text-green-600 dark:text-green-400' });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Equipo</h2>
          <p className="text-slate-500 dark:text-slate-400">Las personas que trabajan en el gimnasio. Cada una recibe un correo para crear su contraseña.</p>
        </div>
        <button type="button" onClick={load} className={`${secondary} flex items-center gap-2`}><RefreshCw className="w-4 h-4" /> Actualizar</button>
      </div>

      {error && <p role="alert" className={errorBox}>{error}</p>}
      {notice && <p role="status" className={okBox}>{notice}</p>}

      <form onSubmit={invite} autoComplete="off" className={`${cardClass} grid sm:grid-cols-4 gap-4 items-end`}>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1 sm:col-span-1">
          Nombre
          <input autoComplete="off" required value={name} onChange={(e) => setName(e.target.value)} className={`${fieldClass} block`} />
        </label>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1 sm:col-span-1">
          Correo
          <input autoComplete="off" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${fieldClass} block`} />
        </label>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1">
          Rol
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'reception')} className={`${fieldClass} block`}>
            <option value="reception">Recepción</option>
            {isOwner && <option value="admin">Administrador</option>}
          </select>
        </label>
        <button disabled={inviting} className={`${primary} flex items-center justify-center gap-2`}><UserPlus className="w-4 h-4" /> {inviting ? 'Enviando…' : 'Invitar'}</button>
      </form>

      {members === null && !error && <p className="text-center py-12 text-slate-500 font-bold">Cargando…</p>}

      <div className="grid gap-4">
        {members?.map((m) => {
          const state = stateOf(m);
          return (
            <div key={m.id} className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{m.name}{m.id === myId && <span className="text-xs font-bold text-slate-400"> (tú)</span>}</p>
                  <p className="text-xs text-slate-500 font-bold">{m.email ?? 'sin correo'} · {ROLE_LABELS[m.role]}</p>
                </div>
                <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${state.cls}`}>{state.label}</span>
              </div>
              {canManage(m) && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <button
                    type="button"
                    disabled={busy === m.id}
                    onClick={() => void run(m.id, async () => { await updateStaff(m.id, { isActive: !m.isActive }); return m.isActive ? `${m.name} quedó desactivado y se cerró su sesión.` : `${m.name} se reactivó.`; })}
                    className={secondary}
                  >
                    {m.isActive ? 'Desactivar' : 'Reactivar'}
                  </button>
                  {!m.passwordSet && m.isActive && (
                    <button
                      type="button"
                      disabled={busy === m.id}
                      onClick={() => void run(m.id, async () => { const r = await resendStaffInvite(m.id); return r.emailSent ? `Invitación reenviada a ${m.email}.` : 'El correo no salió. Revisa la configuración del correo.'; })}
                      className={secondary}
                    >
                      Reenviar invitación
                    </button>
                  )}
                  {isOwner && m.role !== 'owner' && (
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-2 ml-auto">
                      Rol
                      <select
                        value={m.role}
                        disabled={busy === m.id}
                        onChange={(e) => void run(m.id, async () => { await updateStaff(m.id, { role: e.target.value as 'admin' | 'reception' }); return `${m.name} ahora es ${ROLE_LABELS[e.target.value as StaffRole].toLowerCase()}.`; })}
                        className={`${fieldClass} w-auto`}
                      >
                        <option value="reception">Recepción</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </label>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamManager;
