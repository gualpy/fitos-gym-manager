
import React, { useState } from 'react';
import { Customer, UserRole } from '../types';
import { Search, Plus, UserCheck, UserX, X, CreditCard } from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  onAdd: (customer: any) => void;
  onToggleStatus: (id: number) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, onAdd, onToggleStatus }) => {
  const [showModal, setShowModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    gender: 'M' as 'M' | 'F' | 'O',
    age: 25,
    planStatus: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    role: UserRole.CUSTOMER
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(newCustomer);
    setShowModal(false);
    setNewCustomer({ name: '', email: '', gender: 'M', age: 25, planStatus: 'ACTIVE', role: UserRole.CUSTOMER });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Directorio de Socios</h2>
          <p className="text-slate-500 dark:text-slate-400">Control maestro de la base de datos de clientes.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-2xl transition-all font-black uppercase tracking-widest shadow-lg shadow-blue-900/30 active:scale-95 text-xs"
        >
          <Plus className="w-5 h-5" /> Inscribir Nuevo
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <Search className="w-6 h-6 text-slate-400 dark:text-slate-500 ml-3" />
        <input 
          type="text" 
          placeholder="Filtrar socios por nombre o código de acceso..." 
          className="bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-200 w-full placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold"
        />
      </div>

      <div className="overflow-x-auto rounded-[2rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 backdrop-blur-md shadow-sm dark:shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <th className="p-6 font-black text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em]">Acceso</th>
              <th className="p-6 font-black text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em]">Identidad</th>
              <th className="p-6 font-black text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em]">Datos</th>
              <th className="p-6 font-black text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em]">Membresía</th>
              <th className="p-6 font-black text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] text-center">Gestión</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all">
                <td className="p-6">
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-black text-lg bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">#{customer.clientCode}</span>
                </td>
                <td className="p-6">
                  <div>
                    <div className="font-black text-slate-900 dark:text-white text-base leading-none">{customer.name}</div>
                    <div className="text-[10px] text-slate-500 font-bold mt-2">{customer.email}</div>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${customer.gender === 'F' ? 'bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-500 border-pink-200 dark:border-pink-500/20' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-200 dark:border-blue-500/20'}`}>{customer.gender}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-tighter">{customer.age} años</span>
                  </div>
                </td>
                <td className="p-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest border ${
                    customer.planStatus === 'ACTIVE' 
                    ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500 border-green-200 dark:border-green-500/20' 
                    : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-500 border-red-200 dark:border-red-500/20'
                  }`}>
                    {customer.planStatus === 'ACTIVE' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                    {customer.planStatus === 'ACTIVE' ? 'Socio Activo' : 'Vencido'}
                  </div>
                </td>
                <td className="p-6 text-center">
                  <button 
                    onClick={() => onToggleStatus(customer.id)}
                    className={`p-3 rounded-2xl transition-all shadow-lg flex items-center gap-2 font-black text-[10px] uppercase tracking-tighter mx-auto ${
                        customer.planStatus === 'ACTIVE' 
                        ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white' 
                        : 'bg-green-600 text-white hover:bg-green-500'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    {customer.planStatus === 'ACTIVE' ? 'Dar de Baja' : 'Activar Membresía'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Alta de Socio</h3>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 transition-colors">
                <X className="w-8 h-8" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nombre y Apellido</label>
                  <input required value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-blue-600 outline-none font-bold" />
                </div>
                <div className="col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email Corporativo</label>
                  <input required value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} type="email" className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-blue-600 outline-none font-bold" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Género</label>
                  <select value={newCustomer.gender} onChange={e => setNewCustomer({...newCustomer, gender: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-blue-600 outline-none font-bold appearance-none">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Edad Actual</label>
                  <input required value={newCustomer.age} onChange={e => setNewCustomer({...newCustomer, age: parseInt(e.target.value)})} type="number" className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-blue-600 outline-none font-bold" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-blue-600/30 active:scale-95 uppercase tracking-widest">
                Confirmar Registro
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
