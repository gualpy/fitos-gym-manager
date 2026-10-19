
import React from 'react';
import { UserRole, Product } from './types';
import { Users, CreditCard, ShoppingCart, BarChart3, Clock, Settings, LogOut, CheckSquare, FileText } from 'lucide-react';

export const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Proteína Whey 1kg', price: 35, stock: 15, category: 'Suplementos' },
  { id: 2, name: 'Agua Mineral 500ml', price: 1.5, stock: 100, category: 'Bebidas' },
  { id: 3, name: 'Bebida Isotónica', price: 2.5, stock: 40, category: 'Bebidas' },
];

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
