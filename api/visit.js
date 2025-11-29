import Redis from 'ioredis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const redisUrl = process.env.KV_REDIS_URL || process.env.KV_URL;
  if (!redisUrl) return res.status(200).json({ success: false });

  try {
    const redis = new Redis(redisUrl);
    await redis.incr('site_visitors');
    await redis.quit();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erro ao registrar visita:", error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}