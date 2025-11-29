import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // Diagnóstico de Variáveis (Lista quais existem sem mostrar o valor completo por segurança)
    const envVars = Object.keys(process.env).filter(key => key.startsWith('KV_') || key.includes('REDIS'));
    const envStatus = {};
    
    envVars.forEach(key => {
        const val = process.env[key];
        envStatus[key] = val ? `${val.substring(0, 5)}...` : 'empty';
    });

    const hasRestUrl = !!process.env.KV_REST_API_URL;
    const hasRestToken = !!process.env.KV_REST_API_TOKEN;

    // Tenta conexão real
    let dbStatus = "unknown";
    let readValue = null;
    let writeError = null;

    try {
        const testKey = 'test_connection_' + Date.now();
        await kv.set(testKey, 'ok');
        readValue = await kv.get(testKey);
        await kv.del(testKey);
        dbStatus = "connected";
    } catch (e) {
        dbStatus = "error";
        writeError = e.message;
    }

    return res.status(200).json({ 
        success: dbStatus === "connected", 
        database_status: dbStatus,
        detected_env_vars: envStatus,
        config_check: {
            has_rest_url: hasRestUrl,
            has_rest_token: hasRestToken,
            message: hasRestUrl ? "Configuração correta para @vercel/kv encontrada." : "AVISO: KV_REST_API_URL não encontrada. O @vercel/kv precisa desta variável."
        },
        write_error: writeError
    });
  } catch (error) {
    return res.status(500).json({ 
        success: false, 
        error: error.message 
    });
  }
}