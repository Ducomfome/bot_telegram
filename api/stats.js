import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Se não tiver variável, retorna zerado sem erro 500
  if (!process.env.KV_REST_API_URL) {
      console.warn("KV não configurado.");
      return res.status(200).json(getEmptyStats());
  }

  try {
    // 1. Visitantes
    const visitors = await kv.get('site_visitors') || 0;
    
    // 2. Online Users
    let activeUsers = 0;
    try {
        const onlineKeys = await kv.keys('online:*');
        activeUsers = onlineKeys ? onlineKeys.length : 0;
    } catch (e) {
        // Ignora erro de keys
    }

    // 3. Transações
    let txKeys = [];
    try {
        txKeys = await kv.lrange('transactions_list', 0, -1);
    } catch (e) {
        console.warn("Erro ao ler lista:", e);
    }

    // Fallback se lista vazia
    if (!txKeys || txKeys.length === 0) {
        try {
            txKeys = await kv.keys('tx:*');
        } catch (e) {}
    }

    let transactions = [];
    if (txKeys && txKeys.length > 0) {
        // Remove duplicatas e garante formato
        const uniqueKeys = [...new Set(txKeys)].map(k => k.startsWith('tx:') ? k : `tx:${k}`);
        
        // Pipeline para buscar tudo rápido
        if (uniqueKeys.length > 0) {
            const pipeline = kv.pipeline();
            uniqueKeys.forEach(k => pipeline.hgetall(k));
            const results = await pipeline.exec();
            // Filtra resultados válidos
            transactions = results.filter(t => t && t.amount);
        }
    }

    // 4. Cálculos
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    const salesByDayMap = {};

    transactions.sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));

    transactions.forEach(tx => {
        const amount = parseFloat(tx.amount || 0);
        const status = (tx.status || 'pending').toLowerCase();
        
        if (['paid', 'approved', 'completed', 'pago'].includes(status)) {
            totalRevenue += amount;
            paidCount++;
            
            if (tx.date) {
                const dayParts = tx.date.split('/'); // DD/MM/YYYY
                if (dayParts.length >= 2) {
                    const shortDate = `${dayParts[0]}/${dayParts[1]}`;
                    salesByDayMap[shortDate] = (salesByDayMap[shortDate] || 0) + amount;
                }
            }
        } else if (['failed', 'canceled'].includes(status)) {
            failedCount++;
        } else {
            pendingCount++;
        }
    });

    const salesByDay = Object.keys(salesByDayMap).map(day => ({
        day,
        value: salesByDayMap[day]
    })).slice(-7); // Últimos 7 dias

    const conversionRate = visitors > 0 ? ((paidCount / visitors) * 100).toFixed(1) : 0;

    return res.status(200).json({
      totalRevenue,
      totalVisitors: parseInt(visitors),
      conversionRate: parseFloat(conversionRate),
      activeUsers,
      salesByDay,
      statusDistribution: [
         { status: 'Pago', count: paidCount, color: '#4ade80' },
         { status: 'Pendente', count: pendingCount, color: '#facc15' },
         { status: 'Falha', count: failedCount, color: '#ef4444' }
      ],
      recentTransactions: transactions.slice(0, 50),
      debug_db_status: "connected"
    });

  } catch (error) {
    console.error("Stats Error:", error);
    return res.status(200).json(getEmptyStats());
  }
}

function getEmptyStats() {
    return {
        totalRevenue: 0,
        totalVisitors: 0,
        conversionRate: 0,
        activeUsers: 0,
        salesByDay: [],
        statusDistribution: [],
        recentTransactions: []
    };
}