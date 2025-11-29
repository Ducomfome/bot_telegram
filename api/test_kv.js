import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    const envUrl = process.env.KV_REST_API_URL;
    const envToken = process.env.KV_REST_API_TOKEN;

    if (!envUrl || !envToken) {
        return res.status(500).json({
            success: false,
            message: "Variáveis de ambiente NÃO encontradas.",
            details: {
                hasUrl: !!envUrl,
                hasToken: !!envToken,
                hint: "Vá na Vercel > Settings > Environment Variables e verifique se KV_REST_API_URL existe. Se não, refaça a conexão no Storage."
            }
        });
    }

    // Tenta escrever e ler
    const testKey = 'test_connection_' + Date.now();
    await kv.set(testKey, 'ok');
    const value = await kv.get(testKey);
    
    // Limpa
    await kv.del(testKey);

    return res.status(200).json({ 
        success: true, 
        read_value: value,
        env_configured: true,
        message: "Banco de dados CONECTADO e funcionando! Gere um novo Pix para vê-lo no painel." 
    });
  } catch (error) {
    return res.status(500).json({ 
        success: false, 
        error: error.message,
        stack: error.stack,
        hint: "Erro de conexão com o Redis. Verifique se o Token é válido."
    });
  }
}