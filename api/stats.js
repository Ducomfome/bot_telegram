
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Verificação de segurança
    if (!process.env.KV_REST_API_URL) {
        console.error("KV_REST_API_URL não definida.");
        return res.status(200).json(getEmptyStats());
    }

    // 1. Buscar Visitantes e Online
    const visitors = await kv.get('site_visitors') || 0;
    
    // kv.keys pode retornar null ou throw em alguns casos, tratamos isso
    let activeUsers = 0;
    try {
        const onlineKeys = await kv.keys('online:*');
        activeUsers = onlineKeys ? onlineKeys.length : 0;
    } catch (e) {
        console.warn("Erro ao contar online:", e);
    }

    // 2. Buscar Transações (Lista + Fallback)
    let txKeys = [];
    try {
        txKeys = await kv.lrange('transactions_list', 0, -1);
    } catch (e) {
        console.warn("Erro lrange:", e);
    }
    
    // Fallback: Se a lista estiver vazia, tenta escanear chaves tx:*
    if (!txKeys || txKeys.length === 0) {
       console.log("Lista vazia, buscando chaves tx:* diretamente...");
       try {
         txKeys = await kv.keys('tx:*');
       } catch (e) {
         txKeys = [];
       }
    }

    let transactions = [];

    if (txKeys && txKeys.length > 0) {
        const uniqueKeys = [...new Set(txKeys)].map(k => k.startsWith('tx:') ? k : `tx:${k}`);
        
        if (uniqueKeys.length > 0) {
            const pipeline = kv.pipeline();
            uniqueKeys.forEach(key => pipeline.hgetall(key));
            const results = await pipeline.exec();
            
            // Filtra nulos
            transactions = results.filter(tx => tx && tx.amount);
        }
    }

    // 3. Calcular Métricas
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    const salesByDayMap = {};

    transactions.sort((a, b) => {
        const timeA = Number(a.timestamp) || 0;
        const timeB = Number(b.timestamp) || 0;
        return timeB - timeA;
    });

    transactions.forEach(tx => {
        const amount = parseFloat(tx.amount || 0);
        const status = (tx.status || 'pending').toLowerCase();
        
        if (status === 'paid' || status === 'approved' || status === 'completed') {
            totalRevenue += amount;
            paidCount++;
            
            if (tx.date) {
                const dayParts = tx.date.split('/');
                if (dayParts.length >= 2) {
                    const shortDate = `${dayParts[0]}/${dayParts[1]}`;
                    if (!salesByDayMap[shortDate]) salesByDayMap[shortDate] = 0;
                    salesByDayMap[shortDate] += amount;
                }
            }
        } else if (status === 'failed' || status === 'canceled') {
            failedCount++;
        } else {
            pendingCount++;
        }
    });

    const salesByDay = Object.keys(salesByDayMap).map(day => ({
        day,
        value: salesByDayMap[day]
    })).slice(-7);

    const conversionRate = visitors > 0 ? ((paidCount / visitors) * 100).toFixed(1) : 0;

    const stats = {
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
      recentTransactions: transactions.slice(0, 50)
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(200).json(getEmptyStats());
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
