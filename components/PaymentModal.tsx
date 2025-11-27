import React, { useState } from 'react';
import { X, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { PixPaymentData, Plan } from '../types';
import QRCode from 'react-qr-code';

interface PaymentModalProps {
  plan: Plan;
  pixData: PixPaymentData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ plan, pixData, onClose, onSuccess }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    if (pixData?.copyPasteCode) {
      navigator.clipboard.writeText(pixData.copyPasteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!pixData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1c2732] w-full max-w-md rounded-xl border border-[#2b5278] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="bg-[#232e3c] p-4 flex justify-between items-center border-b border-[#131a21]">
          <h3 className="text-white font-semibold text-lg">Pagamento via Pix</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center overflow-y-auto">
          <div className="text-center mb-4">
            <p className="text-gray-300 text-sm">Você está adquirindo:</p>
            <p className="text-white font-bold text-xl mt-1">{plan.name}</p>
            <p className="text-[#64b5f6] font-bold text-2xl mt-1">R$ {plan.price.toFixed(2).replace('.', ',')}</p>
          </div>

          <div className="bg-white p-2 rounded-lg mb-6">
            <QRCode 
              value={pixData.copyPasteCode} 
              size={180}
              viewBox={`0 0 256 256`}
            />
          </div>

          <div className="w-full mb-4">
            <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Pix Copia e Cola</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={pixData.copyPasteCode}
                className="bg-[#0f161e] text-gray-300 text-sm rounded-lg p-3 w-full border border-[#2b5278] focus:outline-none"
              />
              <button 
                onClick={handleCopy}
                className={`p-3 rounded-lg flex items-center justify-center transition-colors ${copied ? 'bg-green-600' : 'bg-[#2b5278] hover:bg-[#356491]'}`}
              >
                {copied ? <CheckCircle className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>

          <div className="bg-[#151e27] p-4 rounded-lg w-full text-center">
            <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Aguardando pagamento...</span>
            </div>
            <p className="text-xs text-gray-500">
              O acesso será liberado automaticamente assim que o banco confirmar a transação.
            </p>
          </div>
          
          <button 
            onClick={onSuccess}
            className="mt-6 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-sm uppercase tracking-wide"
          >
            (Simular) Já fiz o pagamento
          </button>
        </div>
      </div>
    </div>
  );
};