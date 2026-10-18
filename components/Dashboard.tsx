import React, { useCallback, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Activity, BrainCircuit, DoorOpen, Clock } from 'lucide-react';
import { Session } from '../services/auth';
import { ApiError } from '../services/api';
import { DashboardSummary, getDashboardSummary, getInsights, weekdayShort } from '../services/dashboard';
import { MembershipSummary, getCustomerDetail } from '../services/members';
import { listCustomerAttendance } from '../services/attendance';
import { errorText } from '../utils/errors';

interface DashboardProps {
  session: Session;
}

const GENDER_STYLE: Record<string, { label: string; color: string }> = {
  M: { label: 'Hombres', color: '#3b82f6' },
  F: { label: 'Mujeres', color: '#ec4899' },
  O: { label: 'Otros', color: '#10b981' },
  unknown: { label: 'Sin indicar', color: '#94a3b8' },
};

const money = (value: number) => value.toLocaleString('es-EC', { style: 'currency', currency: 'USD' });

const cardClass = 'bg-white dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none';
const errorBox = 'text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-5 py-3';

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  return session.user.role === 'customer' ? <CustomerHome session={session} /> : <StaffDashboard canSeeMoney={session.user.role !== 'reception'} />;
};

// ---------------------------------------------------------------------------------------------- staff

