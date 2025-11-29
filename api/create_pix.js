import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { amount, description, location } = req.body;
  
  const clientId = process.env.VITE_SYNC_PAY_CLIENT_ID;
  const clientSecret = process.env.VITE_SYNC_PAY_CLIENT_SECRET;
  const rawBaseUrl = process.env.VITE_SYNC_PAY_BASE_URL || 'https://api.syncpayments.com.br';
  const baseUrl = rawBaseUrl.replace(/\/$/, '');
  const webhookUrl = process.env.VITE_WEBHOOK_URL;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Credenciais (Client ID/Secret) não configuradas na Vercel.' });
  }

  try {
    // 1. AUTENTICAÇÃO
    let token = null;
    try {
        const authUrl = `${baseUrl}/api/partner/v1/auth-token`;
        const authResponse = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret })
        });
        if (!authResponse.ok) throw new Error('Auth Failed');
        const authData = await authResponse.json();
        token = authData.access_token;
    } catch (e) {
        console.error("Auth Error:", e);
        throw new Error("Falha na autenticação com gateway.");
    }

    // 2. CRIAÇÃO DO PIX
    // Tenta rotas comuns
    const pixRoutes = ['/api/partner/v1/cash-in', '/api/partner/v1/pix-cash-in'];
    let pixData = null;
    let pixError = null;

    const pixBody = {
      amount: Number(amount),
      description: description || 'Acesso VIP',
      webhook_url: webhookUrl,
      client: {
        name: "Cliente Anônimo",
        cpf: "00000000000", 
        email: "cliente@anonimo.com",
        phone: "11999999999"
      }
    };

    for (const route of pixRoutes) {
        try {
            const url = `${baseUrl}${route}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(pixBody)
            });

            if (response.ok) {
                pixData = await response.json();
                break; 
            } else {
                pixError = await response.text();
            }
        } catch (e) {
            console.warn(`Rota ${route} falhou.`);
        }
    }

    if (!pixData) {
        throw new Error(`Falha ao criar Pix: ${pixError || 'Erro desconhecido'}`);
    }

    const copyPaste = pixData.pix_code || pixData.qrcode_text || pixData.emv;
    const txId = pixData.identifier || pixData.transaction_id || pixData.id;

    if (!copyPaste || !txId) {
      throw new Error("API não retornou o código Pix.");
    }

    // 3. SALVAR NO BANCO DE DADOS (Redis)
    try {
        const txRecord = {
            id: txId,
            amount: amount,
            status: 'pending',
            date: new Date().toLocaleDateString('pt-BR'),
            timestamp: Date.now(),
            customerName: 'Cliente Anônimo',
            location: location ? `${location.city} - ${location.state}` : 'Desconhecido'
        };

        // Salva a transação individualmente
        await kv.hset(`tx:${txId}`, txRecord);
        // Opcional: Adicionar a uma lista de IDs para facilitar a busca (se não quiser usar KEYS)
        // await kv.lpush('transactions_list', txId);
        
        console.log(`[DB] Transação ${txId} salva como pendente.`);
    } catch (dbError) {
        console.error("Erro ao salvar no Redis:", dbError);
        // Não falha a requisição se o banco falhar, o usuário ainda quer o Pix
    }

    return res.status(200).json({
      transactionId: txId,
      qrCodeBase64: null, 
      copyPasteCode: copyPaste,
      location_saved: !!location 
    });

  } catch (error) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ error: error.message });
  }
}