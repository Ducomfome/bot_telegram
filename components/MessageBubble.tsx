
import React, { useState, useRef } from 'react';
import { Message } from '../types';
import { Play, Volume2 } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isBot = message.sender === 'bot';
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      setIsPlaying(true);
      videoRef.current.muted = false; // Garante que o som esteja ativado
      videoRef.current.play();
    }
  };
  
  return (
    <div className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'} mb-2`}>
      <div 
        className={`max-w-[85%] sm:max-w-[70%] rounded-lg overflow-hidden shadow-sm relative ${
          isBot ? 'bg-[#182533] rounded-tl-none' : 'bg-[#2b5278] rounded-tr-none'
        }`}
      >
        <div className="text-white text-[15px] leading-snug">
          {message.type === 'image' && (
            <img 
              src={message.content} 
              alt="Media" 
              className="w-full h-auto object-cover max-h-[400px]" 
              loading="lazy"
            />
          )}
          
          {message.type === 'video' && (
            <div className="relative group cursor-pointer" onClick={!isPlaying ? handlePlayVideo : undefined}>
              {!isPlaying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10 transition-all hover:bg-black/30">
                   <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 animate-pulse">
                      <div className="w-12 h-12 bg-[#4a9c6d] rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                         <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                      </div>
                   </div>
                   <span className="text-white font-bold text-sm drop-shadow-md flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full">
                      <Volume2 className="w-4 h-4" /> TOQUE PARA OUVIR
                   </span>
                </div>
              )}
              <video 
                ref={videoRef}
                src={message.content} 
                className="w-full h-auto max-h-[400px]" 
                playsInline 
                controls={isPlaying} // Mostra controles apenas após dar play
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          )}

          {message.type === 'text' && (
            <div className="p-3 whitespace-pre-wrap">
              {message.content}
            </div>
          )}
        </div>

        <div className={`text-[11px] px-2 pb-1 text-right w-full ${isBot ? 'text-[#6e7f8d]' : 'text-[#7aa6cc]'}`}>
           {message.timestamp}
        </div>
      </div>
    </div>
  );
};
