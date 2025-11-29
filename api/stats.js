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
    // 1. Buscar Visitantes
    const visitors = await kv.get('site_visitors') || 0;

    // 2. Buscar Transações
    // Nota: 'keys' pode ser lento se houver milhões de registros, mas para um bot simples é ok.
    // Em produção de alta escala, usaríamos uma lista (LPUSH) para armazenar IDs.
    const keys = await kv.keys('tx:*');
    let transactions = [];

    if (keys.length > 0) {
        // Pipeline para buscar todos os dados de uma vez
        const pipeline = kv.pipeline();
        keys.forEach(key => pipeline.hgetall(key));
        transactions = await pipeline.exec();
    }

    // 3. Processar Estatísticas
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    const salesByDayMap = {};

    // Ordenar por data (mais recente primeiro)
    transactions.sort((a, b) => b.timestamp - a.timestamp);

    transactions.forEach(tx => {
        if (!tx) return;
        const amount = parseFloat(tx.amount || 0);
        
        if (tx.status === 'paid') {
            totalRevenue += amount;
            paidCount++;
            
            // Agrupar vendas por dia
            // Formato da data salva: DD/MM/AAAA (pt-BR)
            const dayParts = tx.date.split('/');
            // Pega apenas o dia e mês para o gráfico (ex: "15/03")
            const shortDate = `${dayParts[0]}/${dayParts[1]}`;
            
            if (!salesByDayMap[shortDate]) salesByDayMap[shortDate] = 0;
            salesByDayMap[shortDate] += amount;
        } else if (tx.status === 'pending') {
            pendingCount++;
        } else {
            failedCount++;
        }
    });

    // Formatar Sales By Day para o gráfico (últimos 7 dias ou o que tiver)
    const salesByDay = Object.keys(salesByDayMap).map(day => ({
        day,
        value: salesByDayMap[day]
    })).slice(-7); // Pega os últimos 7

    // Calcular conversão
    const conversionRate = visitors > 0 ? ((paidCount / visitors) * 100).toFixed(1) : 0;
    // Usuários ativos (simulação baseada em pendentes recentes)
    const activeUsers = pendingCount > 0 ? pendingCount + Math.floor(Math.random() * 5) : 0;

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
      recentTransactions: transactions.slice(0, 10) // Retorna apenas as 10 últimas
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    // Fallback vazio em caso de erro no Redis
    res.status(500).json({
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