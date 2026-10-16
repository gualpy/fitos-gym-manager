
export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER'
}

export interface Customer {
  id: number; // Surrogate Key
  clientCode: number; // Numeric integer auto-generated
  name: string;
  email: string;
  role: UserRole;
  gender: 'M' | 'F' | 'O';
  age: number;
  planStatus: 'ACTIVE' | 'INACTIVE';
  currentPlanId?: number;
  rfidCard?: string;
  joinDate: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  durationMonths: number;
  description: string;
  isPromotion: boolean;
}
export interface BusinessHours {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface Sale {
  id: number;
  productId: number;
  customerId?: number;
  amount: number;
  quantity: number;
  date: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
}
