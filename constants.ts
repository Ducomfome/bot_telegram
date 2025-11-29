
import { Plan } from './types';

// Client-side constants (Secrets are now handled in /api/ folder securely)
export const MEDIA_URLS = {
  // Perfil e Banner
  PROFILE_PIC: 'https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/avatar.jpg',
  BANNER: 'https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/banner.jpg',
  
  // Mídia Pública (Sem censura - Prévia)
  PREVIEW_POST: 'https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/fotoquenvaificarcensurada.jpg',
  
  // Mídias Bloqueadas (Censuradas)
  LOCKED_IMG_1: 'https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/fotocensurada.jpg',
  LOCKED_IMG_2: 'https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/fotocensurada01.jpg',
  LOCKED_VIDEO: 'https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/fotocensurada02.mp4',

  // Legado (Mantido para compatibilidade se necessário)
  IMG_1: 'https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/fotoquenvaificarcensurada.jpg',
  VIDEO_1: 'https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/fotocensurada02.mp4',
  IMG_2: 'https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/fotocensurada.jpg',
};

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

export const PLANS: Plan[] = [
  { id: 'monthly', name: 'Acesso Mensal 🔞', price: 11.99, label: 'Acesso Mensal 🔞 - por R$ 11,99' },
  { id: 'lifetime', name: 'Acesso Vitalício 🔞', price: 14.99, label: 'Acesso Vitalício 🔞 - por R$ 14,99' },
  { id: 'whatsapp_vip', name: 'Vitalício + Meu WhatsApp 💚', price: 29.90, label: 'Vitalício + WhatsApp 🟢' },
  { id: 'famous', name: 'Famosinhas 🔞', price: 19.99, label: '🔞Famosinhas 🔞 - por R$ 19,99' },
  { id: 'underworld', name: 'SubMundo 😈 + 15 grupos', price: 23.10, label: 'SubMundo 😈 + 15 grupos 🎁 - por R$ 23,10' },
];

export const SUCCESS_LINK = "https://t.me/+ExampleSecretLink";
