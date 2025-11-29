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
    // 1. AUTENTICAÇÃO
    // ---------------------------------------------------------
    const authUrl = `${baseUrl}/api/partner/v1/auth-token`;
    
    console.log(`[AUTH] Solicitando token em: ${authUrl}`);
    
    const authResponse = await fetch(authUrl, {
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

    if (!authResponse.ok) {
      const errText = await authResponse.text();
      console.error("[AUTH ERROR]", errText);
      throw new Error(`Erro Auth (${authResponse.status}): Verifique credenciais.`);
    }

    const authData = await authResponse.json();
    const token = authData.access_token;
    
    if (!token) {
      throw new Error("Token não retornado pela API.");
    }

    // ---------------------------------------------------------
    // 2. CRIAÇÃO DO PIX (Cash-In)
    // ---------------------------------------------------------
    // Rota confirmada pela documentação: POST /api/partner/v1/cash-in
    const pixUrl = `${baseUrl}/api/partner/v1/cash-in`;
    
    console.log(`[PIX] Criando transação em: ${pixUrl}`);

    const pixBody = {
      amount: Number(amount),
      description: description || 'Acesso VIP',
      webhook_url: webhookUrl,
      // Dados dummy do cliente para evitar erro 422 (mesmo sendo opcional na doc, é boa prática)
      client: {
        name: "Cliente VIP",
        cpf: "00000000000", 
        email: "cliente@email.com",
        phone: "11999999999"
      }
    };

    const pixResponse = await fetch(pixUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(pixBody)
    });

    if (!pixResponse.ok) {
      const errText = await pixResponse.text();
      console.error("[PIX ERROR]", errText);
      throw new Error(`Falha API Pix (${pixResponse.status}): ${errText}`);
    }

    const pixData = await pixResponse.json();

    // ---------------------------------------------------------
    // 3. NORMALIZAÇÃO DA RESPOSTA (Baseado na Documentação)
    // ---------------------------------------------------------
    // Doc diz: 
    // "pix_code": string (Copia e cola)
    // "identifier": string (UUID)
    
    const copyPaste = pixData.pix_code;
    const txId = pixData.identifier;

    if (!copyPaste || !txId) {
      console.error("Payload recebido:", pixData);
      throw new Error("API respondeu, mas faltam campos obrigatórios (pix_code ou identifier).");
    }

    return res.status(200).json({
      transactionId: txId,
      qrCodeBase64: null, // A API não retorna imagem, o Frontend vai gerar via react-qr-code
      copyPasteCode: copyPaste,
      debug_raw: pixData
    });

  } catch (error) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ error: error.message });
  }
}