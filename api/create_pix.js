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

  const { amount, description } = req.body;
  
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
    // 1. AUTENTICAÇÃO (Conforme Print: JSON Body em /api/partner/v1/auth-token)
    // ---------------------------------------------------------
    const authUrl = `${baseUrl}/api/partner/v1/auth-token`;
    
    console.log(`[AUTH] Solicitando token em: ${authUrl}`);
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // IMPORTANTE: Envia credenciais no corpo JSON conforme documentação
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!authResponse.ok) {
      const errText = await authResponse.text();
      throw new Error(`Erro Auth (${authResponse.status}): ${errText}`);
    }

    const authData = await authResponse.json();
    const token = authData.access_token;
    
    if (!token) {
      throw new Error("Token não retornado pela API.");
    }

    console.log("[AUTH] Token obtido com sucesso.");

    // ---------------------------------------------------------
    // 2. CRIAÇÃO DO PIX (CashIn)
    // ---------------------------------------------------------
    // Tentativa baseada no menu "Pix - CashIn" -> "Solicitação de depósito"
    // Rotas prováveis para APIs "Partner" v1
    const pixEndpoints = [
      '/api/partner/v1/pix/cash-in',
      '/api/partner/v1/pix/deposit',
      '/api/v1/pix/qrcode' // Fallback legado
    ];

    let pixData = null;
    let lastError = null;

    for (const endpoint of pixEndpoints) {
      const url = `${baseUrl}${endpoint}`;
      try {
        console.log(`[PIX] Tentando criar em: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`, // Token vai no Header
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            amount: Number(amount), // API pode esperar float
            value: Number(amount),  // Ou 'value'
            description: description || 'Acesso VIP',
            webhook_url: webhookUrl
          })
        });

        if (response.status === 404) {
          console.log(`[PIX] Rota 404: ${endpoint}`);
          continue;
        }

        if (!response.ok) {
          const err = await response.text();
          console.error(`[PIX] Erro ${endpoint}:`, err);
          lastError = err;
          continue; // Tenta próxima rota se der erro 400/500 (pode ser formato do body errado pra aquela rota)
        }

        pixData = await response.json();
        break; // Sucesso
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!pixData) {
      throw new Error(`Falha ao criar Pix. Último erro: ${lastError}`);
    }

    // Normalização da Resposta (Mapeia campos da SyncPay para nosso app)
    // Procurando campos comuns em APIs de parceiros
    const copyPaste = pixData.qrcode_text || pixData.emv || pixData.qrcode || pixData.copy_and_paste || pixData.pix_copy_paste;
    const qrBase64 = pixData.qrcode_base64 || pixData.image_base64 || pixData.pix_qr_code_base64;
    const txId = pixData.id || pixData.transaction_id || pixData.uuid || pixData.charge_id;

    // Se a API retornou o objeto mas os campos estão aninhados (ex: data: { ... })
    const deepData = pixData.data || pixData; 
    const finalCopyPaste = copyPaste || deepData.qrcode_text || deepData.emv;
    const finalQrBase64 = qrBase64 || deepData.qrcode_base64 || deepData.image_base64;
    const finalTxId = txId || deepData.id || deepData.uuid;

    return res.status(200).json({
      transactionId: finalTxId,
      qrCodeBase64: finalQrBase64,
      copyPasteCode: finalCopyPaste,
      debug_raw: pixData // Útil para debugar no console do browser se algo der errado
    });

  } catch (error) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ error: error.message });
  }
}