
import React from 'react';
import { NAV_ITEMS } from '../constants';
import { LogOut, Dumbbell, Package, Sun, Moon, UsersRound } from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  onLogout: () => void;
  userRole: UserRole;
  /** Owner and administrators only: receptionists never see the team. */
  canManageTeam: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, userRole, canManageTeam, isDarkMode, toggleDarkMode }) => {
  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full sticky top-0 shadow-2xl z-20 transition-colors">
      <div className="p-8 flex items-center gap-4">
        <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-600/30">
          <Dumbbell className="text-white w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Fit<span className="text-blue-500">OS</span></h1>
      </div>

      <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.filter(item => item.roles.includes(userRole)).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
              activeTab === item.id
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-slate-100 hover:translate-x-1'
            }`}
          >
            <div className={`${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'} transition-colors`}>
              {item.icon}
            </div>
            <span className="font-bold text-sm tracking-tight">{item.label}</span>
          </button>
        ))}

        {canManageTeam && (
          <button
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
              activeTab === 'team'
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-slate-100 hover:translate-x-1'
            }`}
          >
            <div className={`${activeTab === 'team' ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'} transition-colors`}>
              <UsersRound className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm tracking-tight">Equipo</span>
          </button>
        )}

        {userRole === UserRole.ADMIN && (
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-slate-100 hover:translate-x-1'
            }`}
          >
            <div className={`${activeTab === 'inventory' ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'} transition-colors`}>
              <Package className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm tracking-tight">Gestión Inventario</span>
          </button>
        )}
      </nav>

      <div className="p-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between gap-4 px-5 py-3 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-2xl transition-all hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span className="font-bold text-xs uppercase tracking-widest">{isDarkMode ? 'Oscuro' : 'Claro'}</span>
          </div>
          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
          </div>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-5 py-4 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-2xl transition-all font-bold text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
