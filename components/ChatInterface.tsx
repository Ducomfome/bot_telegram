import React, { useState, useEffect, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { PaymentModal } from './PaymentModal';
import { Message, Plan, PixPaymentData, PaymentStatus, UserLocation } from '../types';
import { MEDIA_URLS, SALES_COPY, PLANS, SUCCESS_LINK } from '../constants';
import { createPixTransaction, checkPaymentStatus } from '../services/paymentService';
import { Lock, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [buttonsVisible, setButtonsVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | undefined>(undefined);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, buttonsVisible]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // GEOLOCALIZAÇÃO SILENCIOSA (VIA IP)
  useEffect(() => {
    const fetchIPLocation = async () => {
      try {
        // API gratuita que retorna dados baseados no IP da conexão
        // Timeout para não travar se a API demorar
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch('https://ipwho.is/', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const data = await res.json();
        
        if (data && data.success) {
          setUserLocation({
            city: data.city || 'Desconhecido',
            state: data.region_code || 'BR',
            country: data.country_code || 'br'
          });
          console.log(`[GEO] Localização detectada: ${data.city} - ${data.region_code}`);
        }
      } catch (e) {
        console.warn("[GEO] Falha ao obter localização por IP (Timeout ou Erro)", e);
        // Fallback genérico
        setUserLocation({ city: 'Brasil', state: 'BR', country: 'br' });
      }
    };

    fetchIPLocation();
  }, []);

  useEffect(() => {
    if (paymentStatus === 'pending' && pixData?.transactionId) {
      pollingRef.current = setInterval(async () => {
        const paid = await checkPaymentStatus(pixData.transactionId);
        if (paid) {
          handlePaymentSuccess();
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      }, 5000); // Check every 5 seconds
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [paymentStatus, pixData]);

  useEffect(() => {
    const runSequence = async () => {
      const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      await new Promise(r => setTimeout(r, 800));
      setMessages(prev => [...prev, { id: '1', type: 'image', content: MEDIA_URLS.IMG_1, sender: 'bot', timestamp: now() }]);

      await new Promise(r => setTimeout(r, 1200));
      setMessages(prev => [...prev, { id: '2', type: 'video', content: MEDIA_URLS.VIDEO_1, sender: 'bot', timestamp: now() }]);

      await new Promise(r => setTimeout(r, 1200));
      setMessages(prev => [...prev, { id: '3', type: 'image', content: MEDIA_URLS.IMG_2, sender: 'bot', timestamp: now() }]);

      await new Promise(r => setTimeout(r, 1000));
      setMessages(prev => [...prev, { id: '4', type: 'text', content: SALES_COPY, sender: 'bot', timestamp: now() }]);

      await new Promise(r => setTimeout(r, 600));
      setButtonsVisible(true);
    };

    runSequence();
  }, []);

  const handlePlanSelect = async (plan: Plan) => {
    setSelectedPlan(plan);
    setPaymentStatus('loading');
    
    try {
      // Passa a localização obtida via IP
      console.log("Iniciando pagamento com localização:", userLocation);
      const data = await createPixTransaction(plan.price, plan.name, userLocation);
      setPixData(data);
      setPaymentStatus('pending');
    } catch (error) {
      console.error("Payment generation failed", error);
      setPaymentStatus('idle');
      setSelectedPlan(null);
      alert('Erro ao gerar Pix. Tente novamente.');
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentStatus('approved');
    setPixData(null);
    setSelectedPlan(null);
    setIsAccessGranted(true);

    if (pollingRef.current) clearInterval(pollingRef.current);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, {
      id: 'success',
      type: 'text',
      content: `✅ PAGAMENTO CONFIRMADO!\n\nSeja bem-vindo(a) ao grupo VIP.\n\nClique no botão abaixo para entrar.`,
      sender: 'bot',
      timestamp: now
    }]);
  };

  return (
    <div className="w-full h-full flex flex-col relative max-w-md mx-auto shadow-xl border-x border-[#131a21] overflow-hidden bg-[#0e1621]">
      <ChatHeader />

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-2 pb-32 z-0 relative scrollbar-hide bg-[#0e1621]">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        
        {isAccessGranted && (
          <div className="flex justify-center my-4 animate-bounce">
            <a 
              href={SUCCESS_LINK} 
              target="_blank" 
              rel="noreferrer"
              className="bg-[#4a9c6d] hover:bg-[#3d8b5e] text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transform transition-transform hover:scale-105"
            >
              ENTRAR NO GRUPO AGORA <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {buttonsVisible && !isAccessGranted && (
        <div className="sticky bottom-0 bg-[#212d3b]/95 backdrop-blur-sm p-3 border-t border-[#131a21] z-10 animate-slide-up pb-6">
          <div className="flex flex-col gap-2">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handlePlanSelect(plan)}
                disabled={paymentStatus === 'loading'}
                className="relative group w-full bg-[#2b5278] hover:bg-[#34608b] active:bg-[#254563] text-white py-3 px-4 rounded-lg transition-all shadow-md flex items-center justify-between"
              >
                 <div className="flex items-center gap-2">
                   {plan.id === 'underworld' ? <Zap className="w-4 h-4 text-yellow-400" /> : <Lock className="w-4 h-4 text-gray-300" />}
                   <span className="font-medium text-[13px] sm:text-sm">{plan.label}</span>
                 </div>
                 {paymentStatus === 'loading' && selectedPlan?.id === plan.id && (
                   <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                 )}
              </button>
            ))}
            
            <div className="mt-2 flex justify-center items-center gap-2 text-[10px] text-gray-500">
               <ShieldCheck className="w-3 h-3" />
               <span>Pagamento seguro via Pix</span>
            </div>
          </div>
        </div>
      )}

      {paymentStatus === 'pending' && selectedPlan && (
        <PaymentModal 
          plan={selectedPlan}
          pixData={pixData}
          onClose={() => {
            setPaymentStatus('idle');
            setPixData(null);
            setSelectedPlan(null);
            if (pollingRef.current) clearInterval(pollingRef.current);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}