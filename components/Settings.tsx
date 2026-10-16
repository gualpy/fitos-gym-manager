
import React, { useState } from 'react';
import { MOCK_BUSINESS_HOURS } from '../constants';
import { Save, Clock, CalendarCheck, ShieldQuestion, Database, Download, Sun, Moon, Palette } from 'lucide-react';

interface SettingsProps {
  allowWithoutPlan: boolean;
  setAllowWithoutPlan: (val: boolean) => void;
  onDownloadBackup: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ allowWithoutPlan, setAllowWithoutPlan, onDownloadBackup, isDarkMode, setIsDarkMode }) => {
  const [hours, setHours] = useState(MOCK_BUSINESS_HOURS);

  return (
    <div className="max-w-4xl space-y-10 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">Configuración del Sistema</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Reglas de negocio y gestión de sede física.</p>
      </div>

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
                onClick={() => setAllowWithoutPlan(!allowWithoutPlan)}
                className={`w-16 h-8 rounded-full transition-all relative flex items-center px-1 ${allowWithoutPlan ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-all transform ${allowWithoutPlan ? 'translate-x-8' : 'translate-x-0'}`}></div>
              </button>
           </div>
        </div>
      </div>

      {/* Mantenimiento y Backup */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-2xl">
        <div className="p-8 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
          <Database className="text-blue-500 w-8 h-8" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Base de Datos y Seguridad</h3>
        </div>
        <div className="p-8">
           <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl border border-blue-100 dark:border-slate-700 gap-6">
              <div className="text-center md:text-left">
                <h4 className="font-black text-slate-900 dark:text-white text-lg mb-1 uppercase tracking-tight">Descargar Copia de Seguridad</h4>
                <p className="text-sm text-slate-500 font-medium">Obtén un archivo JSON con todos los datos de socios, ventas, inventario e historial de asistencia.</p>
              </div>
              <button 
                onClick={onDownloadBackup}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-xl shadow-slate-900/10"
              >
                <Download className="w-5 h-5" /> Exportar JSON
              </button>
           </div>
        </div>
      </div>

      {/* Horarios */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-2xl">
        <div className="p-8 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
          <CalendarCheck className="text-blue-500 w-8 h-8" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Horario Laboral</h3>
        </div>

        <div className="p-8 space-y-4">
          {hours.map((item, index) => (
            <div key={item.day} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/50 gap-4">
              <div className="flex items-center gap-5 w-40">
                <input 
                  type="checkbox" 
                  checked={item.isOpen} 
                  className="w-6 h-6 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-600 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                  readOnly
                />
                <span className={`font-black text-lg ${item.isOpen ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>{item.day}</span>
              </div>

              <div className={`flex items-center gap-6 flex-1 justify-center ${!item.isOpen && 'opacity-20 grayscale pointer-events-none'}`}>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <input type="time" defaultValue={item.openTime} className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white px-4 py-2 focus:border-blue-500 focus:outline-none" />
                </div>
                <span className="text-slate-300 dark:text-slate-700 font-black">❯</span>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <input type="time" defaultValue={item.closeTime} className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white px-4 py-2 focus:border-blue-500 focus:outline-none" />
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

        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-3">
            <Save className="w-5 h-5" /> Aplicar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
