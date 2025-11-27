
import { PixPaymentData } from '../types';

// NOTE: These endpoints (/api/...) will work automatically on Vercel.
// Locally, you need to use 'vercel dev' or configure a proxy in vite.config.js.

export const createPixTransaction = async (amount: number, description: string): Promise<PixPaymentData> => {
  try {
    const response = await fetch('/api/create_pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, description })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro na API: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      transactionId: data.transactionId,
      qrCodeBase64: data.qrCodeBase64,
      copyPasteCode: data.copyPasteCode
    };

  } catch (error) {
    console.error("Erro ao criar Pix:", error);
    alert("Erro ao gerar o Pix. Tente novamente mais tarde.");
    throw error;
  }
};

export const checkPaymentStatus = async (transactionId: string): Promise<boolean> => {
  if (!transactionId) return false;

  try {
    const response = await fetch(`/api/check_status?id=${transactionId}`);
    
    if (response.ok) {
      const data = await response.json();
      return data.paid === true;
    }
  } catch (error) {
    console.error("Erro ao verificar status:", error);
  }
  
  return false;
};
