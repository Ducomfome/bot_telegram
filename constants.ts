import { Plan } from './types';

// Environment Variables (Vite/Create React App compatible)
// Note: In a real production app, secrets should be proxied via a backend.
export const SYNC_PAY_CONFIG = {
  BASE_URL: (import.meta as any).env?.VITE_SYNC_PAY_BASE_URL || 'https://api.syncpayments.com.br',
  CLIENT_ID: (import.meta as any).env?.VITE_SYNC_PAY_CLIENT_ID || '', 
  CLIENT_SECRET: (import.meta as any).env?.VITE_SYNC_PAY_CLIENT_SECRET || '',
  WEBHOOK_URL: (import.meta as any).env?.VITE_WEBHOOK_URL || 'https://bot-telegram-gamma-lovat.vercel.app'
};

// Media URLs provided
export const MEDIA_URLS = {
  IMG_1: 'https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/img01_bot.jpg',
  VIDEO_1: 'https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/video01_bot.mp4',
  IMG_2: 'https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/img02_bot.jpg',
  PROFILE_PIC: 'https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/download%20(2).jpg'
};

// Sales Copy
export const SALES_COPY = `🔞 𝐒𝐔𝐀 𝐆𝐎𝐙𝐀𝐃𝐀 𝐆𝐀𝐑𝐀𝐍𝐓𝐈𝐃𝐀 𝐎𝐔 𝐒𝐄𝐔 𝐃𝐈𝐍𝐇𝐄𝐈𝐑𝐎 𝐃𝐄 𝐕𝐎𝐋𝐓𝐀 ❤️‍🔥

🔥 𝙎𝙚𝙥𝙖𝙧𝙖𝙙𝙤𝙨 𝙥𝙤𝙧 𝙘𝙖𝙩𝙚𝙜𝙤𝙧𝙞𝙖:
📂 Ninf3t4s 18+ | Amadoras
🗂 𝙊𝙧𝙜𝙖𝙣𝙞𝙯𝙖𝙘̧𝙖̃𝙤 𝙙𝙚 𝙖-𝙯!
💣 OnlyFans & Privacys
👩🏻‍🏫 MILFsCâmeras |INc3sto⁺¹⁸ Secre3t0 real
🎁 𝐂𝐨𝐦𝐩𝐫𝐞 𝐮𝐦 𝐩𝐥𝐚𝐧𝐨 𝐡𝐨𝐣𝐞 𝐞 𝐠𝐚𝐧𝐡𝐞 5 𝐠𝐫𝐮𝐩𝐨𝐬 𝐒𝐄𝐂𝐑𝟑𝐓𝟎𝐒 🔐🔥

Mídias totalmente +18! 

🚀 𝐀𝐜𝐞𝐬𝐬𝐨 𝐢𝐦𝐞𝐝𝐢𝐚𝐭𝐨
♾️ 𝑽𝒊𝒕𝒂𝒍𝒊́𝒄𝒊𝒐 𝒅𝒆 𝒗𝒆𝒓𝒅𝒂𝒅𝒆`;

// Plans configuration
export const PLANS: Plan[] = [
  { id: 'monthly', name: 'Acesso Mensal 🔞', price: 11.99, label: 'Acesso Mensal 🔞 - por R$ 11,99' },
  { id: 'lifetime', name: 'Acesso Vitalício 🔞', price: 14.99, label: 'Acesso Vitalício 🔞 - por R$ 14,99' },
  { id: 'famous', name: 'Famosinhas 🔞', price: 19.99, label: '🔞Famosinhas 🔞 - por R$ 19,99' },
  { id: 'underworld', name: 'SubMundo 😈 + 15 grupos', price: 23.10, label: 'SubMundo 😈 + 15 grupos 🎁 - por R$ 23,10' },
];

export const SUCCESS_LINK = "https://t.me/+ExampleSecretLink"; // Placeholder for the final link