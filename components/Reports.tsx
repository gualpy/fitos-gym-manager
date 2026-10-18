
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line } from 'recharts';
import { Sale } from '../types';
import { Customer, ageOf, searchCustomers } from '../services/customers';
import { errorText } from '../utils/errors';

interface ReportsProps {
  sales: Sale[];
}

const Reports: React.FC<ReportsProps> = ({ sales }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadError, setLoadError] = useState('');

  // Demographics come from the real member list (the API caps a page at 100).
  useEffect(() => {
    let cancelled = false;
    searchCustomers({ pageSize: 100 })
      .then((page) => !cancelled && setCustomers(page.items))
      .catch((err) => !cancelled && setLoadError(errorText(err, 'No se pudieron cargar los socios.')));
    return () => {
      cancelled = true;
    };
  }, []);

  // Procesar datos de edad por rangos
  const ageRanges = [
    { range: '18-25', count: 0 },
    { range: '26-35', count: 0 },
    { range: '36-50', count: 0 },
    { range: '50+', count: 0 },
  ];

  customers.forEach(c => {
    const age = ageOf(c.birthDate);
    if (age === null) return;
    if (age <= 25) ageRanges[0].count++;
    else if (age <= 35) ageRanges[1].count++;
    else if (age <= 50) ageRanges[2].count++;
    else ageRanges[3].count++;
  });

  // Procesar asistencia por sexo (Simulado con datos de clientes para este ejemplo)
  const genderStats = [
    { name: 'Masculino', count: customers.filter(c => c.gender === 'M').length },
    { name: 'Femenino', count: customers.filter(c => c.gender === 'F').length },
    { name: 'Otro', count: customers.filter(c => c.gender === 'O').length },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white">Analítica Avanzada</h2>
        <p className="text-slate-400">Reportes demográficos y de rendimiento financiero.</p>
        {loadError && <p role="alert" className="mt-2 text-sm font-bold text-red-400">{loadError}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribución por Edad */}
        <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-6">Distribución por Rangos de Edad</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageRanges}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asistencia por Género */}
        <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-6">Socios por Género</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {genderStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Femenino' ? '#ec4899' : entry.name === 'Masculino' ? '#3b82f6' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-6">Ganancias Estimadas por Día</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={[
              { day: 'Lun', ingresos: 1200, meta: 1000 },
              { day: 'Mar', ingresos: 900, meta: 1000 },
              { day: 'Mie', ingresos: 1500, meta: 1000 },
              { day: 'Jue', ingresos: 1100, meta: 1000 },
              { day: 'Vie', ingresos: 1800, meta: 1000 },
              { day: 'Sab', ingresos: 2100, meta: 1500 },
              { day: 'Dom', ingresos: 800, meta: 1000 },
            ]}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
              <Bar dataKey="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="meta" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
