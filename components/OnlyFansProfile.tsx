
import React, { useState, useEffect, useRef } from 'react';
import { PaymentModal } from './PaymentModal';
import { Plan, PixPaymentData, PaymentStatus, UserLocation } from '../types';
import { MEDIA_URLS, SALES_COPY, PLANS, SUCCESS_LINK } from '../constants';
import { createPixTransaction, checkPaymentStatus } from '../services/paymentService';
import { Verified, MapPin, Link as LinkIcon, Image as ImageIcon, Video, Lock, Heart, MessageCircle, Share2, MoreHorizontal, ArrowLeft, Star } from 'lucide-react';

export const OnlyFansProfile: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | undefined>(undefined);
  
  // Controle de Abas
  const [activeTab, setActiveTab] = useState<'posts' | 'media'>('posts');

  const pollingRef = useRef<any>(null);

  // --- LÓGICA DE BACKEND (Igual ao Chat) ---
  
  useEffect(() => {
    // Registro de visita e Heartbeat
    const registerVisit = async () => { try { await fetch('/api/visit'); } catch (e) {} };
    registerVisit();
    const heartbeat = async () => { try { await fetch('/api/heartbeat'); } catch (e) {} };
    heartbeat();
    const hbInterval = setInterval(heartbeat, 15000);
    return () => clearInterval(hbInterval);
  }, []);

  useEffect(() => {
    // Geolocalização
    const fetchIPLocation = async () => {
      try {
        const res = await fetch('https://ipwho.is/');
        const data = await res.json();
        if (data && data.success) {
          setUserLocation({
            city: data.city || 'Desconhecido',
            state: data.region_code || 'BR',
            country: data.country_code || 'br'
          });
        }
      } catch (e) {
        setUserLocation({ city: 'Brasil', state: 'BR', country: 'br' });
      }
    };
    fetchIPLocation();
  }, []);

  useEffect(() => {
    // Polling de Pagamento
    if (paymentStatus === 'pending' && pixData?.transactionId) {
      pollingRef.current = setInterval(async () => {
        const paid = await checkPaymentStatus(pixData.transactionId);
        if (paid) {
          handlePaymentSuccess();
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      }, 5000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [paymentStatus, pixData]);

  const handleSubscribe = async (planId: string) => {
    const plan = PLANS.find(p => p.id === planId) || PLANS[0];
    setSelectedPlan(plan);
    setPaymentStatus('loading');
    
    try {
      const data = await createPixTransaction(plan.price, `Assinatura OF - ${plan.name}`, userLocation);
      setPixData(data);
      setPaymentStatus('pending');
    } catch (error) {
      console.error("Erro pagamento", error);
      setPaymentStatus('idle');
      setSelectedPlan(null);
      alert('Erro ao gerar pagamento.');
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentStatus('approved');
    setPixData(null);
    setSelectedPlan(null);
    setIsAccessGranted(true);
    if (pollingRef.current) clearInterval(pollingRef.current);
    // Redirecionamento ou exibição de sucesso
  };

  if (isAccessGranted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <Verified className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Assinatura Confirmada!</h1>
        <p className="text-gray-600 mb-8">Bem-vindo ao meu conteúdo exclusivo.</p>
        <a 
          href={SUCCESS_LINK}
          className="bg-[#00aff0] text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-[#008ccf] transition-all transform hover:scale-105"
        >
          ACESSAR CONTEÚDO AGORA
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20 font-sans">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl overflow-hidden relative">
        
        {/* Header Fixo */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm px-4 py-3 flex items-center gap-4 border-b border-gray-100">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
          <div className="flex flex-col">
             <h1 className="font-bold text-lg leading-none flex items-center gap-1">
               Safadinha <Verified className="w-4 h-4 text-[#00aff0] fill-current" />
             </h1>
             <span className="text-xs text-gray-500">18.4K posts</span>
          </div>
          <MoreHorizontal className="w-6 h-6 text-gray-700 ml-auto" />
        </div>

        {/* Banner */}
        <div className="h-48 bg-gray-300 relative">
          <img src={MEDIA_URLS.IMG_1} className="w-full h-full object-cover opacity-90" alt="Banner" />
        </div>

        {/* Info Profile */}
        <div className="px-4 pb-4 relative">
          <div className="relative -mt-10 mb-3 flex justify-between items-end">
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-200">
              <img src={MEDIA_URLS.PROFILE_PIC} className="w-full h-full object-cover" alt="Profile" />
            </div>
            <div className="flex gap-2 mb-2">
                <button className="p-2 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50">
                    <MessageCircle className="w-5 h-5" />
                </button>
                <button className="p-2 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50">
                    <Star className="w-5 h-5" />
                </button>
            </div>
          </div>
          
          <div className="mb-4">
             <h2 className="text-xl font-bold flex items-center gap-1 text-gray-900">
               Safadinha 😈 <Verified className="w-5 h-5 text-[#00aff0]" />
             </h2>
             <span className="text-gray-500 text-sm">@safadinha_vip</span>
          </div>

          <div className="text-sm text-gray-700 space-y-2 mb-4">
            <p>✨ 20 aninhos | 1.60m | 48kg</p>
            <p>Vem ver o que eu faço quando estou sozinha no quarto... 🔞</p>
            <p className="font-medium text-[#00aff0]">👇 CONTEÚDO LIBERADO NO LINK ABAIXO</p>
          </div>

          <div className="flex gap-4 text-xs text-gray-500 mb-6">
             <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> São Paulo, Brasil</span>
             <span className="flex items-center gap-1"><LinkIcon className="w-3 h-3" /> privacy.com.br/safada</span>
          </div>

          {/* Cards de Assinatura */}
          <div className="space-y-3">
             <div className="border border-[#00aff0] bg-[#f2faff] p-4 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#00aff0] text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                    MAIS VENDIDO
                </div>
                <h3 className="font-bold text-gray-700 mb-1">ACESSO MENSAL</h3>
                <p className="text-xs text-gray-500 mb-3">Acesso completo a todas as fotos e vídeos + Grupo VIP.</p>
                <button 
                   onClick={() => handleSubscribe('monthly')}
                   className="w-full bg-[#00aff0] hover:bg-[#008ccf] text-white font-bold py-2.5 rounded-full flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                   ASSINAR POR R$ 11,99
                </button>
             </div>

             <div className="border border-gray-200 p-4 rounded-xl">
                <h3 className="font-bold text-gray-700 mb-1">ACESSO VITALÍCIO ♾️</h3>
                <p className="text-xs text-gray-500 mb-3">Pague uma vez e tenha acesso para sempre.</p>
                <button 
                   onClick={() => handleSubscribe('lifetime')}
                   className="w-full border border-[#00aff0] text-[#00aff0] font-bold py-2.5 rounded-full flex items-center justify-center gap-2 hover:bg-[#f2faff] transition-all"
                >
                   ASSINAR POR R$ 14,99
                </button>
             </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mt-2">
            <button 
                onClick={() => setActiveTab('posts')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex flex-col items-center ${activeTab === 'posts' ? 'border-[#00aff0] text-[#00aff0]' : 'border-transparent text-gray-500'}`}
            >
                <span className="text-xs uppercase">184 Posts</span>
            </button>
            <button 
                onClick={() => setActiveTab('media')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex flex-col items-center ${activeTab === 'media' ? 'border-[#00aff0] text-[#00aff0]' : 'border-transparent text-gray-500'}`}
            >
                <span className="text-xs uppercase">84 Mídias</span>
            </button>
        </div>

        {/* Feed de Posts Bloqueados */}
        <div className="bg-gray-100 min-h-[500px] py-2 space-y-2">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-4 pb-0">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                <img src={MEDIA_URLS.PROFILE_PIC} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-gray-900">Safadinha 😈</h4>
                                <span className="text-xs text-gray-400">Há {i} horas</span>
                            </div>
                        </div>
                        <MoreHorizontal className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                        Hoje eu acordei com uma vontade de fazer aquilo... quem quer ver o vídeo completo? 🙈🔥
                    </p>
                    
                    {/* Conteúdo Bloqueado */}
                    <div 
                        onClick={() => handleSubscribe('monthly')}
                        className="relative w-full aspect-[4/5] bg-gray-800 rounded-lg overflow-hidden cursor-pointer group"
                    >
                        <img 
                            src={i % 2 === 0 ? MEDIA_URLS.IMG_1 : MEDIA_URLS.IMG_2} 
                            className="w-full h-full object-cover opacity-30 blur-xl scale-110" 
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <div className="bg-[#00aff0] p-4 rounded-full mb-3 shadow-lg group-hover:scale-110 transition-transform">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="font-bold text-lg drop-shadow-md">Assine para ver</h3>
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-3 mt-2 text-gray-500 border-t border-gray-100">
                        <div className="flex gap-4">
                            <Heart className="w-6 h-6 hover:text-red-500 cursor-pointer" />
                            <MessageCircle className="w-6 h-6 hover:text-blue-500 cursor-pointer" />
                        </div>
                        <Share2 className="w-6 h-6 hover:text-gray-700 cursor-pointer" />
                    </div>
                </div>
            ))}
        </div>

        {/* Modal de Pagamento */}
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
    </div>
  );
};
