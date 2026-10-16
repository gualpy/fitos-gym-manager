import React from 'react';
import { Dumbbell } from 'lucide-react';

/** Shared frame of the screens shown before the main app (login, forced password change). */
const AuthCard: React.FC<{ subtitle: string; children: React.ReactNode }> = ({ subtitle, children }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
    <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 shadow-2xl animate-in zoom-in duration-500">
      <div className="flex justify-center mb-8">
        <div className="bg-blue-600 p-5 rounded-3xl shadow-2xl shadow-blue-600/30">
          <Dumbbell className="text-white w-12 h-12" />
        </div>
      </div>
      <h1 className="text-4xl font-black text-center text-slate-900 dark:text-white mb-2 tracking-tighter">Fit<span className="text-blue-500">OS</span></h1>
      <p className="text-slate-500 text-center mb-10 font-bold uppercase tracking-[0.2em] text-xs">{subtitle}</p>
      {children}
    </div>
  </div>
);

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">{label}</label>
    {children}
  </div>
);

export const textInputClass =
  'w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all font-bold';

export const primaryButtonClass =
  'w-full disabled:opacity-60 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] text-lg uppercase tracking-widest';

export default AuthCard;
