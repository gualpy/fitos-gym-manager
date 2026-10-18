import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Tag, Calendar, Edit3, Power, X } from 'lucide-react';
import { Plan, PlanInput, createPlan, listPlans, setPlanActive, updatePlan } from '../services/plans';
import { errorText, formErrorText } from '../utils/errors';

const emptyForm = { name: '', description: '', price: '', durationMonths: '1', isPromotion: false };
type Form = typeof emptyForm;

const toForm = (plan: Plan): Form => ({
  name: plan.name,
  description: plan.description ?? '',
  price: String(plan.price),
  durationMonths: String(plan.durationMonths),
  isPromotion: plan.isPromotion,
});

const money = (value: number) => value.toLocaleString('es-EC', { style: 'currency', currency: 'USD' });

const inputClass = 'w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-blue-600 outline-none font-bold';
const labelClass = 'text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1';

const PlansManager: React.FC = () => {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<Plan | 'new' | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setPlans(await listPlans(true));
      setLoadError('');
    } catch (err) {
      setLoadError(errorText(err, 'No se pudieron cargar los planes.'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const open = (target: Plan | 'new') => {
    setEditing(target);
    setForm(target === 'new' ? emptyForm : toForm(target));
    setFormError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: PlanInput = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      durationMonths: Number(form.durationMonths),
      isPromotion: form.isPromotion,
    };
    setSaving(true);
    setFormError('');
    try {
      if (editing === 'new') await createPlan(input);
      else if (editing) await updatePlan(editing.id, input);
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(formErrorText(err, 'No se pudo guardar el plan.'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (plan: Plan) => {
    try {
      await setPlanActive(plan.id, !plan.isActive);
      await load();
    } catch (err) {
      setLoadError(formErrorText(err, 'No se pudo cambiar el estado del plan.'));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Planes y Membresías</h2>
          <p className="text-slate-500 dark:text-slate-400">Configura tus ofertas mensuales y promociones especiales.</p>
        </div>
        <button onClick={() => open('new')} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20">
          <Plus className="w-5 h-5" /> Crear Nuevo Plan
        </button>
      </div>

      {loadError && (
        <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-5 py-3">{loadError}</p>
      )}
      {plans === null && !loadError && <p className="text-slate-500 font-bold">Cargando planes…</p>}
      {plans?.length === 0 && <p className="text-slate-500 font-bold">Aún no hay planes. Crea el primero.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans?.map((plan) => (
          <div key={plan.id} className={`relative bg-white dark:bg-slate-800 border-2 rounded-3xl p-6 transition-all hover:translate-y-[-4px] ${plan.isActive ? '' : 'opacity-60'} ${plan.isPromotion ? 'border-purple-500/50' : 'border-slate-200 dark:border-slate-700'}`}>
            {plan.isPromotion && (
              <div className="absolute -top-3 left-6 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-tighter">
                <Tag className="w-3 h-3" /> Promoción
              </div>
            )}
            {!plan.isActive && (
              <div className="absolute -top-3 right-6 bg-slate-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Inactivo</div>
            )}

            <div className="flex justify-between items-start mb-4 gap-3">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => open(plan)} aria-label={`Editar ${plan.name}`} className="text-slate-500 hover:text-blue-500 transition-colors">
                  <Edit3 className="w-5 h-5" />
                </button>
                <button onClick={() => toggle(plan)} aria-label={plan.isActive ? `Desactivar ${plan.name}` : `Activar ${plan.name}`} className="text-slate-500 hover:text-blue-500 transition-colors">
                  <Power className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{money(plan.price)}</span>
              <span className="text-slate-500 dark:text-slate-400 text-sm">/ {plan.durationMonths} {plan.durationMonths === 1 ? 'mes' : 'meses'}</span>
            </div>
            <p className="text-xs text-slate-400 mb-6">IVA {plan.ivaRate}%</p>

            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 line-clamp-2 min-h-10">{plan.description}</p>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
              <Calendar className="w-4 h-4" /> Duración: {plan.durationMonths} {plan.durationMonths === 1 ? 'mes' : 'meses'} calendario
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editing === 'new' ? 'Nuevo plan' : 'Editar plan'}</h3>
              <button onClick={() => setEditing(null)} aria-label="Cerrar" className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-colors"><X className="w-8 h-8" /></button>
            </div>
            <form onSubmit={submit} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className={labelClass} htmlFor="plan-name">Nombre</label>
                <input id="plan-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass} htmlFor="plan-desc">Descripción</label>
                <textarea id="plan-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="plan-price">Precio (USD)</label>
                  <input id="plan-price" required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="plan-months">Duración (meses)</label>
                  <input id="plan-months" required type="number" min="1" max="60" step="1" value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} className={inputClass} />
                </div>
              </div>
              <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={form.isPromotion} onChange={(e) => setForm({ ...form, isPromotion: e.target.checked })} className="w-5 h-5" />
                Es una promoción
              </label>
              {formError && <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400">{formError}</p>}
              <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-blue-600/30 uppercase tracking-widest">
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansManager;
