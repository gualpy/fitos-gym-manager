
import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Cpu, UserCircle } from 'lucide-react';
import { Customer } from '../types';

interface SimulatorProps {
  customers: Customer[];
  allowWithoutPlan: boolean;
  onCheckIn: (customerId: number) => void;
}

const CheckInSimulator: React.FC<SimulatorProps> = ({ customers, allowWithoutPlan, onCheckIn }) => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string; customer?: Customer } | null>(null);

  const handleAccess = () => {
    const customer = customers.find(c => c.clientCode === parseInt(code));
    
    if (!customer) {
      setResult({ success: false, message: 'Socio no registrado.' });
    } else {
      const isExpired = customer.planStatus !== 'ACTIVE';
      const canEnter = !isExpired || allowWithoutPlan;

      if (canEnter) {
        onCheckIn(customer.id);
        setResult({ 
          success: true, 
          message: isExpired ? 'Acceso especial permitido (Sin plan activo).' : '¡Acceso Correcto! Buen entreno.', 
          customer 
        });
      } else {
        setResult({ 
          success: false, 
          message: 'Plan vencido. Favor regularizar en recepción.', 
          customer 
        });
      }
    }
    setCode('');
    setTimeout(() => setResult(null), 4000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Simulador de Acceso Físico</h2>
        <p className="text-slate-400 mt-2">Prueba el comportamiento del torniquete con códigos de socios.</p>
      </div>

      <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 bg-blue-600/10 w-48 h-48 rounded-full blur-3xl"></div>

        <div className="relative z-10 space-y-8">
          <div className="flex justify-center">
             <div className="bg-slate-900 p-6 rounded-3xl border border-slate-700 shadow-inner">
                <Cpu className="text-blue-500 w-12 h-12 animate-pulse" />
             </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Escanee su código o ingréselo</label>
            <input
              type="number"
              value={code}
              autoFocus
              onChange={(e) => setCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAccess()}
              className="w-full bg-slate-900 border-2 border-slate-700 rounded-3xl px-4 py-6 text-5xl font-black tracking-[0.4em] text-center focus:border-blue-500 focus:outline-none text-white transition-all shadow-2xl"
              placeholder="0000"
            />
          </div>

          <button
            onClick={handleAccess}
            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-[1.5rem] transition-all shadow-xl shadow-blue-600/30 active:scale-95 uppercase tracking-widest"
          >
            Validar Acceso
          </button>
        </div>

        {result && (
          <div className={`mt-10 p-6 rounded-3xl border-2 animate-in zoom-in duration-300 ${
            result.success ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500'
          }`}>
            <div className="flex items-start gap-5">
              <div className={`p-4 rounded-2xl shadow-lg ${result.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {result.success ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-black uppercase tracking-tight">{result.success ? 'Bienvenido' : 'Alto'}</h4>
                <p className="font-bold text-slate-300 mt-1">{result.message}</p>
                {result.customer && (
                  <div className="mt-4 flex items-center gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-700">
                    <UserCircle className="w-10 h-10 opacity-40 text-blue-400" />
                    <div>
                      <p className="text-white font-black text-lg leading-none">{result.customer.name}</p>
                      <p className="text-xs uppercase font-black text-slate-500 mt-1.5 tracking-widest">Socio ID #{result.customer.clientCode}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full animate-pulse ${allowWithoutPlan ? 'bg-orange-500' : 'bg-green-500'}`}></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Modo de Seguridad: {allowWithoutPlan ? 'Abierto (Permisivo)' : 'Estricto (Solo Pagados)'}
        </p>
      </div>
    </div>
  );
};

export default CheckInSimulator;
