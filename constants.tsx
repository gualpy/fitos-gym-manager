
import React from 'react';
import { Customer, UserRole, SubscriptionPlan, Product, AttendanceRecord, BusinessHours, AppUser } from './types';
import { Users, CreditCard, ShoppingCart, BarChart3, Clock, Settings, LogOut, CheckSquare, FileText } from 'lucide-react';

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 1, clientCode: 1001, name: 'Juan Pérez', email: 'juan@example.com', role: UserRole.CUSTOMER, gender: 'M', age: 28, planStatus: 'ACTIVE', currentPlanId: 1, joinDate: '2023-10-01' },
  { id: 2, clientCode: 1002, name: 'María Garcia', email: 'maria@example.com', role: UserRole.CUSTOMER, gender: 'F', age: 34, planStatus: 'ACTIVE', currentPlanId: 2, joinDate: '2023-11-15' },
  { id: 3, clientCode: 1003, name: 'Carlos Ruiz', email: 'carlos@example.com', role: UserRole.CUSTOMER, gender: 'M', age: 45, planStatus: 'INACTIVE', joinDate: '2023-09-10' },
  { id: 4, clientCode: 1004, name: 'Ana Belén', email: 'ana@example.com', role: UserRole.CUSTOMER, gender: 'F', age: 22, planStatus: 'ACTIVE', currentPlanId: 1, joinDate: '2024-01-05' },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 1, customerId: 1, date: '2024-03-20', checkIn: '08:00 AM', checkOut: '09:30 AM' },
  { id: 2, customerId: 1, date: '2024-03-21', checkIn: '08:15 AM', checkOut: '10:00 AM' },
  { id: 3, customerId: 1, date: '2024-03-22', checkIn: '07:50 AM', checkOut: '09:15 AM' },
  { id: 4, customerId: 2, date: '2024-03-22', checkIn: '06:00 PM', checkOut: '07:30 PM' },
];

export const MOCK_PLANS: SubscriptionPlan[] = [
  { id: 1, name: 'Plan Mensual Básico', price: 40, durationMonths: 1, description: 'Acceso total al gimnasio por 1 mes.', isPromotion: false },
  { id: 2, name: 'Promo 2 Meses', price: 70, durationMonths: 2, description: 'Especial: Ahorra pagando 2 meses por adelantado.', isPromotion: true },
  { id: 3, name: 'Plan Anual Gold', price: 400, durationMonths: 12, description: 'Pago único anual con descuento VIP.', isPromotion: false },
];

export const MOCK_BUSINESS_HOURS: BusinessHours[] = [
  { day: 'Lunes', isOpen: true, openTime: '06:00', closeTime: '22:00' },
  { day: 'Martes', isOpen: true, openTime: '06:00', closeTime: '22:00' },
  { day: 'Miércoles', isOpen: true, openTime: '06:00', closeTime: '22:00' },
  { day: 'Jueves', isOpen: true, openTime: '06:00', closeTime: '22:00' },
  { day: 'Viernes', isOpen: true, openTime: '06:00', closeTime: '22:00' },
  { day: 'Sábado', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Domingo', isOpen: false, openTime: '00:00', closeTime: '00:00' },
];

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

// Credenciales demo: admin / admin123  ·  juan / juan123
export const MOCK_USERS: AppUser[] = [
  { id: 1, username: 'admin', passwordHash: 'bf6b5bdb74c79ece9fc0ad0ac9fb0359f9555d4f35a83b2e6ec69ae99e09603d', role: UserRole.ADMIN, displayName: 'Staff Admin' },
  { id: 2, username: 'juan', passwordHash: '6510bc396e0267a3294082b04305df9ad78a9d3747cfcf5d76746def4e61b915', role: UserRole.CUSTOMER, displayName: 'Juan Pérez', customerId: 1 },
];
