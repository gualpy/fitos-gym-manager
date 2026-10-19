
export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER'
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
