
import React, { useState, useEffect, useRef } from 'react';
import { PaymentModal } from './PaymentModal';
import { Plan, PixPaymentData, PaymentStatus, UserLocation } from '../types';
import { MEDIA_URLS, PLANS, SUCCESS_LINK } from '../constants';
import { createPixTransaction, checkPaymentStatus } from '../services/paymentService';
import { Verified, MapPin, Link as LinkIcon, Lock, Heart, MessageCircle, Share2, MoreHorizontal, ArrowLeft, Star, Search, Menu, Play } from 'lucide-react';

export const OnlyFansProfile: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | undefined>(undefined);
  
  // Controle de Abas
  const [activeTab, setActiveTab] = useState<'posts' | 'media'>('posts');

  const pollingRef = useRef<any>(null);
  
  // Referência para a seção de planos (Scroll)
  const plansRef = useRef<HTMLDivElement>(null);

  // Cor Principal da Privacy (Laranja avermelhado)
  const BRAND_COLOR = "bg-[#fe2c55]";
  const TEXT_BRAND = "text-[#fe2c55]";
  const BORDER_BRAND = "border-[#fe2c55]";

  // --- CONFIGURAÇÃO DOS POSTS ---
  const posts = [
    {
      id: 1,
      type: 'image',
      url: MEDIA_URLS.PREVIEW_POST, // FOTO SEM CENSURA (PREVIA)
      isLocked: false, // PÚBLICO
      description: 'Uma préviazinha do que eu aprontei hoje... Gostaram? 🙈🔥',
      time: '2 horas',
      likes: '4.2K',
      comments: '342'
    },
    {
      id: 2,
      type: 'video',
      url: MEDIA_URLS.LOCKED_VIDEO, // VÍDEO CENOURADO
      isLocked: true, // BLOQUEADO
      description: 'Vídeo completo na minha cama... esse deu trabalho 🥵🔞',
      time: 'Ontem',
      likes: '8.5K',
      comments: '890'
    },
    {
      id: 3,
      type: 'image',
      url: MEDIA_URLS.LOCKED_IMG_1, // FOTO CENSURADA 1
      isLocked: true, // BLOQUEADO
      description: 'O que você faria se estivesse aqui comigo agora? 👇',
      time: '2 dias',
      likes: '6.1K',
      comments: '512'
    },
    {
      id: 4,
      type: 'image',
      url: MEDIA_URLS.LOCKED_IMG_2, // FOTO CENSURADA 2
      isLocked: true, // BLOQUEADO
      description: 'Sem calcinha pela casa... ops 🤭',
      time: '3 dias',
      likes: '5.9K',
      comments: '420'
    }
  ];

  // --- LÓGICA DE BACKEND (Mantida Intacta) ---
  
  useEffect(() => {
    const registerVisit = async () => { try { await fetch('/api/visit'); } catch (e) {} };
    registerVisit();
    const heartbeat = async () => { try { await fetch('/api/heartbeat'); } catch (e) {} };
    heartbeat();
    const hbInterval = setInterval(heartbeat, 15000);
    return () => clearInterval(hbInterval);
  }, []);

  useEffect(() => {
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
      const data = await createPixTransaction(plan.price, `Privacy - ${plan.name}`, userLocation);
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
  };

  const scrollToPlans = () => {
    if (plansRef.current) {
      plansRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (isAccessGranted) {
    return (
      <div className="h-full overflow-y-auto bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className={`w-20 h-20 ${BRAND_COLOR} rounded-full flex items-center justify-center mb-6 animate-bounce`}>
            <Verified className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Assinatura Confirmada!</h1>
        <p className="text-gray-600 mb-8">Bem-vindo ao meu Privacy exclusivo.</p>
        <a 
          href={SUCCESS_LINK}
          className={`${BRAND_COLOR} text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:brightness-110 transition-all transform hover:scale-105`}
        >
          ACESSAR CONTEÚDO AGORA
        </a>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f5f5f5] font-sans text-gray-900 scroll-smooth">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl overflow-hidden relative pb-20">
        
        {/* Navbar estilo Privacy */}
        <div className="sticky top-0 z-30 bg-white px-4 h-14 flex items-center justify-between border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
             <Menu className="w-6 h-6 text-gray-700" />
             <span className="font-bold text-2xl tracking-tighter text-[#fe2c55]">PRIVACY</span>
          </div>
          <div className="flex items-center gap-4">
             <Search className="w-5 h-5 text-gray-600" />
             <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User" />
             </div>
          </div>
        </div>

        {/* Banner Atualizado */}
        <div className="h-40 sm:h-48 bg-gray-800 relative group cursor-pointer">
          <img src={MEDIA_URLS.BANNER} className="w-full h-full object-cover opacity-90" alt="Banner" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        {/* Info Profile */}
        <div className="px-5 relative">
          {/* Foto de Perfil sobreposta Atualizada */}
          <div className="flex justify-between items-end -mt-10 mb-3">
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-200 shadow-md z-10">
              <img src={MEDIA_URLS.PROFILE_PIC} className="w-full h-full object-cover" alt="Profile" />
            </div>
            <div className="flex gap-2 mb-1">
                <button className="p-2 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                    <MessageCircle className="w-5 h-5" />
                </button>
                <button className="p-2 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                    <Share2 className="w-5 h-5" />
                </button>
                <button className="p-2 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>
          </div>
          
          <div className="mb-2">
             <h2 className="text-xl font-bold flex items-center gap-1 text-gray-900 leading-tight">
               Safadinha 😈 <Verified className={`w-5 h-5 ${TEXT_BRAND} fill-current`} />
             </h2>
             <span className="text-gray-500 text-sm">@safadinha_vip</span>
          </div>

          <div className="text-sm text-gray-600 leading-relaxed mb-4">
            <p>✨ 20 aninhos | 1.60m | 48kg</p>
            <p>Vem ver o que eu faço quando estou sozinha no quarto... 🔞</p>
            <p className={`font-bold ${TEXT_BRAND} mt-1`}>👇 VÍDEOS COMPLETOS ABAIXO</p>
          </div>

          {/* Cards de Assinatura Estilo Privacy */}
          <div ref={plansRef} className="space-y-3 mb-6 scroll-mt-20">
             {/* Plano Mensal */}
             <div className="border border-[#fe2c55]/30 bg-[#fff5f6] p-4 rounded-xl relative overflow-hidden shadow-sm">
                <div className={`absolute top-0 right-0 ${BRAND_COLOR} text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg`}>
                    MAIS POPULAR
                </div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">MENSAL</h3>
                <div className="flex items-baseline gap-1 mb-3">
                   <span className={`text-2xl font-black ${TEXT_BRAND}`}>R$ 11,99</span>
                   <span className="text-xs text-gray-500">/ mês</span>
                </div>
                <button 
                   onClick={() => handleSubscribe('monthly')}
                   className={`w-full ${BRAND_COLOR} hover:brightness-110 text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-95`}
                >
                   ASSINAR AGORA
                </button>
             </div>

             {/* Plano Vitalício */}
             <div className="border border-gray-200 p-4 rounded-xl shadow-sm hover:border-gray-300 transition-colors">
                <h3 className="font-bold text-gray-800 text-sm mb-1">VITALÍCIO (SEM MENSALIDADE)</h3>
                 <div className="flex items-baseline gap-1 mb-3">
                   <span className="text-2xl font-black text-gray-800">R$ 14,99</span>
                   <span className="text-xs text-gray-500">/ único</span>
                </div>
                <button 
                   onClick={() => handleSubscribe('lifetime')}
                   className={`w-full border-2 ${BORDER_BRAND} ${TEXT_BRAND} font-bold py-2.5 rounded-full flex items-center justify-center gap-2 hover:bg-[#fff5f6] transition-all`}
                >
                   COMPRAR ACESSO TOTAL
                </button>
             </div>

             {/* NOVO PLANO: WHATSAPP */}
             <div className="border border-green-500/50 bg-green-50 p-4 rounded-xl shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#25D366] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg animate-pulse">
                    SUPER EXCLUSIVO
                </div>
                <div className="flex items-center gap-2 mb-1">
                   <h3 className="font-bold text-gray-800 text-sm">VITALÍCIO + MEU ZAP</h3>
                   <WhatsAppIcon className="w-5 h-5" />
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                   <span className="text-2xl font-black text-green-700">R$ 29,90</span>
                   <span className="text-xs text-gray-600">/ único</span>
                </div>
                <p className="text-xs text-green-800 mb-3 leading-tight">
                    🔥 Acesso vitalício + <b>meu número pessoal</b> para a gente conversar de madrugada.
                </p>
                <button 
                   onClick={() => handleSubscribe('whatsapp_vip')}
                   className="w-full bg-[#25D366] hover:bg-[#1da851] text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                   <WhatsAppIcon className="w-5 h-5 fill-white" />
                   QUERO O ZAP DELA
                </button>
             </div>

          </div>
        </div>

        {/* Tabs Estilo Privacy */}
        <div className="flex border-b border-gray-200 sticky top-14 bg-white z-20">
            <button 
                onClick={() => setActiveTab('posts')}
                className={`flex-1 py-3 text-sm font-bold border-b-[3px] transition-colors ${activeTab === 'posts' ? `${BORDER_BRAND} ${TEXT_BRAND}` : 'border-transparent text-gray-400'}`}
            >
                POSTS ({posts.length})
            </button>
            <button 
                onClick={() => setActiveTab('media')}
                className={`flex-1 py-3 text-sm font-bold border-b-[3px] transition-colors ${activeTab === 'media' ? `${BORDER_BRAND} ${TEXT_BRAND}` : 'border-transparent text-gray-400'}`}
            >
                MÍDIAS (84)
            </button>
        </div>

        {/* Feed de Posts */}
        <div className="bg-[#f0f2f5] min-h-[500px] py-3 space-y-3">
            {posts.map((post) => (
                <div key={post.id} className="bg-white p-4 shadow-sm border-y border-gray-100 sm:border sm:rounded-lg sm:mx-2">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                                <img src={MEDIA_URLS.PROFILE_PIC} className="w-full h-full object-cover" alt="Profile" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1">
                                    Safadinha 😈 <Verified className={`w-3 h-3 ${TEXT_BRAND}`} />
                                </h4>
                                <span className="text-xs text-gray-400">Há {post.time} • {post.isLocked ? 'Assinantes' : 'Público'}</span>
                            </div>
                        </div>
                        <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer" />
                    </div>
                    <p className="text-sm text-gray-800 mb-3 font-normal">
                        {post.description}
                    </p>
                    
                    {/* Conteúdo do Post (Bloqueado ou Público) */}
                    <div 
                        onClick={post.isLocked ? scrollToPlans : undefined}
                        className={`relative w-full aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden ${post.isLocked ? 'cursor-pointer group' : ''}`}
                    >
                        {/* Se for vídeo e bloqueado, renderiza tag video borrada */}
                        {post.type === 'video' ? (
                            <video 
                                src={post.url} 
                                className={`w-full h-full object-cover ${post.isLocked ? 'opacity-20 blur-2xl scale-105 transition-transform duration-700' : ''}`}
                                autoPlay={false} // Não dar autoplay se for preview bloqueado
                                muted
                                loop
                                playsInline
                            />
                        ) : (
                            <img 
                                src={post.url} 
                                className={`w-full h-full object-cover ${post.isLocked ? 'opacity-20 blur-2xl scale-105 transition-transform duration-700' : ''}`} 
                                alt="Post"
                            />
                        )}

                        {/* Overlay de Cadeado se estiver bloqueado */}
                        {post.isLocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
                                <div className={`w-14 h-14 ${BRAND_COLOR} rounded-full flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <Lock className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="font-bold text-lg uppercase tracking-wide">Conteúdo Exclusivo</h3>
                                <p className="text-xs text-gray-300 mt-1 max-w-[200px]">
                                    Assine este perfil para desbloquear essa mídia e todo o arquivo.
                                </p>
                            </div>
                        )}
                        
                        {/* Indicador de Vídeo se for público */}
                        {!post.isLocked && post.type === 'video' && (
                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-black/40 p-3 rounded-full backdrop-blur-sm">
                                <Play className="w-8 h-8 text-white fill-white" />
                              </div>
                           </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-2 text-gray-500">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1 cursor-pointer hover:text-[#fe2c55]">
                                <Heart className={`w-6 h-6 ${!post.isLocked ? 'text-red-500 fill-current' : ''}`} />
                                <span className="text-xs font-bold">{post.likes}</span>
                            </div>
                            <div className="flex items-center gap-1 cursor-pointer hover:text-gray-800">
                                <MessageCircle className="w-6 h-6" />
                                <span className="text-xs font-bold">{post.comments}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 cursor-pointer hover:text-[#fe2c55]">
                            <DollarSignIcon className="w-6 h-6" />
                            <span className="text-xs font-bold">TIPS</span>
                        </div>
                    </div>
                </div>
            ))}
            
            <div className="text-center py-8 text-gray-400 text-sm">
                <Lock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>Você chegou ao fim dos posts públicos.</p>
            </div>
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

const DollarSignIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="1" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.001 2C6.48 2 2 6.48 2 12c0 1.83.49 3.56 1.34 5.07L2.09 22l5.05-1.29C8.52 21.57 10.21 22 12.001 22c5.52 0 10-4.48 10-10S17.521 2 12.001 2zm5.72 14.65c-.24.67-1.39 1.25-1.91 1.32-.47.07-1.04.18-3.08-.66-1.74-.71-2.98-2.48-3.07-2.6-.09-.12-1.32-1.76-1.32-3.36 0-1.6.83-2.39 1.13-2.71.24-.26.65-.33.91-.33.26 0 .52.01.76.01.24 0 .56-.09.87.66.33.79 1.12 2.7.19 3.39-.93.69.47 1.84.47 1.84s.88 1.45 2.45 2.12c1.57.67 2.05.54 2.37.21.31-.33.69-1.3.88-1.74.19-.44.76-.36 1.27-.19.52.19 3.29 1.55 3.29 1.55s.54.26.79.52c.24.26.24 1.55.01 2.22z"/>
    </svg>
);
