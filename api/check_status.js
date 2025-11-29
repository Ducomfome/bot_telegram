
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
    return res.status(400).json({ error: 'Transaction ID is required' });
  }

  const clientId = process.env.VITE_SYNC_PAY_CLIENT_ID;
  const clientSecret = process.env.VITE_SYNC_PAY_CLIENT_SECRET;
  const rawBaseUrl = process.env.VITE_SYNC_PAY_BASE_URL || 'https://api.syncpayments.com.br';
  const baseUrl = rawBaseUrl.replace(/\/$/, '');

  try {
    // ---------------------------------------------------------
    // 1. AUTENTICAÇÃO (Igual ao create_pix)
    // ---------------------------------------------------------
    const authUrl = `${baseUrl}/api/partner/v1/auth-token`;
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret })
    });

    if (!authResponse.ok) throw new Error('Auth Failed');
    const authData = await authResponse.json();
    const token = authData.access_token;

    // ---------------------------------------------------------
    // 2. CONSULTA
    // ---------------------------------------------------------
    // Baseado na imagem da doc: "Transações > Consulta status da transação"
    // URL provável: /api/partner/v1/transactions/{id}
    
    let statusData = null;
    let success = false;

    // Tentativa 1: Rota de Transações (Padrão para consulta)
    const txUrl = `${baseUrl}/api/partner/v1/transactions/${id}`;
    const txResponse = await fetch(txUrl, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });

    if (txResponse.ok) {
      statusData = await txResponse.json();
      success = true;
    } else {
      // Tentativa 2: Fallback para rota de Cash-in direto
      const cashInUrl = `${baseUrl}/api/partner/v1/cash-in/${id}`;
      const cashInResponse = await fetch(cashInUrl, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      
      if (cashInResponse.ok) {
        statusData = await cashInResponse.json();
        success = true;
      }
    }

    if (!success || !statusData) {
      // Se falhar em todas, retornamos paid: false mas sem erro 500, para o polling continuar tentando
      return res.status(200).json({ paid: false, status: 'NOT_FOUND_OR_ERROR' });
    }

    return processResponse(res, statusData);

  } catch (error) {
    console.error("Status Check Error:", error);
    return res.status(200).json({ paid: false, error: error.message });
  }
}

function processResponse(res, data) {
    // Normalização: A API pode retornar o objeto direto ou encapsulado em 'data'
    const dataRef = data.data || data;
    
    // Procura por campos de status comuns
    const status = (dataRef.status || dataRef.state || dataRef.situation || 'UNKNOWN').toUpperCase();
    
    console.log(`[STATUS CHECK] ID: ${dataRef.identifier || 'Unknown'} - Status: ${status}`);

    // Lista de status positivos
    // Adicionamos vários para garantir, pois a doc exata de status não foi mostrada
    const isPaid = [
      'PAID', 
      'COMPLETED', 
      'CONFIRMED', 
      'APPROVED', 
      'CONCLUIDA', 
      'PAGO', 
      'LIQUIDATED',
      'RECEIVABLE'
    ].includes(status);

    return res.status(200).json({ paid: isPaid, status: status });
}
