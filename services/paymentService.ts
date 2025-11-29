
import { PixPaymentData } from '../types';

export const createPixTransaction = async (amount: number, description: string): Promise<PixPaymentData> => {
  try {
    const response = await fetch('/api/create_pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, description })
    });

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Erro Crítico (HTML Retornado):", text);
      throw new Error("Erro de comunicação com o servidor de pagamento.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Erro desconhecido ao gerar Pix.");
    }
    
    // Fallback de segurança se os campos vierem vazios
    if (!data.copyPasteCode && !data.qrCodeBase64) {
      console.warn("Payload Debug:", data); // Mostra o que veio da API para debug
      throw new Error("A API conectou, mas não retornou o QR Code.");
    }

    return {
      transactionId: data.transactionId,
      qrCodeBase64: data.qrCodeBase64,
      copyPasteCode: data.copyPasteCode
    };

  } catch (error: any) {
    console.error("Service Pix Error:", error);
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
    console.error("Status Check Error:", error);
  }
  
  return false;
};
