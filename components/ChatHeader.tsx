import React from 'react';
import { ArrowLeft, MoreVertical, Search, Phone } from 'lucide-react';
import { MEDIA_URLS } from '../constants';

export const ChatHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between bg-[#242f3d] text-white p-2 shadow-md sticky top-0 z-20 h-14">
      <div className="flex items-center gap-4">
        <ArrowLeft className="w-6 h-6 text-gray-300 cursor-pointer" />
        <div className="flex items-center gap-3">
          <img 
            src={MEDIA_URLS.PROFILE_PIC} 
            alt="Bot Profile" 
            className="w-10 h-10 rounded-full object-cover bg-gray-700"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-base leading-tight">Conteúdo Exclusivo 🔞</span>
            <span className="text-xs text-[#6c9ecf]">bot</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-gray-300 pr-2">
        <Phone className="w-5 h-5" />
        <Search className="w-5 h-5" />
        <MoreVertical className="w-5 h-5" />
      </div>
    </div>
  );
};