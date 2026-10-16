
import React from 'react';
import { MOCK_PLANS } from '../constants';
import { Plus, Tag, Calendar, Check, Edit3 } from 'lucide-react';

const PlansManager: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Planes y Membresías</h2>
          <p className="text-slate-400">Configura tus ofertas mensuales y promociones especiales.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20">
          <Plus className="w-5 h-5" /> Crear Nuevo Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_PLANS.map((plan) => (
          <div key={plan.id} className={`relative bg-slate-800 border-2 rounded-3xl p-6 transition-all hover:translate-y-[-4px] ${plan.isPromotion ? 'border-purple-500/50 bg-gradient-to-b from-slate-800 to-purple-900/10' : 'border-slate-700'}`}>
            {plan.isPromotion && (
              <div className="absolute -top-3 left-6 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-tighter">
                <Tag className="w-3 h-3" /> Promoción Activa
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <button className="text-slate-500 hover:text-white transition-colors">
                <Edit3 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-black text-white">${plan.price}</span>
              <span className="text-slate-400 text-sm">/ {plan.durationMonths} {plan.durationMonths === 1 ? 'mes' : 'meses'}</span>
            </div>

            <p className="text-slate-400 text-sm mb-8 line-clamp-2">{plan.description}</p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <div className="p-1 bg-green-500/20 rounded-full text-green-500"><Check className="w-3 h-3" /></div>
                Acceso a máquinas y pesas
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <div className="p-1 bg-green-500/20 rounded-full text-green-500"><Check className="w-3 h-3" /></div>
                Evaluación inicial gratis
              </li>
            </ul>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-auto pt-4 border-t border-slate-700">
              <Calendar className="w-4 h-4" /> Válido por {plan.durationMonths * 30} días
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlansManager;
