import Redis from 'ioredis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const emptyStats = {
    totalRevenue: 0,
    totalVisitors: 0,
    conversionRate: 0,
    activeUsers: 0,
    salesByDay: [],
    statusDistribution: [],
    recentTransactions: [],
    status: "db_not_configured"
  };

  const redisUrl = process.env.KV_REDIS_URL || process.env.KV_URL;

  if (!redisUrl) {
      console.warn("API STATS: Variável KV_REDIS_URL não encontrada.");
      return res.status(200).json(emptyStats);
  }

  try {
    const redis = new Redis(redisUrl);

    // 1. Visitantes
    const visitors = await redis.get('site_visitors') || 0;
    
    // 2. Online Users
    let activeUsers = 0;
    try {
        const onlineKeys = await redis.keys('online:*');
        activeUsers = onlineKeys ? onlineKeys.length : 0;
    } catch (e) { console.warn("Erro ao contar online:", e.message); }

    // 3. Transações
    let txKeys = [];
    try {
        txKeys = await redis.lrange('transactions_list', 0, -1);
    } catch (e) { console.warn("Erro ao ler transactions_list:", e.message); }

    if (!txKeys || txKeys.length === 0) {
        try {
            txKeys = await redis.keys('tx:*');
        } catch (e) {}
    }

    let transactions = [];
    if (txKeys && txKeys.length > 0) {
        const uniqueKeys = [...new Set(txKeys)].map(k => k.startsWith('tx:') ? k : `tx:${k}`);
        
        if (uniqueKeys.length > 0) {
            const pipeline = redis.pipeline();
            uniqueKeys.forEach(k => pipeline.hgetall(k));
            const results = await pipeline.exec();
            
            // ioredis pipeline results: [[err, result], [err, result]...]
            transactions = results
                .map(r => r[1])
                .filter(t => t && t.amount);
        }
    }
    
    // Fechar conexão
    await redis.quit();

    // 4. Processamento dos dados
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    const salesByDayMap = {};

    transactions.sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));

    transactions.forEach(tx => {
        const amount = parseFloat(tx.amount || 0);
        const status = (tx.status || 'pending').toLowerCase();
        const dateStr = tx.date || '';

        if (['paid', 'approved', 'completed', 'pago'].includes(status)) {
            totalRevenue += amount;
            paidCount++;
            
            const dayParts = dateStr.split('/');
            if (dayParts.length >= 2) {
                const shortDate = `${dayParts[0]}/${dayParts[1]}`;
                salesByDayMap[shortDate] = (salesByDayMap[shortDate] || 0) + amount;
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
    })).slice(-7);

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
      status: "success"
    });

  } catch (error) {
    console.error("Stats Fatal Error:", error);
    return res.status(200).json(emptyStats);
  }
}