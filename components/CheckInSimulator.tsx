import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ShieldAlert, Cpu, UserCircle, LogIn, LogOut } from 'lucide-react';
import { ApiError } from '../services/api';
import { checkIn, checkOut } from '../services/attendance';
import { errorText } from '../utils/errors';

type Mode = 'in' | 'out';

interface Outcome {
  tone: 'success' | 'denied' | 'warning';
  title: string;
  message: string;
  name?: string;
  code?: number;
}

const DENY_MESSAGES: Record<string, string> = {
  customer_inactive: 'Socio inactivo. Favor acudir a recepción.',
  closed: 'El gimnasio está cerrado hoy.',
  outside_hours: 'Fuera del horario de atención.',
  no_active_membership: 'Plan vencido o sin plan. Favor regularizar en recepción.',
};

const TONES: Record<Outcome['tone'], string> = {
  success: 'bg-green-500/10 border-green-500/50 text-green-500',
  denied: 'bg-red-500/10 border-red-500/50 text-red-500',
  warning: 'bg-amber-500/10 border-amber-500/50 text-amber-400',
};

/** Door terminal: every scan is decided and recorded by the server (plan, schedule, customer status). */
const CheckInSimulator: React.FC = () => {
  const [mode, setMode] = useState<Mode>('in');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const show = (next: Outcome) => {
    clearTimeout(hideTimer.current);
    setOutcome(next);
    hideTimer.current = setTimeout(() => setOutcome(null), 5000);
  };

  const handleAccess = async () => {
    if (busy) return;
    const clientCode = Number(code);
    if (!Number.isInteger(clientCode) || clientCode <= 0) {
      show({ tone: 'warning', title: 'Código no válido', message: 'Ingresa el código numérico del socio.' });
      return;
    }

    setBusy(true);
    try {
      const item = mode === 'in' ? await checkIn(clientCode) : await checkOut(clientCode);
      const who = { name: item.customerName, code: item.clientCode };
      if (mode === 'out') {
        show({ tone: 'success', title: 'Hasta pronto', message: `Salida registrada${item.minutes !== null ? ` · ${item.minutes} min de entreno` : ''}.`, ...who });
      } else if (item.result === 'granted') {
        show({ tone: 'success', title: 'Bienvenido', message: '¡Acceso correcto! Buen entreno.', ...who });
      } else {
        show({ tone: 'denied', title: 'Alto', message: DENY_MESSAGES[item.denyReason ?? ''] ?? 'Acceso denegado.', ...who });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return; // the session manager has already signed out
      if (err instanceof ApiError && err.status === 404) show({ tone: 'denied', title: 'Alto', message: 'Socio no registrado.' });
      else if (err instanceof ApiError && err.code === 'already_inside') show({ tone: 'warning', title: 'Ya está dentro', message: 'Este socio ya registró su entrada.' });
      else if (err instanceof ApiError && err.code === 'no_open_entry') show({ tone: 'warning', title: 'Sin entrada abierta', message: 'No hay una entrada registrada para marcar la salida.' });
      else show({ tone: 'warning', title: 'No se pudo registrar', message: errorText(err, 'Inténtalo de nuevo.') });
    } finally {
      setBusy(false);
      setCode('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Terminal de Acceso</h2>
        <p className="text-slate-400 mt-2">Registra entradas y salidas con el código del socio.</p>
      </div>

      <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 bg-blue-600/10 w-48 h-48 rounded-full blur-3xl"></div>

        <div className="relative z-10 space-y-8">
          <div className="flex justify-center">
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-700 shadow-inner">
              <Cpu className="text-blue-500 w-12 h-12 animate-pulse" />
            </div>
          </div>

          <div role="group" aria-label="Tipo de registro" className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-700">
            {([['in', 'Entrada', LogIn], ['out', 'Salida', LogOut]] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                  mode === value ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <label htmlFor="client-code" className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Escanee su código o ingréselo</label>
            <input
              id="client-code"
              type="number"
              inputMode="numeric"
              min={1}
              value={code}
              autoFocus
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAccess()}
              className="w-full bg-slate-900 border-2 border-slate-700 rounded-3xl px-4 py-6 text-5xl font-black tracking-[0.4em] text-center focus:border-blue-500 focus:outline-none text-white transition-all shadow-2xl"
              placeholder="0000"
            />
          </div>

          <button
            onClick={handleAccess}
            disabled={busy}
            className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black text-lg rounded-[1.5rem] transition-all shadow-xl shadow-blue-600/30 active:scale-95 uppercase tracking-widest"
          >
            {busy ? 'Validando…' : mode === 'in' ? 'Validar Acceso' : 'Registrar Salida'}
          </button>
        </div>

        {outcome && (
          <div role="status" className={`mt-10 p-6 rounded-3xl border-2 animate-in zoom-in duration-300 ${TONES[outcome.tone]}`}>
            <div className="flex items-start gap-5">
              <div className={`p-4 rounded-2xl shadow-lg text-white ${outcome.tone === 'success' ? 'bg-green-500' : outcome.tone === 'denied' ? 'bg-red-500' : 'bg-amber-500'}`}>
                {outcome.tone === 'success' ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-black uppercase tracking-tight">{outcome.title}</h4>
                <p className="font-bold text-slate-300 mt-1">{outcome.message}</p>
                {outcome.name && (
                  <div className="mt-4 flex items-center gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-700">
                    <UserCircle className="w-10 h-10 opacity-40 text-blue-400" />
                    <div>
                      <p className="text-white font-black text-lg leading-none">{outcome.name}</p>
                      <p className="text-xs uppercase font-black text-slate-500 mt-1.5 tracking-widest">Socio ID #{outcome.code}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInSimulator;
