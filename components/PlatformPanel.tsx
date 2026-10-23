import React, { useCallback, useEffect, useState } from 'react';
import { Building2, CircleDollarSign, LogOut, Mail, Plus, RefreshCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ApiError } from '../services/api';
import { Session } from '../services/auth';
import {
  EmailSettings,
  EmailSettingsInput,
  MonthRevenue,
  NewTenant,
  STATUS_LABELS,
  TenantRow,
  TenantStatus,
  extendSubscription,
  getEmailSettings,
  listTenants,
  monthlyRevenue,
  onboardTenant,
  resendWelcome,
  saveEmailSettings,
  sendTestEmail,
  setTenantSuspended,
} from '../services/platform';
import { errorText, formErrorText } from '../utils/errors';

const money = (value: number) => value.toLocaleString('es-EC', { style: 'currency', currency: 'USD' });
const dateLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
const monthLabel = (month: string) => new Date(`${month}-01T00:00:00`).toLocaleDateString('es-EC', { month: 'short', year: '2-digit' });

const cardClass = 'bg-white dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none';
const fieldClass =
  'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none w-full';
const buttonClass = 'px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50';
const primary = `${buttonClass} bg-blue-600 hover:bg-blue-500 text-white`;
const secondary = `${buttonClass} border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-500`;
const errorBox = 'text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-5 py-3';
const okBox = 'text-sm font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl px-5 py-3';

