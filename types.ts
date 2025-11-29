
export type MessageType = 'text' | 'image' | 'video';

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  sender: 'bot' | 'user';
  timestamp: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  label: string;
}

export interface PixPaymentData {
  qrCodeBase64: string;
  copyPasteCode: string;
  transactionId: string;
}

export type PaymentStatus = 'idle' | 'loading' | 'pending' | 'approved';

export interface UserLocation {
  city: string;
  state: string;
  country: string;
}

// Dashboard Types
export interface TransactionRecord {
  id: string;
  customerName: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  location: string; // "São Paulo - SP"
}

export interface DashboardStats {
  totalRevenue: number;
  totalVisitors: number;
  conversionRate: number;
  activeUsers: number;
  salesByDay: { day: string; value: number }[];
  statusDistribution: { status: string; count: number; color: string }[];
  recentTransactions: TransactionRecord[];
}