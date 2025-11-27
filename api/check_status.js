
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
  const baseUrl = process.env.VITE_SYNC_PAY_BASE_URL || 'https://api.syncpayments.com.br';

  try {
    // 1. Autenticação
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

    if (!authResponse.ok) throw new Error('Falha na autenticação');
    const authData = await authResponse.json();
    const token = authData.access_token;

    // 2. Consulta Status
    const statusResponse = await fetch(`${baseUrl}/v1/transactions/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!statusResponse.ok) {
       // Se der 404 ou erro, assumimos pendente ou erro, mas não travamos
       return res.status(200).json({ paid: false });
    }

    const statusData = await statusResponse.json();
    const status = statusData.status ? statusData.status.toUpperCase() : '';

    const isPaid = status === 'PAID' || status === 'COMPLETED' || status === 'CONFIRMED' || status === 'APPROVED';

    return res.status(200).json({ paid: isPaid, status: status });

  } catch (error) {
    console.error('Check Status Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
