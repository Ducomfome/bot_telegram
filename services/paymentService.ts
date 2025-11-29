
import { PixPaymentData } from '../types';

export const createPixTransaction = async (amount: number, description: string): Promise<PixPaymentData> => {
  try {
    // Calling the local Vercel API function
    const response = await fetch('/api/create_pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, description })
    });

    // Check content type to parse appropriately
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else {
      // If it's not JSON (likely an error page), get text to debug but throw standard error
      const text = await response.text();
      console.error("Non-JSON response from API:", text);
      throw new Error(`Erro no servidor (Status ${response.status}). Verifique o console.`);
    }

    if (!response.ok) {
      throw new Error(data.error || `Erro na API: ${response.status}`);
    }
    
    if (!data.copyPasteCode && !data.qrCodeBase64) {
      throw new Error("A API não retornou o código Pix. Tente novamente.");
    }

    return {
      transactionId: data.transactionId,
      qrCodeBase64: data.qrCodeBase64,
      copyPasteCode: data.copyPasteCode
    };

  } catch (error: any) {
    console.error("Erro ao criar Pix:", error);
    // Return explicit error message to UI
    throw new Error(error.message || "Falha na comunicação com o pagamento.");
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
