import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Scale, Search, Trash2 } from 'lucide-react';
import { Session } from '../services/auth';
import { Customer, ageOf, searchCustomers } from '../services/customers';
import { getCustomerDetail } from '../services/members';
import {
  BMI_LABELS,
  Measurement,
  bmiCategory,
  bmiOf,
  deleteMeasurement,
  devineWeight,
  healthyRange,
  listMeasurements,
  recordMeasurement,
} from '../services/measurements';
import { errorText, formErrorText } from '../utils/errors';

const inputClass = 'w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-blue-600 outline-none font-bold';
const labelClass = 'text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1';
const cardClass = 'bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm dark:shadow-none';

const CATEGORY_STYLE = {
  under: 'text-amber-600 dark:text-amber-400',
  healthy: 'text-green-600 dark:text-green-400',
  over: 'text-amber-600 dark:text-amber-400',
  obese: 'text-red-600 dark:text-red-400',
} as const;

const dayLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
const shortDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
const kg = (value: number) => `${value.toLocaleString('es-EC', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;

/** "12,5" and "12.5" both mean 12.5; anything else is not a number. */
const toNumber = (text: string): number | null => {
  const value = Number(text.trim().replace(',', '.'));
  return text.trim() !== '' && Number.isFinite(value) && value > 0 ? value : null;
};

interface Person {
  id: string;
  name: string;
  gender: Customer['gender'];
  birthDate: string | null;
}

const BodyProgress: React.FC<{ session: Session }> = ({ session }) => {
  const isCustomer = session.user.role === 'customer';
  const [person, setPerson] = useState<Person | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loadError, setLoadError] = useState('');

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [date, setDate] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Staff pick a member; a customer only ever sees their own.
  const [search, setSearch] = useState('');
  const [found, setFound] = useState<Customer[]>([]);

  useEffect(() => {
    if (!isCustomer || !session.user.customerId) return;
    let cancelled = false;
    getCustomerDetail(session.user.customerId)
      .then((detail) => !cancelled && setPerson({ id: detail.customer.id, name: detail.customer.name, gender: detail.customer.gender, birthDate: detail.customer.birthDate }))
      .catch((err) => !cancelled && setLoadError(errorText(err, 'No se pudo cargar tu ficha.')));
    return () => {
      cancelled = true;
    };
  }, [isCustomer, session.user.customerId]);

  useEffect(() => {
    if (isCustomer || search.trim().length < 2) {
      setFound([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchCustomers({ q: search.trim(), pageSize: 6 })
        .then((page) => !cancelled && setFound(page.items))
        .catch((err) => !cancelled && setLoadError(errorText(err, 'No se pudo buscar.')));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isCustomer, search]);

  const load = useCallback(async (id: string) => {
    try {
      const items = await listMeasurements(id);
      setMeasurements(items);
      setLoadError('');
      // The height rarely changes: start from the last one the person gave.
      const last = items[items.length - 1];
      setHeight(last ? String(last.heightCm) : '');
    } catch (err) {
      setLoadError(errorText(err, 'No se pudo cargar el historial.'));
    }
  }, []);

  useEffect(() => {
    setMeasurements([]);
    setWeight('');
    setDate('');
    setFormError('');
    if (person) void load(person.id);
  }, [person, load]);

  const choose = (customer: Customer) => {
    setPerson({ id: customer.id, name: customer.name, gender: customer.gender, birthDate: customer.birthDate });
    setSearch('');
    setFound([]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person) return;
    const w = toNumber(weight);
    const h = toNumber(height);
    if (w === null || h === null) {
      setFormError('Escribe el peso y la estatura con números.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await recordMeasurement(person.id, { weightKg: w, heightCm: h, measuredOn: date || undefined });
      setWeight('');
      setDate('');
      await load(person.id);
    } catch (err) {
      setFormError(formErrorText(err, 'No se pudo guardar la medida.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!person) return;
    try {
      await deleteMeasurement(person.id, id);
      await load(person.id);
    } catch (err) {
      setLoadError(formErrorText(err, 'No se pudo borrar la medida.'));
    }
  };

  // The calculator reads what is being typed; with nothing typed it shows the latest saved measurement.
  const latest = measurements[measurements.length - 1];
  const w = toNumber(weight) ?? latest?.weightKg ?? null;
  const h = toNumber(height) ?? latest?.heightCm ?? null;
  const age = person ? ageOf(person.birthDate) : null;
  const minor = age !== null && age < 18;
  const bmi = w !== null && h !== null ? bmiOf(w, h) : null;
  const category = bmi !== null ? bmiCategory(bmi) : null;
  const range = h !== null ? healthyRange(h) : null;
  const reference = h !== null && person ? devineWeight(h, person.gender) : null;

  const chart = useMemo(() => measurements.map((m) => ({ day: m.measuredOn, label: shortDay(m.measuredOn), weight: m.weightKg })), [measurements]);
  const chartRange = latest ? healthyRange(latest.heightCm) : null;
  const first = measurements[0];
  const change = first && latest && first.id !== latest.id ? latest.weightKg - first.weightKg : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Peso e IMC</h2>
        <p className="text-slate-500 dark:text-slate-400">
          {isCustomer ? 'Calcula tu IMC y sigue tu avance.' : 'Calcula el IMC de un socio y registra su evolución.'}
        </p>
      </div>

      {!isCustomer && (
        <div className={cardClass}>
          {person ? (
            <div className="flex items-center justify-between gap-4">
              <p className="font-black text-slate-900 dark:text-white">{person.name}</p>
              <button onClick={() => setPerson(null)} className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Cambiar socio</button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className={labelClass} htmlFor="b-search">Socio</label>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-4">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  autoComplete="off"
                  id="b-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Busca por nombre, identificación o código…"
                  className="bg-transparent w-full py-4 outline-none font-bold text-slate-900 dark:text-white"
                />
              </div>
              {found.length > 0 && (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  {found.map((c) => (
                    <li key={c.id}>
                      <button onClick={() => choose(c)} className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-slate-800 dark:text-slate-200">
                        #{c.clientCode} · {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {loadError && <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400">{loadError}</p>}

      {person && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={submit} autoComplete="off" className={`${cardClass} space-y-5`}>
              <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2"><Scale className="w-5 h-5 text-blue-500" /> Registrar medida</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="b-weight">Peso (kg)</label>
                  <input autoComplete="off" id="b-weight" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70,5" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="b-height">Estatura (cm)</label>
                  <input autoComplete="off" id="b-height" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" className={inputClass} />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelClass} htmlFor="b-date">Fecha (vacío = hoy)</label>
                <input autoComplete="off" id="b-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              </div>
              {formError && <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400">{formError}</p>}
              <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-sm">
                {saving ? 'Guardando…' : 'Guardar medida'}
              </button>
              <p className="text-xs text-slate-400">Si ya hay una medida de ese día, se reemplaza.</p>
            </form>

            <div className={`${cardClass} space-y-4`}>
              <h3 className="font-black text-slate-900 dark:text-white">Tu IMC</h3>
              {bmi === null || h === null ? (
                <p className="text-slate-500 dark:text-slate-400">Escribe tu peso y tu estatura para calcularlo.</p>
              ) : minor ? (
                <p className="text-slate-600 dark:text-slate-300 font-bold">
                  El IMC de adultos no aplica a menores de 18 años: en ellos se evalúa con curvas de crecimiento. Consulta a un profesional de la salud.
                </p>
              ) : (
                <>
                  <div className="flex items-baseline gap-4">
                    <span className="text-5xl font-black text-slate-900 dark:text-white">{bmi.toLocaleString('es-EC', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                    {category && <span className={`text-lg font-black ${CATEGORY_STYLE[category]}`}>{BMI_LABELS[category]}</span>}
                  </div>
                  {range && (
                    <p className="text-slate-600 dark:text-slate-300">
                      Para {h.toLocaleString('es-EC')} cm, el rango de peso saludable es de <strong>{kg(range.min)}</strong> a <strong>{kg(range.max)}</strong>.
                    </p>
                  )}
                  {reference !== null && (
                    <p className="text-slate-600 dark:text-slate-300">
                      Peso de referencia (fórmula de Devine, {person.gender === 'M' ? 'hombres' : 'mujeres'}): <strong>{kg(reference)}</strong>.
                    </p>
                  )}
                </>
              )}
              <p className="text-xs text-slate-400">
                Es una guía orientativa: el IMC no distingue músculo de grasa y no reemplaza la valoración de un profesional.
              </p>
            </div>
          </div>

          <div className={cardClass}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
              <h3 className="font-black text-slate-900 dark:text-white">Evolución del peso</h3>
              {change !== null && (
                <span className="text-sm font-black text-slate-500 dark:text-slate-400">
                  {change === 0 ? 'Sin cambio' : `${change > 0 ? '+' : '−'}${Math.abs(change).toLocaleString('es-EC', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`} desde el {dayLabel(first.measuredOn)}
                </span>
              )}
            </div>
            {chart.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">Aún no hay medidas. Guarda la primera para empezar la gráfica.</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
                    <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis
                      width={44}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      domain={[
                        (min: number) => Math.floor(Math.min(min, chartRange?.min ?? min) - 2),
                        (max: number) => Math.ceil(Math.max(max, chartRange?.max ?? max) + 2),
                      ]}
                    />
                    {chartRange && !minor && <ReferenceArea
                        y1={chartRange.min}
                        y2={chartRange.max}
                        shape={(p: { x: number; y: number; width: number; height: number }) => (
                          <rect x={p.x} y={p.y} width={p.width} height={p.height} fill="#22c55e" fillOpacity={0.12} />
                        )}
                      />}
                    <Tooltip
                      formatter={(value: number) => [kg(value), 'Peso']}
                      labelFormatter={(_label, payload) => (payload?.[0] ? dayLabel(payload[0].payload.day) : '')}
                      contentStyle={{ borderRadius: 12 }}
                    />
                    <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {chartRange && !minor && chart.length > 0 && <p className="text-xs text-slate-400 mt-3">La franja verde es el rango de peso saludable para la última estatura registrada.</p>}
          </div>

          {measurements.length > 0 && (
            <div className={`${cardClass} p-0 overflow-hidden`}>
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/40">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <th className="p-5">Fecha</th>
                    <th className="p-5">Peso</th>
                    <th className="p-5">Estatura</th>
                    <th className="p-5">IMC</th>
                    <th className="p-5 text-right"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...measurements].reverse().map((m) => (
                    <tr key={m.id} className="text-slate-800 dark:text-slate-200 font-bold">
                      <td className="p-5">{dayLabel(m.measuredOn)}</td>
                      <td className="p-5">{kg(m.weightKg)}</td>
                      <td className="p-5">{m.heightCm.toLocaleString('es-EC')} cm</td>
                      <td className="p-5">{minor ? '—' : bmiOf(m.weightKg, m.heightCm).toLocaleString('es-EC', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                      <td className="p-5 text-right">
                        <button onClick={() => remove(m.id)} aria-label={`Borrar la medida del ${dayLabel(m.measuredOn)}`} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BodyProgress;
