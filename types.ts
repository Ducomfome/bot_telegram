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