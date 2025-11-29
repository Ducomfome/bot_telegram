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
  
  // LOG PARA O DASHBOARD (Vercel Logs atuam como "Banco de Dados" temporário)
  // O formato [STATS] ajuda a filtrar nos logs da Vercel
  if (location && location.city) {
    console.log(`[STATS] NOVA_VENDA | Valor: ${amount} | Local: ${location.city}-${location.state} | Status: PENDENTE`);
  } else {
    console.log(`[STATS] NOVA_VENDA | Valor: ${amount} | Local: Desconhecido | Status: PENDENTE`);
  }
  
  const clientId = process.env.VITE_SYNC_PAY_CLIENT_ID;
  const clientSecret = process.env.VITE_SYNC_PAY_CLIENT_SECRET;
  const rawBaseUrl = process.env.VITE_SYNC_PAY_BASE_URL || 'https://api.syncpayments.com.br';
  const baseUrl = rawBaseUrl.replace(/\/$/, '');
  const webhookUrl = process.env.VITE_WEBHOOK_URL;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Credenciais (Client ID/Secret) não configuradas na Vercel.' });
  }

  try {
    // ---------------------------------------------------------
    // 1. AUTENTICAÇÃO
    // ---------------------------------------------------------
    let token = null;
    let authError = null;
    
    // Tenta rota padrão da doc
    try {
      token = await tryAuth(baseUrl, '/api/partner/v1/auth-token', clientId, clientSecret);
    } catch (e) {
      console.log("Auth falhou, tentando fallback...", e.message);
      authError = e;
    }

    if (!token) {
       throw new Error(`Falha na autenticação. Verifique Client ID/Secret. Erro: ${authError?.message}`);
    }

    // ---------------------------------------------------------
    // 2. CRIAÇÃO DO PIX (Cash-In)
    // ---------------------------------------------------------
    const pixRoutes = [
        '/api/partner/v1/cash-in',
        '/api/partner/v1/pix-cash-in'
    ];

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
                const txt = await response.text();
                pixError = txt; 
            }
        } catch (e) {
            console.warn(`[PIX] Erro na rota ${route}:`, e);
        }
    }

    if (!pixData) {
        throw new Error(`Falha ao criar Pix. Gateway respondeu: ${pixError || 'Erro desconhecido'}`);
    }

    // ---------------------------------------------------------
    // 3. RETORNO
    // ---------------------------------------------------------
    const copyPaste = pixData.pix_code || pixData.qrcode_text || pixData.emv;
    const txId = pixData.identifier || pixData.transaction_id || pixData.id;

    if (!copyPaste || !txId) {
      throw new Error("API não retornou o código Pix.");
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

async function tryAuth(baseUrl, path, clientId, clientSecret) {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    return data.access_token;
}