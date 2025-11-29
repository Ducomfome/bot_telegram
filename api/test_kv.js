import Redis from 'ioredis';

export default async function handler(req, res) {
  try {
    const envVars = Object.keys(process.env).filter(key => key.startsWith('KV_') || key.includes('REDIS'));
    const envStatus = {};
    
    envVars.forEach(key => {
        const val = process.env[key];
        envStatus[key] = val ? `${val.substring(0, 10)}...` : 'empty';
    });

    const redisUrl = process.env.KV_REDIS_URL || process.env.KV_URL;
    let dbStatus = "unknown";
    let writeError = null;

    if (redisUrl) {
        try {
            const redis = new Redis(redisUrl);
            const testKey = 'test_conn_ioredis_' + Date.now();
            await redis.set(testKey, 'ok');
            const val = await redis.get(testKey);
            await redis.del(testKey);
            await redis.quit();
            
            if (val === 'ok') {
                dbStatus = "connected";
            } else {
                dbStatus = "read_failed";
            }
        } catch (e) {
            dbStatus = "connection_error";
            writeError = e.message;
        }
    } else {
        dbStatus = "no_url_found";
    }

    return res.status(200).json({ 
        success: dbStatus === "connected", 
        database_status: dbStatus,
        detected_env_vars: envStatus,
        driver: "ioredis",
        write_error: writeError
    });
  } catch (error) {
    return res.status(500).json({ 
        success: false, 
        error: error.message 
    });
  }
}