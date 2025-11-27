import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isBot = message.sender === 'bot';
  
  return (
    <div className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'} mb-2`}>
      <div 
        className={`max-w-[85%] sm:max-w-[70%] rounded-lg overflow-hidden shadow-sm relative ${
          isBot ? 'bg-[#182533] rounded-tl-none' : 'bg-[#2b5278] rounded-tr-none'
        }`}
      >
        {/* Content */}
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
            <video 
              src={message.content} 
              className="w-full h-auto max-h-[400px]" 
              autoPlay 
              muted 
              loop 
              playsInline 
              controls={false}
            />
          )}

          {message.type === 'text' && (
            <div className="p-3 whitespace-pre-wrap">
              {message.content}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-[11px] px-2 pb-1 text-right w-full ${isBot ? 'text-[#6e7f8d]' : 'text-[#7aa6cc]'}`}>
           {message.timestamp}
        </div>
      </div>
    </div>
  );
};