const STATUS_STYLE: Record<TenantStatus, string> = {
  trial: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  active: 'bg-green-500/10 text-green-600 dark:text-green-400',
  suspended: 'bg-red-500/10 text-red-600 dark:text-red-400',
  cancelled: 'bg-slate-500/10 text-slate-500',
  expired: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

type Tab = 'gyms' | 'revenue' | 'new' | 'email';

const PlatformPanel: React.FC<{ session: Session; onLogout: () => void }> = ({ session, onLogout }) => {
  const [tab, setTab] = useState<Tab>('gyms');
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'gyms', label: 'Gimnasios', icon: <Building2 className="w-4 h-4" /> },
    { id: 'revenue', label: 'Ingresos', icon: <CircleDollarSign className="w-4 h-4" /> },
    { id: 'new', label: 'Nuevo gimnasio', icon: <Plus className="w-4 h-4" /> },
    { id: 'email', label: 'Correo', icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <div className="max-w-6xl mx-auto p-6 sm:p-10 space-y-8">
        <header className="flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800/50 shadow-sm dark:shadow-none">
          <div>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">FitOS · Plataforma</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Hola, {session.user.displayName}</h1>
          </div>
          <button type="button" onClick={onLogout} className={`${secondary} flex items-center gap-2`}>
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </header>

        <nav className="flex flex-wrap gap-2" aria-label="Secciones">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`${buttonClass} flex items-center gap-2 ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        {tab === 'gyms' && <Gyms onNew={() => setTab('new')} />}
        {tab === 'revenue' && <Revenue />}
        {tab === 'new' && <NewGym onCreated={() => setTab('gyms')} />}
        {tab === 'email' && <EmailTab />}
      </div>
    </div>
  );
};

// ---- gyms ------------------------------------------------------------------------------------------------------

const Gyms: React.FC<{ onNew: () => void }> = ({ onNew }) => {
  const [rows, setRows] = useState<TenantRow[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [extending, setExtending] = useState<string | null>(null);
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState('');

  const load = useCallback(() => {
    setError('');
    listTenants()
      .then(setRows)
      .catch((err) => !(err instanceof ApiError && err.status === 401) && setError(errorText(err, 'No se pudo cargar la lista de gimnasios.')));
  }, []);

  useEffect(load, [load]);

  const run = async (id: string, action: () => Promise<string | void>) => {
    setBusy(id);
    setError('');
    setNotice('');
    try {
      const message = await action();
      if (message) setNotice(message);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 502) setError('El servidor de correo no aceptó el mensaje. Revisa la configuración del correo.');
      else if (!(err instanceof ApiError && err.status === 401)) setError(formErrorText(err, 'No se pudo completar la acción.'));
    } finally {
      setBusy(null);
    }
  };

  const submitExtend = async (row: TenantRow, e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount.replace(',', '.'));
    if (!Number.isFinite(value) || value < 0 || amount.trim() === '') {
      setError('Escribe cuánto pagó el gimnasio (0 si es cortesía).');
      return;
    }

    await run(row.id, async () => {
      const result = await extendSubscription(row.id, months, Math.round(value * 100) / 100);
      setExtending(null);
      setAmount('');
      return `${row.name}: servicio hasta el ${dateLabel(result.subscriptionEndsOn)}.`;
    });
  };

  const toggleSuspend = (row: TenantRow) => {
    const suspend = row.status !== 'suspended';
    if (!window.confirm(suspend ? `¿Suspender "${row.name}"? Nadie de ese gimnasio podrá entrar hasta reactivarlo.` : `¿Reactivar "${row.name}"?`)) return;
    void run(row.id, async () => {
      await setTenantSuspended(row.id, suspend);
      return suspend ? `${row.name} quedó suspendido.` : `${row.name} se reactivó.`;
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Gimnasios {rows && <span className="text-slate-400 font-bold">({rows.length})</span>}</h2>
        <button type="button" onClick={load} className={`${secondary} flex items-center gap-2`}>
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {error && <p role="alert" className={errorBox}>{error}</p>}
      {notice && <p role="status" className={okBox}>{notice}</p>}

      {rows === null && !error && <p className="text-center py-16 text-slate-500 font-bold">Cargando…</p>}
      {rows?.length === 0 && (
        <div className="text-center py-16 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem]">
          <p className="text-slate-500 font-bold mb-4">Aún no hay gimnasios.</p>
          <button type="button" onClick={onNew} className={primary}>Crear el primero</button>
        </div>
      )}

      <div className="grid gap-4">
        {rows?.map((row) => (
          <div key={row.id} className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-black text-slate-900 dark:text-white">{row.name}</p>
                <p className="text-xs text-slate-500 font-bold">{row.slug} · {row.customers} socios</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${STATUS_STYLE[row.effectiveStatus]}`}>
                  {STATUS_LABELS[row.effectiveStatus]}
                </span>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{dateLabel(row.subscriptionEndsOn)}</p>
                  <p className={`text-xs font-bold ${row.daysLeft < 0 ? 'text-amber-600' : row.daysLeft <= 3 ? 'text-amber-500' : 'text-slate-500'}`}>
                    {row.daysLeft < 0 ? `venció hace ${-row.daysLeft} d` : row.daysLeft === 0 ? 'vence hoy' : `quedan ${row.daysLeft} d`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" disabled={busy === row.id} onClick={() => { setExtending(extending === row.id ? null : row.id); setAmount(''); }} className={primary}>
                Extender
              </button>
              <button type="button" disabled={busy === row.id} onClick={() => toggleSuspend(row)} className={secondary}>
                {row.status === 'suspended' ? 'Reactivar' : 'Suspender'}
              </button>
              <button type="button" disabled={busy === row.id} onClick={() => void run(row.id, async () => { await resendWelcome(row.id); return `Bienvenida reenviada al dueño de ${row.name}.`; })} className={secondary}>
                Reenviar bienvenida
              </button>
            </div>

            {extending === row.id && (
              <form onSubmit={(e) => submitExtend(row, e)} autoComplete="off" className="flex flex-wrap items-end gap-3 mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1">
                  Meses
                  <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className={`${fieldClass} block`}>
                    {[1, 2, 3, 6, 12].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1">
                  Pagó (USD)
                  <input autoComplete="off" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`${fieldClass} block`} />
                </label>
                <button disabled={busy === row.id} className={primary}>Registrar pago y extender</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

// ---- revenue ---------------------------------------------------------------------------------------------------

const Revenue: React.FC = () => {
  const [data, setData] = useState<MonthRevenue[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    monthlyRevenue()
      .then((rows) => !cancelled && setData(rows))
      .catch((err) => !cancelled && !(err instanceof ApiError && err.status === 401) && setError(errorText(err, 'No se pudieron cargar los ingresos.')));
    return () => {
      cancelled = true;
    };
  }, []);

  const current = new Date().toISOString().slice(0, 7);
  const thisMonth = data?.find((m) => m.month === current);
  const chart = data ? [...data].reverse().map((m) => ({ ...m, label: monthLabel(m.month) })) : [];

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-black text-slate-900 dark:text-white">Ingresos por suscripciones</h2>
      {error && <p role="alert" className={errorBox}>{error}</p>}
      {data === null && !error && <p className="text-center py-16 text-slate-500 font-bold">Cargando…</p>}
      {data && (
        <>
          <div className={cardClass}>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Este mes</p>
            <p className="text-4xl font-black text-blue-600 dark:text-blue-500 mt-1">{money(thisMonth?.total ?? 0)}</p>
            <p className="text-xs text-slate-500 font-bold mt-1">{thisMonth?.payments ?? 0} {(thisMonth?.payments ?? 0) === 1 ? 'pago registrado' : 'pagos registrados'}</p>
          </div>
          {chart.length > 0 ? (
            <div className={`${cardClass} h-72`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#64748b33" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip formatter={(value: number) => [money(value), 'Cobrado']} />
                  <Bar dataKey="total" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center py-12 text-slate-500 font-bold">Aún no hay pagos registrados. Se registran al extender la suscripción de un gimnasio.</p>
          )}
        </>
      )}
    </section>
  );
};

// ---- new gym ---------------------------------------------------------------------------------------------------

const EMPTY: NewTenant = {
  slug: '',
  name: '',
  ruc: '',
  legalName: '',
  tradeName: '',
  headOfficeAddress: '',
  regime: 'general',
  accountingRequired: false,
  providerCompanyId: '',
  providerApiKey: '',
  ownerUsername: '',
  ownerDisplayName: '',
  ownerEmail: '',
  environment: 'test',
  sriEstablishment: '001',
  emissionPointCode: '001',
};

const NewGym: React.FC<{ onCreated: () => void }> = ({ onCreated }) => {
  const [form, setForm] = useState<NewTenant>(EMPTY);
  const [error, setError] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof NewTenant>(key: K, value: NewTenant[K]) => setForm((f) => ({ ...f, [key]: value }));

  const text = (key: keyof NewTenant, label: string, opts: { type?: string; placeholder?: string; required?: boolean } = {}) => (
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1">
      {label}
      <input
        autoComplete="off"
        type={opts.type ?? 'text'}
        required={opts.required ?? true}
        placeholder={opts.placeholder}
        value={String(form[key] ?? '')}
        onChange={(e) => set(key, e.target.value as never)}
        className={`${fieldClass} block`}
      />
    </label>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const created = await onboardTenant({ ...form, slug: form.slug.trim().toLowerCase(), tradeName: form.tradeName?.trim() || undefined });
      setResult(
        created.welcomeEmailSent
          ? `Gimnasio "${created.slug}" creado. El dueño recibió un correo para crear su contraseña.`
          : `Gimnasio "${created.slug}" creado, pero el correo de bienvenida no salió. Reenvíalo desde la lista de gimnasios.`,
      );
      setForm(EMPTY);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) setError(formErrorText(err, 'No se pudo crear el gimnasio.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-black text-slate-900 dark:text-white">Nuevo gimnasio</h2>
      <p className="text-sm text-slate-500">Empieza con 30 días de prueba. El dueño recibe un correo con un enlace para crear su contraseña: nadie ve ni envía contraseñas.</p>
      {result && (
        <div className={`${okBox} flex flex-wrap items-center justify-between gap-3`}>
          <span role="status">{result}</span>
          <button type="button" onClick={onCreated} className={secondary}>Ver la lista</button>
        </div>
      )}
      {error && <p role="alert" className={errorBox}>{error}</p>}

      <form onSubmit={submit} autoComplete="off" className={`${cardClass} space-y-8`}>
        <fieldset className="grid sm:grid-cols-2 gap-4">
          <legend className="text-xs font-black text-blue-500 uppercase tracking-widest mb-3">Gimnasio</legend>
          {text('name', 'Nombre')}
          {text('slug', 'Identificador (para iniciar sesión)', { placeholder: 'titan' })}
          {text('legalName', 'Razón social')}
          {text('tradeName', 'Nombre comercial', { required: false })}
          {text('ruc', 'RUC', { placeholder: '13 dígitos' })}
          {text('headOfficeAddress', 'Dirección de la matriz')}
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1">
            Régimen
            <select value={form.regime} onChange={(e) => set('regime', e.target.value)} className={`${fieldClass} block`}>
              <option value="general">General</option>
              <option value="rimpe_emprendedor">RIMPE emprendedor</option>
              <option value="rimpe_negocio_popular">RIMPE negocio popular</option>
            </select>
          </label>
          <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300 self-end pb-2">
            <input type="checkbox" checked={form.accountingRequired} onChange={(e) => set('accountingRequired', e.target.checked)} className="w-4 h-4" />
            Obligado a llevar contabilidad
          </label>
        </fieldset>

        <fieldset className="grid sm:grid-cols-2 gap-4">
          <legend className="text-xs font-black text-blue-500 uppercase tracking-widest mb-3">Facturación (SICOFAC)</legend>
          {text('providerCompanyId', 'ID de empresa')}
          {text('providerApiKey', 'API key', { type: 'password' })}
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1">
            Ambiente
            <select value={form.environment} onChange={(e) => set('environment', e.target.value as NewTenant['environment'])} className={`${fieldClass} block`}>
              <option value="test">Pruebas</option>
              <option value="production">Producción</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            {text('sriEstablishment', 'Establecimiento')}
            {text('emissionPointCode', 'Punto de emisión')}
          </div>
        </fieldset>

        <fieldset className="grid sm:grid-cols-2 gap-4">
          <legend className="text-xs font-black text-blue-500 uppercase tracking-widest mb-3">Dueño</legend>
          {text('ownerDisplayName', 'Nombre')}
          {text('ownerUsername', 'Usuario', { placeholder: 'dueno.titan' })}
          {text('ownerEmail', 'Correo', { type: 'email' })}
        </fieldset>

        <button disabled={busy} className={primary}>{busy ? 'Creando…' : 'Crear gimnasio y enviar bienvenida'}</button>
      </form>
    </section>
  );
};

// ---- mail server -----------------------------------------------------------------------------------------------

const TEST_FAILURES: Record<string, string> = {
  auth_failed: 'El servidor rechazó el usuario o la contraseña.',
  tls_failed: 'No se pudo abrir la conexión segura. Revisa el puerto y la seguridad (465 = SSL, 587 = STARTTLS).',
  connection_failed: 'No se pudo conectar con el servidor. Revisa el servidor y el puerto.',
  rejected: 'El servidor rechazó el mensaje (remitente o destinatario).',
  invalid_address: 'La dirección de destino no es válida.',
};

const EmailTab: React.FC = () => {
  const [current, setCurrent] = useState<EmailSettings | null>(null);
  const [form, setForm] = useState<EmailSettingsInput>({ host: '', port: 465, security: 'ssl_on_connect', username: '', fromAddress: '', password: '' });
  const [testTo, setTestTo] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<'save' | 'test' | null>(null);

  const apply = (settings: EmailSettings) => {
    setCurrent(settings);
    if (settings.configured) {
      setForm({ host: settings.host, port: settings.port, security: settings.security, username: settings.username, fromAddress: settings.fromAddress, password: '' });
    }
  };

  useEffect(() => {
    let cancelled = false;
    getEmailSettings()
      .then((settings) => !cancelled && apply(settings))
      .catch((err) => !cancelled && !(err instanceof ApiError && err.status === 401) && setError(errorText(err, 'No se pudo cargar la configuración del correo.')));
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof EmailSettingsInput>(key: K, value: EmailSettingsInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  // Convenience only: the usual port for each kind of security.
  const changeSecurity = (security: EmailSettingsInput['security']) => setForm((f) => ({ ...f, security, port: security === 'ssl_on_connect' ? 465 : 587 }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('save');
    setError('');
    setNotice('');
    try {
      apply(await saveEmailSettings(form));
      setNotice('Configuración guardada. La contraseña quedó cifrada.');
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) setError(formErrorText(err, 'No se pudo guardar la configuración.'));
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy('test');
    setError('');
    setNotice('');
    try {
      await sendTestEmail(testTo);
      setNotice(`Mensaje de prueba enviado a ${testTo}. Revisa tu bandeja (y el spam).`);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'email_failed') setError(TEST_FAILURES[err.reason ?? ''] ?? 'El servidor de correo no aceptó el mensaje.');
      else if (!(err instanceof ApiError && err.status === 401)) setError(formErrorText(err, 'No se pudo enviar la prueba.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-black text-slate-900 dark:text-white">Correo del sistema</h2>
      <p className="text-sm text-slate-500">
        Con esta cuenta salen todos los correos (bienvenidas, confirmaciones). El remitente se ve con el nombre de cada gimnasio. La contraseña se guarda cifrada y no vuelve a mostrarse.
      </p>
      {error && <p role="alert" className={errorBox}>{error}</p>}
      {notice && <p role="status" className={okBox}>{notice}</p>}
      {current && !current.configured && <p className="text-sm font-bold text-amber-600">Aún no hay configuración guardada: se usa la del servidor, si existe.</p>}

      <form onSubmit={save} autoComplete="off" className={`${cardClass} space-y-6`}>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1">
            Servidor SMTP
            <input autoComplete="off" required value={form.host} onChange={(e) => set('host', e.target.value)} placeholder="smtp.ejemplo.com" className={`${fieldClass} block`} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1">
              Seguridad
              <select value={form.security} onChange={(e) => changeSecurity(e.target.value as EmailSettingsInput['security'])} className={`${fieldClass} block`}>
                <option value="ssl_on_connect">SSL/TLS (465)</option>
                <option value="start_tls">STARTTLS (587)</option>
              </select>
            </label>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1">
              Puerto
              <input autoComplete="off" required inputMode="numeric" value={form.port} onChange={(e) => set('port', Number(e.target.value.replace(/\D/g, '')) || 0)} className={`${fieldClass} block`} />
            </label>
          </div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1">
            Usuario
            <input autoComplete="off" value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="cuenta@dominio.com" className={`${fieldClass} block`} />
          </label>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1">
            Contraseña
            <input
              autoComplete="new-password"
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder={current?.passwordHint ? `${current.passwordHint} (déjala vacía para conservarla)` : ''}
              className={`${fieldClass} block`}
            />
          </label>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest space-y-1 sm:col-span-2">
            Remitente (dirección)
            <input autoComplete="off" required type="email" value={form.fromAddress} onChange={(e) => set('fromAddress', e.target.value)} placeholder="no-reply@dominio.com" className={`${fieldClass} block`} />
          </label>
        </div>
        <button disabled={busy !== null} className={primary}>{busy === 'save' ? 'Guardando…' : 'Guardar configuración'}</button>
      </form>

      <div className={`${cardClass} space-y-3`}>
        <h3 className="font-black text-slate-900 dark:text-white">Enviar un correo de prueba</h3>
        <p className="text-xs text-slate-500">Usa lo que está guardado (no el respaldo del servidor), así sabes si funciona de verdad.</p>
        <div className="flex flex-wrap gap-3">
          <input autoComplete="off" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="tu-correo@ejemplo.com" className={`${fieldClass} sm:max-w-sm`} />
          <button type="button" disabled={busy !== null || !current?.configured || testTo.trim() === ''} onClick={test} className={secondary}>
            {busy === 'test' ? 'Enviando…' : 'Enviar prueba'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default PlatformPanel;
