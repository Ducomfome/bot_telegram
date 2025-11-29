
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Pega o IP do usuário (header padrão da Vercel ou fallback)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
    // Salva uma chave temporária que expira em 60 segundos
    // Se o usuário não chamar esse endpoint novamente em 60s, ele é considerado offline
    await kv.setex(`online:${ip}`, 60, '1');

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error("Heartbeat Error:", error);
    return res.status(200).json({ status: 'error' }); // Não quebra o front
  }
}
