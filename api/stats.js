
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
    // Verificação de segurança: Se o banco não estiver conectado, não quebra o app
    if (!process.env.KV_REST_API_URL) {
        console.error("KV_REST_API_URL não definida. O banco não está conectado.");
        return res.status(200).json(getEmptyStats());
    }

    // 1. Buscar Visitantes e Online
    const visitors = await kv.get('site_visitors') || 0;
    const onlineKeys = await kv.keys('online:*');
    const activeUsers = onlineKeys.length;

    // 2. Buscar Transações (Estratégia Híbrida)
    let txKeys = await kv.lrange('transactions_list', 0, -1);
    
    // Fallback: Se a lista estiver vazia, tenta escanear chaves tx:* (mais lento, mas garante dados antigos)
    if (!txKeys || txKeys.length === 0) {
       console.log("Lista vazia, buscando chaves tx:* diretamente...");
       txKeys = await kv.keys('tx:*');
    }

    let transactions = [];

    if (txKeys && txKeys.length > 0) {
        // Remove duplicatas e garante formato correto
        const uniqueKeys = [...new Set(txKeys)].map(k => k.startsWith('tx:') ? k : `tx:${k}`);
        
        // Pipeline para buscar tudo de uma vez (muito mais rápido)
        const pipeline = kv.pipeline();
        uniqueKeys.forEach(key => pipeline.hgetall(key));
        const results = await pipeline.exec();
        
        // Filtra resultados nulos (chaves deletadas ou expiradas)
        transactions = results.filter(tx => tx && tx.amount);
    }

    console.log(`[Stats] Encontradas ${transactions.length} transações.`);

    // 3. Calcular Métricas
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    const salesByDayMap = {};

    // Ordenar por data (mais recente primeiro)
    transactions.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
    });

    transactions.forEach(tx => {
        const amount = parseFloat(tx.amount || 0);
        // Normaliza o status para lowercase para evitar erro de comparação
        const status = (tx.status || 'pending').toLowerCase();
        
        if (status === 'paid' || status === 'approved' || status === 'completed') {
            totalRevenue += amount;
            paidCount++;
            
            if (tx.date) {
                // Formato esperado DD/MM/AAAA
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

    // Formata gráfico de vendas
    const salesByDay = Object.keys(salesByDayMap).map(day => ({
        day,
        value: salesByDayMap[day]
    })).slice(-7); // Últimos 7 dias com vendas

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
      recentTransactions: transactions.slice(0, 50) // Limite de 50 no dashboard
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    // Retorna vazio para não travar o front
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
