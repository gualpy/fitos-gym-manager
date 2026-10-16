
import React from 'react';
import { AttendanceRecord } from '../types';
import { Clock, Calendar, ArrowRightLeft } from 'lucide-react';

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
  customerId?: number;
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ records, customerId }) => {
  const filteredRecords = customerId 
    ? records.filter(r => r.customerId === customerId)
    : records;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Registro de Asistencia</h2>
          <p className="text-slate-400">Control de entradas detectadas por el sistema de acceso.</p>
        </div>
        <div className="bg-slate-800 px-5 py-3 rounded-2xl border border-slate-700 shadow-lg">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Total Entradas</span>
          <span className="text-2xl font-black text-blue-500">{filteredRecords.length}</span>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-24 bg-slate-800/20 rounded-[2.5rem] border-4 border-dashed border-slate-800">
            <p className="text-slate-500 font-bold uppercase tracking-widest">No hay actividad registrada aún.</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div key={record.id} className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-800 transition-all group">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white font-black text-lg">{new Date(`${record.date}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  <p className="text-xs text-slate-500 uppercase font-black tracking-widest mt-1">Socio #{record.customerId}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-10 bg-slate-900/80 px-8 py-4 rounded-2xl border border-slate-700 shadow-inner">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-black uppercase mb-1.5 tracking-tighter">Check-In</p>
                  <div className="flex items-center gap-2 text-green-400 font-mono font-black text-xl">
                    <Clock className="w-5 h-5" /> {record.checkIn}
                  </div>
                </div>
                <ArrowRightLeft className="w-5 h-5 text-slate-700" />
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-black uppercase mb-1.5 tracking-tighter">Check-Out</p>
                  <div className="flex items-center gap-2 text-slate-600 font-mono font-black text-xl italic">
                    {record.checkOut || '--:--'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;