const StaffDashboard: React.FC<{ canSeeMoney: boolean }> = ({ canSeeMoney }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getDashboardSummary()
      .then((data) => !cancelled && setSummary(data))
      .catch((err) => !cancelled && setError(errorText(err, 'No se pudo cargar el resumen.')));
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = summary && [
    { label: 'Socios Vigentes', value: String(summary.activeMembers), hint: `de ${summary.totalCustomers} registrados`, icon: <Users />, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-500' },
    { label: 'Asistencia Hoy', value: String(summary.attendanceToday), hint: `${summary.insideNow} dentro ahora`, icon: <TrendingUp />, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-500' },
    { label: 'Planes por Vencer', value: String(summary.expiringSoon), hint: `en los próximos ${summary.expiringWithinDays} días`, icon: <Clock />, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-500' },
    summary.sales
      ? { label: 'Ventas de Hoy', value: money(summary.sales.today), hint: `${money(summary.sales.last7Days)} en 7 días`, icon: <DollarSign />, color: 'bg-green-500/10 text-green-600 dark:text-green-500' }
      : { label: 'Dentro Ahora', value: String(summary.insideNow), hint: 'socios en el gimnasio', icon: <DoorOpen />, color: 'bg-green-500/10 text-green-600 dark:text-green-500' },
  ];

  const genderRows = (summary?.genders ?? []).map((g) => ({ ...GENDER_STYLE[g.gender ?? 'unknown'], value: g.count }));
  const genderTotal = genderRows.reduce((sum, g) => sum + g.value, 0);
  const attendance = (summary?.attendance ?? []).map((d) => ({ name: weekdayShort(d.date), value: d.count }));
  const revenue = (summary?.sales?.daily ?? []).map((d) => ({ name: weekdayShort(d.date), value: d.amount }));
  const noSalesYet = revenue.every((d) => d.value === 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Resumen General</h2>
          <p className="text-slate-500 dark:text-slate-400">Panel de control de rendimiento del gimnasio.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <Activity className="text-green-500 w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-300">Sistema en línea</span>
        </div>
      </div>

      {error && <p role="alert" className={errorBox}>{error}</p>}
      {!summary && !error && <p className="text-slate-500 font-bold">Cargando resumen…</p>}

      {summary && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 transition-all shadow-sm dark:shadow-none">
                <div className={`p-4 rounded-2xl inline-block mb-4 ${stat.color}`}>{stat.icon}</div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tighter">{stat.value}</h3>
                <p className="text-xs text-slate-400 mt-1 font-bold">{stat.hint}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className={`lg:col-span-2 ${cardClass}`}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Asistencia Semanal</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">Últimos 7 días</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} formatter={(value) => [value, 'Socios']} contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontWeight: 'bold' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={cardClass}>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center lg:text-left">Socios por Sexo</h3>
              {genderTotal === 0 ? (
                <p className="text-slate-500 font-bold text-sm">Aún no hay socios activos.</p>
              ) : (
                <>
                  <div className="h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={genderRows} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" nameKey="label">
                          {genderRows.map((entry) => (
                            <Cell key={entry.label} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">{genderTotal}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activos</span>
                    </div>
                  </div>
                  <div className="mt-8 space-y-3">
                    {genderRows.map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-slate-500 dark:text-slate-300 font-bold">{item.label}</span>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white">{item.value} · {Math.round((item.value / genderTotal) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {summary.sales && (
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ingresos Semanales</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">Ventas pagadas · 7 días</span>
              </div>
              {noSalesYet && <p className="text-slate-500 text-sm font-bold mb-4">Aún no hay ventas registradas en los últimos 7 días.</p>}
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} formatter={(value) => [money(Number(value)), 'Ventas']} contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontWeight: 'bold' }} />
                    <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {canSeeMoney && <InsightsCard />}
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------- AI insights

type InsightState = { kind: 'idle' } | { kind: 'loading' } | { kind: 'ready'; text: string } | { kind: 'unavailable' } | { kind: 'error'; message: string };

const InsightsCard: React.FC = () => {
  const [state, setState] = useState<InsightState>({ kind: 'idle' });

  const generate = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      setState({ kind: 'ready', text: (await getInsights()).text });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'insights_unavailable') setState({ kind: 'unavailable' });
      else setState({ kind: 'error', message: errorText(err, 'No se pudieron obtener los insights en este momento.') });
    }
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-600/10 dark:to-purple-600/10 p-8 rounded-[2.5rem] border border-blue-200 dark:border-blue-500/30 flex flex-col md:flex-row gap-8 items-center md:items-start shadow-inner">
      <div className="bg-blue-600 p-6 rounded-[2rem] shadow-2xl shadow-blue-600/40 shrink-0">
        <BrainCircuit className="w-10 h-10 text-white" />
      </div>
      <div className="text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Insights Inteligentes</h3>
          <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase self-center">Beta AI</span>
        </div>
        {state.kind === 'idle' && (
          <>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">Envía solo cifras agregadas (sin nombres ni datos personales) a un servicio de IA y recibe consejos para tu gimnasio.</p>
            <button onClick={generate} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all">Generar insights</button>
          </>
        )}
        {state.kind === 'loading' && <p className="text-slate-600 dark:text-slate-300 font-medium italic">Analizando tendencias…</p>}
        {state.kind === 'ready' && <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic opacity-90 whitespace-pre-line">{state.text}</p>}
        {state.kind === 'unavailable' && <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Los insights de IA no están configurados en este servidor.</p>}
        {state.kind === 'error' && (
          <>
            <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400 mb-3">{state.message}</p>
            <button onClick={generate} className="text-blue-600 dark:text-blue-400 font-bold text-sm underline">Reintentar</button>
          </>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------- customer

const CustomerHome: React.FC<{ session: Session }> = ({ session }) => {
  const customerId = session.user.customerId;
  const [membership, setMembership] = useState<MembershipSummary | null | undefined>(undefined);
  const [visits, setVisits] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    const from = new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10);
    Promise.all([getCustomerDetail(customerId), listCustomerAttendance(customerId, { from, result: 'granted', pageSize: 1 })])
      .then(([detail, page]) => {
        if (cancelled) return;
        setMembership(detail.membership);
        setVisits(page.total);
      })
      .catch((err) => !cancelled && setError(errorText(err, 'No se pudo cargar tu información.')));
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const day = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Mi Resumen</h2>
        <p className="text-slate-500 dark:text-slate-400">Tu membresía y tu actividad reciente.</p>
      </div>
      {error && <p role="alert" className={errorBox}>{error}</p>}
      {!error && membership === undefined && <p className="text-slate-500 font-bold">Cargando…</p>}
      {membership !== undefined && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Mi plan</p>
            {membership && (membership.state === 'current' || membership.state === 'scheduled') ? (
              <>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{membership.planName}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-2">
                  {membership.state === 'current' ? `Vigente hasta el ${day(membership.endsOn)}` : `Empieza el ${day(membership.startsOn)}`}
                </p>
              </>
            ) : (
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Sin plan vigente</h3>
            )}
          </div>
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Visitas · últimos 30 días</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white mt-1">{visits ?? 0}</h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
