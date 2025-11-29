
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
  
  // Log da localização para "Banco de Dados" futuro
  if (location) {
    console.log(`[GEO] Novo pedido de: ${location.city} - ${location.state} (${location.country})`);
  } else {
    console.log(`[GEO] Pedido sem localização definida.`);
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
    // Fallback URL logic para autenticação
    let token = null;
    let authError = null;
    
    // Tenta rota padrão
    try {
      token = await tryAuth(baseUrl, '/api/partner/v1/auth-token', clientId, clientSecret);
    } catch (e) {
      console.log("Auth na rota padrão falhou, tentando fallback...", e.message);
      authError = e;
    }

    if (!token) {
       throw new Error(`Falha na autenticação em todas as rotas. Último erro: ${authError?.message}`);
    }

    // ---------------------------------------------------------
    // 2. CRIAÇÃO DO PIX (Cash-In)
    // ---------------------------------------------------------
    // Tentativa e erro nas rotas de criação do Pix
    const pixRoutes = [
        '/api/partner/v1/cash-in',
        '/api/partner/v1/pix-cash-in',
        '/api/partner/v1/pix/cash-in'
    ];

    let pixData = null;
    let pixError = null;

    const pixBody = {
      amount: Number(amount),
      description: description || 'Acesso VIP',
      webhook_url: webhookUrl,
      client: {
        name: "Cliente VIP",
        cpf: "00000000000", 
        email: "cliente@email.com",
        phone: "11999999999"
      }
    };

    for (const route of pixRoutes) {
        try {
            const url = `${baseUrl}${route}`;
            console.log(`[PIX] Tentando criar em: ${url}`);
            
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
                console.log(`[PIX] Sucesso na rota: ${route}`);
                break; // Sucesso!
            } else {
                const txt = await response.text();
                console.warn(`[PIX] Falha na rota ${route}: ${response.status} - ${txt}`);
                pixError = txt; // Guarda o erro para debug
            }
        } catch (e) {
            console.warn(`[PIX] Erro de rede na rota ${route}:`, e);
        }
    }

    if (!pixData) {
        throw new Error(`Falha ao criar Pix. Último erro: ${pixError || 'Nenhuma rota respondeu corretamente'}`);
    }

    // ---------------------------------------------------------
    // 3. NORMALIZAÇÃO DA RESPOSTA
    // ---------------------------------------------------------
    const copyPaste = pixData.pix_code || pixData.qrcode_text || pixData.emv;
    const txId = pixData.identifier || pixData.transaction_id || pixData.id;

    if (!copyPaste || !txId) {
      console.error("Payload recebido:", pixData);
      throw new Error("API respondeu, mas faltam campos obrigatórios (pix_code ou identifier).");
    }

    return res.status(200).json({
      transactionId: txId,
      qrCodeBase64: null, 
      copyPasteCode: copyPaste,
      location_saved: !!location // Confirmação debug
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