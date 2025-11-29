
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // Tenta escrever e ler do banco
    await kv.set('test_connection', 'ok');
    const value = await kv.get('test_connection');
    const envCheck = !!process.env.KV_REST_API_URL;

    return res.status(200).json({ 
        success: true, 
        read_value: value,
        env_configured: envCheck,
        message: "Banco de dados conectado com sucesso! Gere um novo Pix para vê-lo no painel." 
    });
  } catch (error) {
    return res.status(500).json({ 
        success: false, 
        error: error.message,
        hint: "Verifique se você clicou em 'Connect Project' no Storage da Vercel e fez o Redeploy."
    });
  }
}
