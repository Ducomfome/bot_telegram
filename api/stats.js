
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
    // 1. Buscar Visitantes (Total Histórico)
    const visitors = await kv.get('site_visitors') || 0;

    // 2. Buscar Usuários Online (Heartbeats ativos)
    // Keys não é o ideal para produção massiva, mas para dashboard admin funciona bem
    const onlineKeys = await kv.keys('online:*');
    const activeUsers = onlineKeys.length;

    // 3. Buscar Transações
    // Tenta buscar da lista organizada primeiro
    let txKeys = await kv.lrange('transactions_list', 0, -1);
    
    // Fallback: se a lista estiver vazia (legado), tenta buscar por padrão de chave
    if (!txKeys || txKeys.length === 0) {
       txKeys = await kv.keys('tx:*');
    }

    let transactions = [];

    if (txKeys && txKeys.length > 0) {
        const pipeline = kv.pipeline();
        // Garante que só chaves únicas sejam buscadas (remove duplicatas)
        const uniqueKeys = [...new Set(txKeys)];
        
        uniqueKeys.forEach(key => pipeline.hgetall(key));
        const results = await pipeline.exec();
        
        // FILTRAGEM CRÍTICA: Remove nulos para evitar Crash 500
        transactions = results.filter(tx => tx !== null && tx.amount !== undefined);
    }

    // 4. Processar Estatísticas
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    const salesByDayMap = {};

    // Ordenar: Mais recente primeiro
    transactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    transactions.forEach(tx => {
        const amount = parseFloat(tx.amount || 0);
        const status = (tx.status || 'pending').toLowerCase();
        
        if (status === 'paid') {
            totalRevenue += amount;
            paidCount++;
            
            // Agrupar vendas por dia
            if (tx.date) {
                const dayParts = tx.date.split('/');
                if (dayParts.length >= 2) {
                    const shortDate = `${dayParts[0]}/${dayParts[1]}`;
                    if (!salesByDayMap[shortDate]) salesByDayMap[shortDate] = 0;
                    salesByDayMap[shortDate] += amount;
                }
            }
        } else if (status === 'pending') {
            pendingCount++;
        } else {
            failedCount++;
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
      activeUsers, // Valor real baseado em IPs online nos últimos 60s
      salesByDay,
      statusDistribution: [
         { status: 'Pago', count: paidCount, color: '#4ade80' },
         { status: 'Pendente', count: pendingCount, color: '#facc15' },
         { status: 'Falha', count: failedCount, color: '#ef4444' }
      ],
      recentTransactions: transactions.slice(0, 20)
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    // Retorna JSON vazio em vez de erro 500 para não quebrar o frontend
    res.status(200).json({
        totalRevenue: 0,
        totalVisitors: 0,
        conversionRate: 0,
        activeUsers: 0,
        salesByDay: [],
        statusDistribution: [],
        recentTransactions: []
    });
  }
}
