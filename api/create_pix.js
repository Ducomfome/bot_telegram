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
    return res.status(500).json({ error: 'Credenciais não configuradas.' });
  }

  // Helper para tentar múltiplas URLs (Fallback Logic)
  async function tryEndpoints(endpoints, options, context) {
    let lastError = null;
    for (const endpoint of endpoints) {
      const url = `${baseUrl}${endpoint}`;
      try {
        console.log(`[${context}] Tentando: ${url}`);
        const response = await fetch(url, options);
        
        // Se for 404, assume que a rota não existe e tenta a próxima
        if (response.status === 404) {
          console.log(`[${context}] 404 em ${url}, tentando próxima...`);
          lastError = `Rota não encontrada: ${endpoint}`;
          continue;
        }

        // Se passar, retorna a response para processamento
        return response;
      } catch (err) {
        console.error(`[${context}] Erro de rede em ${url}:`, err);
        lastError = err.message;
      }
    }
    throw new Error(`Todas as tentativas falharam para ${context}. Último erro: ${lastError}`);
  }

  try {
    // 1. Autenticação (Tenta /oauth/token E /api/oauth/token)
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const authParams = new URLSearchParams();
    authParams.append('grant_type', 'client_credentials');

    const authResponse = await tryEndpoints(
      ['/oauth/token', '/api/oauth/token'], 
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'BotTelegramIntegration/1.0'
        },
        body: authParams.toString()
      },
      'AUTH'
    );

    if (!authResponse.ok) {
      const errText = await authResponse.text();
      throw new Error(`Falha Auth (${authResponse.status}): ${errText}`);
    }

    const authData = await authResponse.json();
    const token = authData.access_token;

    // 2. Criação do Pix (Tenta rotas comuns de Pix)
    const pixResponse = await tryEndpoints(
      ['/v1/pix/qrcode', '/api/v1/pix/qrcode', '/v1/pix/payment', '/api/v1/pix/payment'],
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'BotTelegramIntegration/1.0'
        },
        body: JSON.stringify({
          amount: Number(amount),
          description: description || 'Acesso VIP',
          webhook_url: webhookUrl
        })
      },
      'PIX_CREATE'
    );

    if (!pixResponse.ok) {
      const errText = await pixResponse.text();
      throw new Error(`Falha Pix (${pixResponse.status}): ${errText}`);
    }

    const pixData = await pixResponse.json();
    
    // Normalização agressiva da resposta
    const copyPaste = pixData.qrcode_text || pixData.emv || pixData.qrcode || pixData.copy_and_paste || pixData.pix_copy_paste;
    const qrBase64 = pixData.qrcode_base64 || pixData.image_base64 || pixData.pix_qr_code_base64;
    const txId = pixData.id || pixData.transaction_id || pixData.uuid || pixData.charge_id;

    if (!copyPaste && !qrBase64) {
        console.error("Resposta da API sem dados de Pix:", JSON.stringify(pixData));
        throw new Error("API retornou sucesso mas sem dados do QR Code.");
    }

    return res.status(200).json({
      transactionId: txId,
      qrCodeBase64: qrBase64,
      copyPasteCode: copyPaste
    });

  } catch (error) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ error: error.message });
  }
}