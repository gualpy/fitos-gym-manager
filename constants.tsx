
import React from 'react';
import { UserRole } from './types';
import { Users, CreditCard, ShoppingCart, BarChart3, Clock, Settings, LogOut, CheckSquare, FileText } from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.CUSTOMER] },
  { id: 'customers', label: 'Clientes', icon: <Users className="w-5 h-5" />, roles: [UserRole.ADMIN] },
  { id: 'plans', label: 'Planes y Promos', icon: <CreditCard className="w-5 h-5" />, roles: [UserRole.ADMIN] },
  { id: 'pos', label: 'Ventas (POS)', icon: <ShoppingCart className="w-5 h-5" />, roles: [UserRole.ADMIN] },
  { id: 'attendance', label: 'Asistencia', icon: <Clock className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.CUSTOMER] },
  { id: 'reports', label: 'Reportes', icon: <FileText className="w-5 h-5" />, roles: [UserRole.ADMIN] },
  { id: 'checkin', label: 'Acceso Torniquete', icon: <CheckSquare className="w-5 h-5" />, roles: [UserRole.ADMIN] },
  { id: 'settings', label: 'Configuración', icon: <Settings className="w-5 h-5" />, roles: [UserRole.ADMIN] },
];
