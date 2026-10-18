import React, { useCallback, useEffect, useState } from 'react';
import { Search, Plus, UserCheck, UserX, X, CreditCard, UserMinus, UserPlus } from 'lucide-react';
import {
  Customer,
  CustomerInput,
  CustomerStatus,
  ageOf,
  assignMembership,
  createCustomer,
  searchCustomers,
  setCustomerStatus,
} from '../services/customers';
import { Plan, listPlans } from '../services/plans';
import { errorText, formErrorText } from '../utils/errors';

const PAGE_SIZE = 20;

const emptyForm = { name: '', identificationType: '05', identification: '', email: '', phone: '', gender: '', birthDate: '' };

const inputClass = 'w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-blue-600 outline-none font-bold';
const labelClass = 'text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1';
const thClass = 'p-6 font-black text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em]';

const formatDay = (day: string) => new Date(`${day}T00:00:00`).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });

const CustomerList: React.FC = () => {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<CustomerStatus | ''>('');
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [assigning, setAssigning] = useState<Customer | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState('');
  const [assignError, setAssignError] = useState('');

  // Wait for the user to stop typing before hitting the API.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(text.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [text]);

  const load = useCallback(async () => {
    try {
      const result = await searchCustomers({ q: query || undefined, status: status || undefined, page, pageSize: PAGE_SIZE });
      setCustomers(result.items);
      setTotal(result.total);
      setLoadError('');
    } catch (err) {
      setLoadError(errorText(err, 'No se pudieron cargar los socios.'));
    }
  }, [query, status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasId = form.identification.trim() !== '';
    const input: CustomerInput = {
      name: form.name,
      identificationType: hasId ? form.identificationType : undefined,
      identification: hasId ? form.identification : undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      gender: form.gender || undefined,
      birthDate: form.birthDate || undefined,
    };
    setSaving(true);
    setFormError('');
    try {
      await createCustomer(input);
      setShowCreate(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setFormError(formErrorText(err, 'No se pudo registrar al socio.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (customer: Customer) => {
    try {
      await setCustomerStatus(customer.id, customer.status === 'active' ? 'inactive' : 'active');
      await load();
    } catch (err) {
      setLoadError(formErrorText(err, 'No se pudo cambiar el estado del socio.'));
    }
  };

  const openAssign = async (customer: Customer) => {
    setAssigning(customer);
    setAssignError('');
    setPlanId('');
    try {
      const available = await listPlans();
      setPlans(available);
      setPlanId(available[0]?.id ?? '');
    } catch (err) {
      setAssignError(errorText(err, 'No se pudieron cargar los planes.'));
    }
  };

  const submitAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigning || !planId) return;
    setSaving(true);
    setAssignError('');
    try {
      await assignMembership(assigning.id, planId);
      setAssigning(null);
      await load();
    } catch (err) {
      setAssignError(formErrorText(err, 'No se pudo asignar el plan.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Directorio de Socios</h2>
          <p className="text-slate-500 dark:text-slate-400">Control maestro de la base de datos de clientes.</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setFormError(''); }}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-2xl transition-all font-black uppercase tracking-widest shadow-lg shadow-blue-900/30 active:scale-95 text-xs"
        >
          <Plus className="w-5 h-5" /> Inscribir Nuevo
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <Search className="w-6 h-6 text-slate-400 dark:text-slate-500 ml-3" />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Buscar socios"
            placeholder="Buscar por nombre, identificación o código..."
            className="bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-200 w-full placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as CustomerStatus | ''); setPage(1); }}
          aria-label="Filtrar por estado"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-slate-700 dark:text-slate-200"
        >
          <option value="">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">De baja</option>
        </select>
      </div>

      {loadError && (
        <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-5 py-3">{loadError}</p>
      )}

      <div className="overflow-x-auto rounded-[2rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 backdrop-blur-md shadow-sm dark:shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <th className={thClass}>Acceso</th>
              <th className={thClass}>Identidad</th>
              <th className={thClass}>Datos</th>
              <th className={thClass}>Membresía</th>
              <th className={`${thClass} text-center`}>Gestión</th>
            </tr>
          </thead>
          <tbody>
            {customers === null && !loadError && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">Cargando socios…</td></tr>
            )}
            {customers?.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No hay socios que coincidan.</td></tr>
            )}
            {customers?.map((customer) => {
              const age = ageOf(customer.birthDate);
              const covered = customer.activeUntil !== null;
              return (
                <tr key={customer.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all">
                  <td className="p-6">
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-black text-lg bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">#{customer.clientCode}</span>
                  </td>
                  <td className="p-6">
                    <div className="font-black text-slate-900 dark:text-white text-base leading-none">{customer.name}</div>
                    <div className="text-[10px] text-slate-500 font-bold mt-2">{customer.identification ?? 'Sin identificación'}{customer.email ? ` · ${customer.email}` : ''}</div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      {customer.gender && (
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${customer.gender === 'F' ? 'bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-500 border-pink-200 dark:border-pink-500/20' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-200 dark:border-blue-500/20'}`}>{customer.gender}</span>
                      )}
                      {age !== null && <span className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-tighter">{age} años</span>}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest border ${
                      customer.status === 'inactive'
                        ? 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20'
                        : covered
                          ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500 border-green-200 dark:border-green-500/20'
                          : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-500 border-red-200 dark:border-red-500/20'
                    }`}>
                      {customer.status === 'active' && covered ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      {customer.status === 'inactive' ? 'De baja' : covered ? `Vigente hasta ${formatDay(customer.activeUntil!)}` : 'Sin plan vigente'}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openAssign(customer)}
                        disabled={customer.status === 'inactive'}
                        className="p-3 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-tighter bg-green-600 text-white hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <CreditCard className="w-4 h-4" /> Asignar plan
                      </button>
                      <button
                        onClick={() => toggleStatus(customer)}
                        className={`p-3 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-tighter ${
                          customer.status === 'active'
                            ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white'
                            : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white'
                        }`}
                      >
                        {customer.status === 'active' ? <><UserMinus className="w-4 h-4" /> Dar de baja</> : <><UserPlus className="w-4 h-4" /> Reactivar</>}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm font-bold text-slate-500">
        <span>{total} {total === 1 ? 'socio' : 'socios'}</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40">Anterior</button>
          <span>Página {page} de {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40">Siguiente</button>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Alta de Socio</h3>
              <button onClick={() => setShowCreate(false)} aria-label="Cerrar" className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 transition-colors"><X className="w-8 h-8" /></button>
            </div>
            <form onSubmit={submitCreate} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className={labelClass} htmlFor="c-name">Nombre y Apellido</label>
                <input id="c-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="c-idtype">Tipo</label>
                  <select id="c-idtype" value={form.identificationType} onChange={(e) => setForm({ ...form, identificationType: e.target.value })} className={inputClass}>
                    <option value="05">Cédula</option>
                    <option value="04">RUC</option>
                    <option value="06">Pasaporte</option>
                    <option value="08">Exterior</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className={labelClass} htmlFor="c-id">Identificación (opcional)</label>
                  <input id="c-id" value={form.identification} onChange={(e) => setForm({ ...form, identification: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="c-email">Correo</label>
                  <input id="c-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="c-phone">Teléfono</label>
                  <input id="c-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="c-gender">Género</label>
                  <select id="c-gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputClass}>
                    <option value="">Sin indicar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="c-birth">Fecha de nacimiento</label>
                  <input id="c-birth" type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className={inputClass} />
                </div>
              </div>
              {formError && <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400">{formError}</p>}
              <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-blue-600/30 active:scale-95 uppercase tracking-widest">
                {saving ? 'Guardando…' : 'Confirmar Registro'}
              </button>
            </form>
          </div>
        </div>
      )}

      {assigning && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Asignar plan a {assigning.name}</h3>
              <button onClick={() => setAssigning(null)} aria-label="Cerrar" className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-colors"><X className="w-8 h-8" /></button>
            </div>
            <form onSubmit={submitAssign} className="p-10 space-y-6">
              {plans.length === 0 && !assignError ? (
                <p className="text-slate-500 font-bold">No hay planes activos. Crea uno en "Planes y Promos".</p>
              ) : (
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="a-plan">Plan</label>
                  <select id="a-plan" value={planId} onChange={(e) => setPlanId(e.target.value)} className={inputClass}>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>{plan.name} · ${plan.price} · {plan.durationMonths} {plan.durationMonths === 1 ? 'mes' : 'meses'}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400">Empieza hoy, o al terminar la membresía vigente.</p>
                </div>
              )}
              {assignError && <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400">{assignError}</p>}
              <button type="submit" disabled={saving || !planId} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-black py-5 rounded-2xl transition-all uppercase tracking-widest">
                {saving ? 'Asignando…' : 'Asignar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
