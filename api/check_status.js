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
  
  const clientId = process.env.VITE_SYNC_PAY_CLIENT_ID;
  const clientSecret = process.env.VITE_SYNC_PAY_CLIENT_SECRET;
  const rawBaseUrl = process.env.VITE_SYNC_PAY_BASE_URL || 'https://api.syncpayments.com.br';
  const baseUrl = rawBaseUrl.replace(/\/$/, '');

  try {
    // 1. AUTENTICAÇÃO
    const authUrl = `${baseUrl}/api/partner/v1/auth-token`;
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret })
    });

    if (!authResponse.ok) throw new Error('Auth Failed');
    const authData = await authResponse.json();
    const token = authData.access_token;

    // 2. CONSULTA
    // Tentativa na rota de criação passando ID (padrão REST comum)
    const statusUrl = `${baseUrl}/api/partner/v1/cash-in/${id}`;

    const response = await fetch(statusUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
       // Se falhar, tenta rota alternativa de transações genérica
       const altResponse = await fetch(`${baseUrl}/api/partner/v1/transactions/${id}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
       });
       if(altResponse.ok) {
          const altData = await altResponse.json();
          return processResponse(res, altData);
       }
       return res.status(200).json({ paid: false, error: 'Transaction lookup failed' });
    }

    const statusData = await response.json();
    return processResponse(res, statusData);

  } catch (error) {
    return res.status(200).json({ paid: false, error: error.message });
  }
}

function processResponse(res, data) {
    // Normalização profunda
    // A API pode retornar o objeto direto ou dentro de 'data'
    const dataRef = data.data || data;
    
    // Status comuns de gateways
    const status = (dataRef.status || dataRef.state || 'UNKNOWN').toUpperCase();
    
    // Lista de status que consideramos "PAGO"
    const isPaid = ['PAID', 'COMPLETED', 'CONFIRMED', 'APPROVED', 'CONCLUIDA', 'RECEIVABLE'].includes(status);

    return res.status(200).json({ paid: isPaid, status: status });
}