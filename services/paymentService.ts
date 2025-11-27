import { PixPaymentData } from '../types';

// Mock function to simulate generating a Pix Code via Sync Pay
// In a real scenario, you would make a POST request to the Sync Pay API
export const createPixTransaction = async (amount: number, description: string): Promise<PixPaymentData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        transactionId: `tx_${Math.random().toString(36).substr(2, 9)}`,
        // This is a dummy QR code placeholder for visual demonstration
        qrCodeBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", 
        copyPasteCode: "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913SyncPay Store6008Brasilia62070503***63041D3D",
      });
    }, 1500);
  });
};

// Mock function to check payment status
export const checkPaymentStatus = async (transactionId: string): Promise<boolean> => {
    // In a real app, this would query your backend which listens to the Webhook
    return new Promise((resolve) => {
        // Randomly succeed for demo purposes after a few checks, or always return false until "Simulate Pay" is clicked
        resolve(false);
    });
};