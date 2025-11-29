import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Incrementa o contador de visitantes
    await kv.incr('site_visitors');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erro ao registrar visita:", error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}