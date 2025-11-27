
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
  const baseUrl = process.env.VITE_SYNC_PAY_BASE_URL || 'https://api.syncpayments.com.br';
  const webhookUrl = process.env.VITE_WEBHOOK_URL;

  // Validação básica
  if (!clientId || !clientSecret) {
    console.error('Credenciais não configuradas no Vercel');
    return res.status(500).json({ error: 'Configuração de servidor inválida (Credenciais ausentes).' });
  }

  try {
    // 1. Autenticação (OAuth) - CORRIGIDO para x-www-form-urlencoded
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');

    const authResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!authResponse.ok) {
      const errText = await authResponse.text();
      console.error('Erro Auth Body:', errText);
      throw new Error(`Falha na autenticação: ${authResponse.status} - ${errText}`);
    }

    const authData = await authResponse.json();
    const token = authData.access_token;

    // 2. Criação do Pix
    // Nota: O endpoint exato de criação de PIX pode variar (/v1/pix/qrcode ou /v1/pix/payment)
    // Mantendo /v1/pix/qrcode conforme documentação genérica, ajuste se necessário.
    const pixResponse = await fetch(`${baseUrl}/v1/pix/qrcode`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Number(amount),
        description: description || 'Acesso Grupo VIP',
        webhook_url: webhookUrl
      })
    });

    if (!pixResponse.ok) {
      const errText = await pixResponse.text();
      console.error('Erro Pix Body:', errText);
      throw new Error(`Falha na criação do Pix: ${pixResponse.status} - ${errText}`);
    }

    const pixData = await pixResponse.json();
    
    // Normalização da resposta
    // Algumas APIs retornam { qrcode: ... } outras { qrcode_text: ... }
    const copyPaste = pixData.qrcode_text || pixData.emv || pixData.qrcode || pixData.copy_and_paste;
    const qrBase64 = pixData.qrcode_base64 || pixData.image_base64;

    return res.status(200).json({
      transactionId: pixData.id || pixData.transaction_id || pixData.uuid,
      qrCodeBase64: qrBase64,
      copyPasteCode: copyPaste
    });

  } catch (error) {
    console.error('API Function Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
