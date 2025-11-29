import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Transaction ID is required' });

  // 1. Verificar na SyncPay (Lógica Original)
  const clientId = process.env.VITE_SYNC_PAY_CLIENT_ID;
  const clientSecret = process.env.VITE_SYNC_PAY_CLIENT_SECRET;
  const rawBaseUrl = process.env.VITE_SYNC_PAY_BASE_URL || 'https://api.syncpayments.com.br';
  const baseUrl = rawBaseUrl.replace(/\/$/, '');

  try {
    // Auth
    const authUrl = `${baseUrl}/api/partner/v1/auth-token`;
    const authRes = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret })
    });
    if (!authRes.ok) throw new Error('Auth Failed');
    const { access_token } = await authRes.json();

    // Check Status
    const txUrl = `${baseUrl}/api/partner/v1/transactions/${id}`;
    const txRes = await fetch(txUrl, {
      headers: { 'Authorization': `Bearer ${access_token}`, 'Accept': 'application/json' }
    });

    let isPaid = false;
    let currentStatus = 'UNKNOWN';

    if (txRes.ok) {
        const data = await txRes.json();
        const dataRef = data.data || data;
        currentStatus = (dataRef.status || dataRef.state || 'UNKNOWN').toUpperCase();
        
        isPaid = [
          'PAID', 'COMPLETED', 'CONFIRMED', 'APPROVED', 'CONCLUIDA', 'PAGO', 'LIQUIDATED'
        ].includes(currentStatus);
    } else {
        // Fallback: Tenta consultar direto no cash-in se transactions falhar
        const ciUrl = `${baseUrl}/api/partner/v1/cash-in/${id}`;
        const ciRes = await fetch(ciUrl, { headers: { 'Authorization': `Bearer ${access_token}` }});
        if (ciRes.ok) {
            const data = await ciRes.json();
            const dataRef = data.data || data;
            currentStatus = (dataRef.status || 'UNKNOWN').toUpperCase();
            isPaid = ['PAID', 'COMPLETED', 'CONFIRMED', 'APPROVED'].includes(currentStatus);
        }
    }

    // 2. Atualizar Banco de Dados (Redis)
    if (currentStatus !== 'UNKNOWN') {
        try {
            // Verifica se já existe
            const exists = await kv.exists(`tx:${id}`);
            if (exists) {
                // Atualiza apenas o status
                const dbStatus = isPaid ? 'paid' : (currentStatus === 'CANCELED' || currentStatus === 'FAILED' ? 'failed' : 'pending');
                await kv.hset(`tx:${id}`, { status: dbStatus });
                console.log(`[DB] Status da tx ${id} atualizado para ${dbStatus}`);
            }
        } catch (dbError) {
            console.error("Erro ao atualizar Redis:", dbError);
        }
    }

    return res.status(200).json({ paid: isPaid, status: currentStatus });

  } catch (error) {
    console.error("Status Check Error:", error);
    return res.status(200).json({ paid: false, error: error.message });
  }
}