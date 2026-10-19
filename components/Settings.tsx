import React, { useCallback, useEffect, useState } from 'react';
import { Save, Clock, CalendarCheck, ShieldQuestion, Sun, Moon, Palette } from 'lucide-react';
import { GymSettings, HoursDay, getSettings, saveSettings, weekdayName } from '../services/settings';
import { errorText, formErrorText } from '../utils/errors';

interface SettingsProps {
  /** Only owners and administrators may change the rules; reception can look. */
  canEdit: boolean;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

const timeInputClass = 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white px-4 py-2 focus:border-blue-500 focus:outline-none';

const Settings: React.FC<SettingsProps> = ({ canEdit, isDarkMode, setIsDarkMode }) => {
  const [saved, setSaved] = useState<GymSettings | null>(null);
  const [allowWithoutPlan, setAllowWithoutPlan] = useState(false);
  const [hours, setHours] = useState<HoursDay[]>([]);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const apply = (settings: GymSettings) => {
    setSaved(settings);
    setAllowWithoutPlan(settings.allowWithoutPlan);
    setHours(settings.hours);
  };

  const load = useCallback(async () => {
    try {
      apply(await getSettings());
      setLoadError('');
    } catch (err) {
      setLoadError(errorText(err, 'No se pudo cargar la configuración.'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changeDay = (weekday: number, change: Partial<HoursDay>) => {
    setJustSaved(false);
    setHours((prev) => prev.map((day) => (day.weekday === weekday ? { ...day, ...change } : day)));
  };

  const submit = async () => {
    setSaving(true);
    setSaveError('');
    setJustSaved(false);
    try {
      apply(
        await saveSettings({
          allowWithoutPlan,
          hours: hours.map(({ weekday, isOpen, openTime, closeTime }) => ({ weekday, isOpen, openTime, closeTime })),
        }),
      );
      setJustSaved(true);
    } catch (err) {
      setSaveError(formErrorText(err, 'No se pudo guardar la configuración.'));
    } finally {
      setSaving(false);
    }
  };

  const editable = canEdit && saved !== null;

  return (
    <div className="max-w-4xl space-y-10 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">Configuración del Sistema</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Reglas de negocio y gestión de sede física{saved?.branch ? ` · ${saved.branch.name}` : ''}.
        </p>
      </div>

      {loadError && (
        <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-5 py-3">{loadError}</p>
      )}
      {!canEdit && saved && (
        <p className="text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-2xl px-5 py-3">
          Solo el propietario o un administrador puede cambiar estas reglas.
        </p>
      )}

      {/* Preferencia de Apariencia */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-2xl">
        <div className="p-8 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
          <Palette className="text-blue-500 w-8 h-8" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Personalización Visual</h3>
        </div>
        <div className="p-8">
           <p className="text-sm text-slate-500 mb-6 font-medium">Elige el tema visual predeterminado para tu consola de FitOS. Esta opción se guardará como tu preferencia principal.</p>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Opción Modo Claro */}
              <button 
                onClick={() => setIsDarkMode(false)}
                className={`group relative overflow-hidden rounded-3xl border-4 transition-all text-left ${!isDarkMode ? 'border-blue-600 ring-4 ring-blue-500/10' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}
              >
                <div className="p-6 bg-slate-50 flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${!isDarkMode ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>
                    <Sun className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Modo Claro</h4>
                    <p className="text-[10px] text-slate-500 font-bold">Luminoso y Profesional</p>
                  </div>
                </div>
                <div className="h-20 bg-white border-t border-slate-200 p-4">
                   <div className="flex gap-2">
                      <div className="w-8 h-2 bg-slate-100 rounded"></div>
                      <div className="w-12 h-2 bg-slate-100 rounded"></div>
                   </div>
                   <div className="mt-3 w-full h-8 bg-slate-50 rounded-lg border border-slate-100"></div>
                </div>
                {!isDarkMode && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white p-1 rounded-full">
                    <Save className="w-3 h-3" />
                  </div>
                )}
              </button>

              {/* Opción Modo Oscuro */}
              <button 
                onClick={() => setIsDarkMode(true)}
                className={`group relative overflow-hidden rounded-3xl border-4 transition-all text-left ${isDarkMode ? 'border-blue-600 ring-4 ring-blue-500/10' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}
              >
                <div className="p-6 bg-slate-900 flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                    <Moon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-white uppercase text-xs tracking-widest">Modo Oscuro</h4>
                    <p className="text-[10px] text-slate-400 font-bold">Inmersivo y Premium</p>
                  </div>
                </div>
                <div className="h-20 bg-slate-950 border-t border-slate-800 p-4">
                   <div className="flex gap-2">
                      <div className="w-8 h-2 bg-slate-800 rounded"></div>
                      <div className="w-12 h-2 bg-slate-800 rounded"></div>
                   </div>
                   <div className="mt-3 w-full h-8 bg-slate-900 rounded-lg border border-slate-800"></div>
                </div>
                {isDarkMode && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white p-1 rounded-full">
                    <Save className="w-3 h-3" />
                  </div>
                )}
              </button>
           </div>
        </div>
      </div>

      {/* Reglas de Acceso */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-2xl">
        <div className="p-8 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
          <ShieldQuestion className="text-blue-500 w-8 h-8" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Políticas de Acceso al Gimnasio</h3>
        </div>
        <div className="p-8">
           <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-700">
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Permitir entrada a clientes sin plan activo</h4>
                <p className="text-sm text-slate-500">Si se activa, el torniquete permitirá el acceso a socios aunque su suscripción haya vencido.</p>
              </div>
              <button 
                type="button"
                role="switch"
                aria-checked={allowWithoutPlan}
                aria-label="Permitir entrada a clientes sin plan activo"
                disabled={!editable}
                onClick={() => { setJustSaved(false); setAllowWithoutPlan(!allowWithoutPlan); }}
                className={`disabled:opacity-50 w-16 h-8 rounded-full transition-all relative flex items-center px-1 ${allowWithoutPlan ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-all transform ${allowWithoutPlan ? 'translate-x-8' : 'translate-x-0'}`}></div>
              </button>
           </div>
        </div>
      </div>

      {/* Horarios */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-2xl">
        <div className="p-8 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
          <CalendarCheck className="text-blue-500 w-8 h-8" />
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Horario Laboral</h3>
            {saved && hours.some((day) => !day.configured) && (
              <p className="text-xs text-slate-500 mt-1">Los días sin guardar no restringen el acceso.</p>
            )}
          </div>
        </div>

        <div className="p-8 space-y-4">
          {saved === null && !loadError && <p className="text-slate-500 font-bold">Cargando horarios…</p>}
          {hours.map((item) => (
            <div key={item.weekday} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/50 gap-4">
              <label className="flex items-center gap-5 w-40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.isOpen}
                  disabled={!editable}
                  onChange={(e) => changeDay(item.weekday, { isOpen: e.target.checked })}
                  className="w-6 h-6 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-600 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                />
                <span className={`font-black text-lg ${item.isOpen ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>{weekdayName(item.weekday)}</span>
              </label>

              <div className={`flex items-center gap-6 flex-1 justify-center ${!item.isOpen && 'opacity-20 grayscale pointer-events-none'}`}>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <input
                    type="time"
                    aria-label={`Apertura del ${weekdayName(item.weekday).toLowerCase()}`}
                    value={item.openTime}
                    disabled={!editable}
                    onChange={(e) => changeDay(item.weekday, { openTime: e.target.value })}
                    className={timeInputClass}
                  />
                </div>
                <span className="text-slate-300 dark:text-slate-700 font-black">❯</span>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <input
                    type="time"
                    aria-label={`Cierre del ${weekdayName(item.weekday).toLowerCase()}`}
                    value={item.closeTime}
                    disabled={!editable}
                    onChange={(e) => changeDay(item.weekday, { closeTime: e.target.value })}
                    className={timeInputClass}
                  />
                </div>
              </div>

              <div className="w-28 text-right self-end sm:self-auto">
                <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest ${item.isOpen ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500 border border-green-200 dark:border-green-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/20'}`}>
                  {item.isOpen ? 'Operativo' : 'Cerrado'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-end gap-4">
          {saveError && <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400">{saveError}</p>}
          {justSaved && <p role="status" className="text-sm font-bold text-green-600 dark:text-green-400">Configuración guardada.</p>}
          <button
            type="button"
            onClick={submit}
            disabled={!editable || saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-3"
          >
            <Save className="w-5 h-5" /> {saving ? 'Guardando…' : 'Aplicar Configuración'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
