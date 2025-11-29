export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Transaction ID missing' });
  }

  const clientId = process.env.VITE_SYNC_PAY_CLIENT_ID;
  const clientSecret = process.env.VITE_SYNC_PAY_CLIENT_SECRET;
  const rawBaseUrl = process.env.VITE_SYNC_PAY_BASE_URL || 'https://api.syncpayments.com.br';
  const baseUrl = rawBaseUrl.replace(/\/$/, '');

  // Helper para tentar múltiplas URLs (Mesma lógica do create_pix)
  async function tryEndpoints(endpoints, options, context) {
    let lastError = null;
    for (const endpoint of endpoints) {
      const url = `${baseUrl}${endpoint}`;
      try {
        const response = await fetch(url, options);
        if (response.status === 404) {
          lastError = `Rota não encontrada: ${endpoint}`;
          continue;
        }
        return response;
      } catch (err) {
        lastError = err.message;
      }
    }
    throw new Error(`Falha em todas rotas de ${context}`);
  }

  try {
    // 1. Autenticação (Fallback)
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

    if (!authResponse.ok) throw new Error('Auth Failed');
    
    const authData = await authResponse.json();
    const token = authData.access_token;

    // 2. Consulta Status (Fallback)
    const statusResponse = await tryEndpoints(
      [`/v1/transactions/${id}`, `/api/v1/transactions/${id}`, `/v1/pix/charges/${id}`, `/api/v1/pix/charges/${id}`],
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'BotTelegramIntegration/1.0'
        }
      },
      'CHECK_STATUS'
    );

    if (!statusResponse.ok) {
       return res.status(200).json({ paid: false, error_check: 'Transaction check failed' });
    }

    const statusData = await statusResponse.json();
    // Normalização de status
    const status = (statusData.status || statusData.state || 'UNKNOWN').toUpperCase();

    const isPaid = ['PAID', 'COMPLETED', 'CONFIRMED', 'APPROVED', 'SETTLED', 'CONCLUIDA'].includes(status);

    return res.status(200).json({ paid: isPaid, status: status });

  } catch (error) {
    console.error('Check Status Error:', error);
    return res.status(200).json({ paid: false, error: error.message });
  }
}