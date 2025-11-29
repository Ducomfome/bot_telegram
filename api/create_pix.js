import { kv } from '@vercel/kv';

export default async function handler(req, res) {
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
    return res.status(500).json({ error: 'Credenciais não configuradas.' });
  }

  try {
    // 1. AUTENTICAÇÃO
    const authRes = await fetch(`${baseUrl}/api/partner/v1/auth-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret })
    });
    
    if (!authRes.ok) throw new Error('Falha Auth Gateway');
    const { access_token } = await authRes.json();

    // 2. CRIAÇÃO PIX
    const routes = ['/api/partner/v1/cash-in', '/api/partner/v1/pix-cash-in'];
    let pixData = null;

    const body = {
        amount: Number(amount),
        description: description || 'VIP',
        webhook_url: webhookUrl,
        client: {
            name: "Anonimo",
            cpf: "00000000000",
            email: "a@a.com",
            phone: "11999999999"
        }
    };

    for (const r of routes) {
        try {
            const resp = await fetch(`${baseUrl}${r}`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body)
            });
            if (resp.ok) {
                pixData = await resp.json();
                break;
            }
        } catch (e) {}
    }

    if (!pixData) throw new Error('Falha ao criar Pix na SyncPay');

    const copyPaste = pixData.pix_code || pixData.qrcode_text || pixData.emv;
    const txId = pixData.identifier || pixData.transaction_id || pixData.id;

    if (!copyPaste || !txId) throw new Error('Dados do Pix incompletos');

    // 3. SALVAR NO BANCO (REDIS)
    try {
        const timestamp = Date.now();
        const dateStr = new Date().toLocaleDateString('pt-BR');
        const locationStr = location ? `${location.city} - ${location.state}` : 'Desconhecido';
        
        // HSET simples
        await kv.hset(`tx:${txId}`, {
            id: txId,
            amount: amount,
            status: 'pending',
            date: dateStr,
            timestamp: timestamp, 
            customerName: 'Cliente Anônimo',
            location: locationStr
        });
        
        // Adiciona à lista
        await kv.lpush('transactions_list', `tx:${txId}`);
        console.log(`[DB] Transação ${txId} salva com sucesso.`);

    } catch (dbErr) {
        console.error("ERRO CRÍTICO REDIS:", dbErr);
        // O cliente ainda recebe o Pix mesmo se o log falhar
    }

    return res.status(200).json({
      transactionId: txId,
      copyPasteCode: copyPaste,
      qrCodeBase64: null
    });

  } catch (error) {
    console.error('Create Pix Error:', error);
    return res.status(500).json({ error: error.message });
  }
}