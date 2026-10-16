import React, { useEffect, useState } from 'react';
import { Clock, Calendar, ArrowRightLeft, RefreshCw, ShieldAlert } from 'lucide-react';
import { ApiError } from '../services/api';
import { Session } from '../services/auth';
import {
  AttendanceFilters,
  AttendancePage,
  AttendanceResult,
  denyReasonLabel,
  listAttendance,
  listCustomerAttendance,
  shortTime,
} from '../services/attendance';
import { errorText } from '../utils/errors';

interface AttendanceHistoryProps {
  session: Session;
}

const PAGE_SIZE = 20;

const fieldClass =
  'bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none';

/** Staff see every scan of the gym; a customer sees only their own. Everything comes from the API. */
const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ session }) => {
  const isCustomer = session.user.role === 'customer';
  const customerId = session.user.customerId;
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [result, setResult] = useState<'' | AttendanceResult>('');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<AttendancePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const filters: AttendanceFilters = { from: from || undefined, to: to || undefined, page, pageSize: PAGE_SIZE };
    if (!isCustomer && result) filters.result = result;

    setLoading(true);
    setError('');
    const request = isCustomer
      ? customerId
        ? listCustomerAttendance(customerId, filters)
        : Promise.reject(new Error('Tu cuenta no está asociada a un socio.'))
      : listAttendance(filters);

    request
      .then((response) => !cancelled && setData(response))
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return; // the session manager has already signed out
        setError(errorText(err, 'No se pudo cargar la asistencia.'));
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [isCustomer, customerId, from, to, result, page, reload]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const filtered = Boolean(from || to || result);
  const change = (apply: () => void) => {
    apply();
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Registro de Asistencia</h2>
          <p className="text-slate-400">
            {isCustomer ? 'Tus entradas al gimnasio.' : 'Control de entradas detectadas por el sistema de acceso.'}
          </p>
        </div>
        <div className="bg-slate-800 px-5 py-3 rounded-2xl border border-slate-700 shadow-lg">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Registros</span>
          <span className="text-2xl font-black text-blue-500">{data?.total ?? '—'}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-700">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1">
          Desde
          <input type="date" value={from} max={to || undefined} onChange={(e) => change(() => setFrom(e.target.value))} className={`${fieldClass} block`} />
        </label>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1">
          Hasta
          <input type="date" value={to} min={from || undefined} onChange={(e) => change(() => setTo(e.target.value))} className={`${fieldClass} block`} />
        </label>
        {!isCustomer && (
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1">
            Resultado
            <select value={result} onChange={(e) => change(() => setResult(e.target.value as '' | AttendanceResult))} className={`${fieldClass} block`}>
              <option value="">Todos</option>
              <option value="granted">Concedidos</option>
              <option value="denied">Denegados</option>
            </select>
          </label>
        )}
        {filtered && (
          <button
            type="button"
            onClick={() => change(() => { setFrom(''); setTo(''); setResult(''); })}
            className="text-sm font-bold text-slate-400 hover:text-blue-400 px-2 py-2"
          >
            Limpiar
          </button>
        )}
        <button
          type="button"
          onClick={() => setReload((n) => n + 1)}
          disabled={loading}
          aria-label="Actualizar"
          className="ml-auto flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-blue-400 disabled:opacity-50 px-3 py-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-4 bg-red-500/10 border border-red-500/40 text-red-400 rounded-2xl px-5 py-4 font-bold">
          <span>{error}</span>
          <button type="button" onClick={() => setReload((n) => n + 1)} className="underline">Reintentar</button>
        </div>
      )}

      <div className="grid gap-4">
        {loading && !data ? (
          <p className="text-center py-16 text-slate-500 font-bold">Cargando…</p>
        ) : data && data.items.length === 0 && !error ? (
          <div className="text-center py-24 bg-slate-800/20 rounded-[2.5rem] border-4 border-dashed border-slate-800">
            <p className="text-slate-500 font-bold uppercase tracking-widest">
              {filtered ? 'No hay registros con esos filtros.' : 'No hay actividad registrada aún.'}
            </p>
          </div>
        ) : (
          data?.items.map((record) => {
            const denied = record.result === 'denied';
            return (
              <div key={record.id} className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-800 transition-all group">
                <div className="flex items-center gap-5">
                  <div className={`p-4 text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform ${denied ? 'bg-red-500 shadow-red-500/20' : 'bg-blue-500 shadow-blue-500/20'}`}>
                    {denied ? <ShieldAlert className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="text-white font-black text-lg first-letter:uppercase">
                      {new Date(`${record.date}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-500 uppercase font-black tracking-widest mt-1">
                      {isCustomer ? `Socio #${record.clientCode}` : `${record.customerName} · Socio #${record.clientCode}`}
                    </p>
                    {denied && <p className="text-xs text-red-400 font-black uppercase tracking-widest mt-1">{denyReasonLabel(record.denyReason)}</p>}
                    {record.autoClosed && <p className="text-xs text-amber-400 font-bold mt-1">Salida no registrada (cerrada automáticamente)</p>}
                  </div>
                </div>

                <div className="flex items-center gap-10 bg-slate-900/80 px-8 py-4 rounded-2xl border border-slate-700 shadow-inner">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1.5 tracking-tighter">{denied ? 'Intento' : 'Check-In'}</p>
                    <div className={`flex items-center gap-2 font-mono font-black text-xl ${denied ? 'text-red-400' : 'text-green-400'}`}>
                      <Clock className="w-5 h-5" /> {shortTime(record.checkInTime)}
                    </div>
                  </div>
                  <ArrowRightLeft className="w-5 h-5 text-slate-700" />
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1.5 tracking-tighter">Check-Out</p>
                    <div className="flex items-center gap-2 text-slate-400 font-mono font-black text-xl italic">
                      {record.autoClosed || denied ? '--:--' : (shortTime(record.checkOutTime) ?? '--:--')}
                    </div>
                    {record.minutes !== null && !record.autoClosed && !denied && (
                      <p className="text-[10px] text-slate-500 font-black uppercase mt-1">{record.minutes} min</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {data && pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="px-5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-slate-200 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm font-bold text-slate-400">Página {page} de {pages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages || loading}
            className="px-5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-slate-200 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
