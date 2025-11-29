
export default function handler(req, res) {
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Dados Mockados (Simulando um Banco de Dados Real)
  // Como não temos DB, geramos dados aleatórios "realistas" a cada refresh
  const cities = ['São Paulo - SP', 'Rio de Janeiro - RJ', 'Curitiba - PR', 'Belo Horizonte - MG', 'Salvador - BA', 'Brasília - DF'];
  const names = ['João Silva', 'Maria Oliveira', 'Pedro Santos', 'Ana Costa', 'Lucas Pereira', 'Fernanda Lima'];
  
  const transactions = Array.from({ length: 10 }).map((_, i) => ({
    id: `tx-${Math.floor(Math.random() * 10000)}`,
    customerName: names[Math.floor(Math.random() * names.length)],
    amount: Math.random() > 0.5 ? 19.99 : 23.10,
    status: Math.random() > 0.3 ? 'paid' : (Math.random() > 0.5 ? 'pending' : 'failed'),
    date: new Date(Date.now() - Math.floor(Math.random() * 100000000)).toLocaleDateString('pt-BR'),
    location: cities[Math.floor(Math.random() * cities.length)]
  }));

  const stats = {
    totalRevenue: 12450.50,
    totalVisitors: 3420,
    conversionRate: 4.8,
    activeUsers: Math.floor(Math.random() * 50) + 10,
    salesByDay: [
      { day: 'Seg', value: 450 },
      { day: 'Ter', value: 620 },
      { day: 'Qua', value: 300 },
      { day: 'Qui', value: 890 },
      { day: 'Sex', value: 1200 },
      { day: 'Sab', value: 950 },
      { day: 'Dom', value: 1100 },
    ],
    statusDistribution: [
       { status: 'Pago', count: 65, color: '#4ade80' },
       { status: 'Pendente', count: 25, color: '#facc15' },
       { status: 'Falha', count: 10, color: '#ef4444' }
    ],
    recentTransactions: transactions
  };

  res.status(200).json(stats);
}