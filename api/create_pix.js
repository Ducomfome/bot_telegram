
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
  // Remove barra final se existir para evitar //oauth
  const rawBaseUrl = process.env.VITE_SYNC_PAY_BASE_URL || 'https://api.syncpayments.com.br';
  const baseUrl = rawBaseUrl.replace(/\/$/, '');
  
  const webhookUrl = process.env.VITE_WEBHOOK_URL;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Credenciais não configuradas (Client ID/Secret ausentes).' });
  }

  try {
    // 1. Autenticação (OAuth)
    // O header Accept: application/json é CRUCIAL para evitar 404 HTML
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');

    const tokenUrl = `${baseUrl}/oauth/token`;
    
    console.log(`Tentando autenticar em: ${tokenUrl}`); // Log para debug na Vercel

    const authResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json', 
        'User-Agent': 'BotTelegramIntegration/1.0'
      },
      body: params.toString()
    });

    if (!authResponse.ok) {
      const errText = await authResponse.text();
      console.error(`Erro Auth (${authResponse.status}):`, errText);
      
      // Tenta parsear erro JSON, se não, usa o texto puro
      let errMsg = errText;
      try {
        const jsonErr = JSON.parse(errText);
        errMsg = jsonErr.message || jsonErr.error || errText;
      } catch (e) {}

      throw new Error(`Falha na autenticação: ${authResponse.status} - ${errMsg}`);
    }

    const authData = await authResponse.json();
    const token = authData.access_token;

    // 2. Criação do Pix
    const pixUrl = `${baseUrl}/v1/pix/qrcode`;
    
    const pixResponse = await fetch(pixUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'BotTelegramIntegration/1.0'
      },
      body: JSON.stringify({
        amount: Number(amount),
        description: description || 'Acesso Grupo VIP',
        webhook_url: webhookUrl
      })
    });

    if (!pixResponse.ok) {
      const errText = await pixResponse.text();
      console.error(`Erro Pix (${pixResponse.status}):`, errText);
      throw new Error(`Falha na criação do Pix: ${pixResponse.status} - ${errText}`);
    }

    const pixData = await pixResponse.json();
    
    // Normalização da resposta baseada em padrões comuns
    const copyPaste = pixData.qrcode_text || pixData.emv || pixData.qrcode || pixData.copy_and_paste;
    const qrBase64 = pixData.qrcode_base64 || pixData.image_base64;
    const txId = pixData.id || pixData.transaction_id || pixData.uuid;

    return res.status(200).json({
      transactionId: txId,
      qrCodeBase64: qrBase64,
      copyPasteCode: copyPaste
    });

  } catch (error) {
    console.error('API Function Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
