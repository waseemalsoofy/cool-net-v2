
export enum UserRole {
  ADMIN = 'ADMIN',
  WHOLESALER = 'WHOLESALER',
  CUSTOMER = 'CUSTOMER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  BLOCKED = 'BLOCKED'
}

export enum CardStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  walletBalance: number;
  shopName?: string;
}

export interface Package {
  id: string;
  name: string;
  basePrice: number;
  wholesalePrice: number;
}

export interface Card {
  id: string;
  packageId: string;
  cardNumber: string;
  status: CardStatus;
  soldToUserId?: string;
}

export interface Order {
  id: string;
  userId: string;
  packageId: string;
  cardId: string;
  totalPrice: number;
  paymentMethod: 'WALLET' | 'DIRECT';
  customerPhone?: string; // For wholesalers
  timestamp: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  status: TransactionStatus;
  receiptUrl?: string;
  timestamp: number;
}
