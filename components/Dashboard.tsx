
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Activity, BrainCircuit } from 'lucide-react';
import { getGymInsights } from '../services/geminiService';

const MOCK_DATA_EARNINGS = [
  { name: 'Lun', value: 1200 },
  { name: 'Mar', value: 900 },
  { name: 'Mie', value: 1500 },
  { name: 'Jue', value: 1100 },
  { name: 'Vie', value: 1800 },
  { name: 'Sab', value: 2100 },
  { name: 'Dom', value: 800 },
];

const MOCK_DATA_GENDER = [
  { name: 'Hombres', value: 45, color: '#3b82f6' },
  { name: 'Mujeres', value: 50, color: '#ec4899' },
  { name: 'Otros', value: 5, color: '#10b981' },
];

const Dashboard: React.FC = () => {
  const [aiInsight, setAiInsight] = useState<string>('Analizando tendencias...');

  useEffect(() => {
    const fetchInsights = async () => {
      const insight = await getGymInsights({
        active: 120,
        inactive: 30,
        weekly: 8400,
        genderBalance: 'Balanced'
      });
      setAiInsight(insight);
    };
    fetchInsights();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Resumen General</h2>
          <p className="text-slate-500 dark:text-slate-400">Panel de control de rendimiento del gimnasio.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <Activity className="text-green-500 w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-300">Sistema en línea</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Clientes Activos', value: '1,248', icon: <Users />, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-500' },
          { label: 'Ventas de Hoy', value: '$450.00', icon: <DollarSign />, color: 'bg-green-500/10 text-green-600 dark:text-green-500' },
          { label: 'Asistencia Hoy', value: '86', icon: <TrendingUp />, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-500' },
          { label: 'Planes por Vencer', value: '12', icon: <Activity />, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 transition-all shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-4 rounded-2xl ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tighter">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Earnings Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ingresos Semanales</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">Últimos 7 días</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_DATA_EARNINGS}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{ backgroundColor: 'white', darkBackgroundColor: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center lg:text-left">Socios por Sexo</h3>
          <div className="h-64 relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_DATA_GENDER}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {MOCK_DATA_GENDER.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }}
                  />
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-black text-slate-900 dark:text-white">1,2k</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
             </div>
          </div>
          <div className="mt-8 space-y-3">
            {MOCK_DATA_GENDER.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-500 dark:text-slate-300 font-bold">{item.name}</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-600/10 dark:to-purple-600/10 p-8 rounded-[2.5rem] border border-blue-200 dark:border-blue-500/30 flex flex-col md:flex-row gap-8 items-center md:items-start shadow-inner">
        <div className="bg-blue-600 p-6 rounded-[2rem] shadow-2xl shadow-blue-600/40 shrink-0">
          <BrainCircuit className="w-10 h-10 text-white" />
        </div>
        <div className="text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Insights Inteligentes</h3>
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase self-center">Beta AI</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic opacity-90">{aiInsight}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
