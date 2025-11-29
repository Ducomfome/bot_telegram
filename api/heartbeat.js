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
  if (!redisUrl) return res.status(200).json({ status: 'no_db' });

  try {
    const redis = new Redis(redisUrl);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    await redis.setex(`online:${ip}`, 60, '1');
    await redis.quit();

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error("Heartbeat Error:", error);
    return res.status(200).json({ status: 'error' });
  }
}