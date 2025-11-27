
export default async function handler(req, res) {
  // Configuração para permitir que seu frontend chame esta função
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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
  
  // Pegando as variáveis de ambiente da Vercel
  const clientId = process.env.VITE_SYNC_PAY_CLIENT_ID;
  const clientSecret = process.env.VITE_SYNC_PAY_CLIENT_SECRET;
  const baseUrl = process.env.VITE_SYNC_PAY_BASE_URL || 'https://api.syncpayments.com.br';
  const webhookUrl = process.env.VITE_WEBHOOK_URL;

  try {
    // 1. Autenticação (OAuth)
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const authResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ grant_type: 'client_credentials' })
    });

    if (!authResponse.ok) {
      const err = await authResponse.text();
      console.error('Erro Auth:', err);
      throw new Error('Falha na autenticação com o gateway');
    }

    const authData = await authResponse.json();
    const token = authData.access_token;

    // 2. Criação do Pix
    const pixResponse = await fetch(`${baseUrl}/v1/pix/qrcode`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Number(amount),
        description: description,
        webhook_url: webhookUrl
      })
    });

    if (!pixResponse.ok) {
      const err = await pixResponse.text();
      console.error('Erro Pix:', err);
      throw new Error('Falha na criação do QR Code');
    }

    const pixData = await pixResponse.json();
    
    // Retorna os dados para o frontend
    return res.status(200).json({
      transactionId: pixData.id || pixData.transaction_id,
      qrCodeBase64: pixData.qrcode_base64,
      copyPasteCode: pixData.qrcode_text || pixData.emv || pixData.qrcode
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
