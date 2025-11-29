
import React, { useState, useEffect } from 'react';
import { fetchDashboardStats } from '../services/analyticsService';
import { DashboardStats } from '../types';
import { Users, DollarSign, TrendingUp, Activity, MapPin, RefreshCw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') { // Senha simples client-side
      setIsAuthenticated(true);
      loadStats();
    } else {
      alert('Senha incorreta!');
    }
  };

  const loadStats = async () => {
    setLoading(true);
    const data = await fetchDashboardStats();
    setStats(data);
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0e1621] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-[#1c2732] p-8 rounded-xl shadow-2xl border border-[#2b5278] w-full max-w-sm">
          <h2 className="text-white text-xl font-bold mb-6 text-center">Acesso Restrito</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha de administrador"
            className="w-full bg-[#0f161e] text-white p-3 rounded-lg border border-[#2b5278] focus:border-[#4a9c6d] outline-none mb-4"
          />
          <button type="submit" className="w-full bg-[#4a9c6d] hover:bg-[#3d8b5e] text-white font-bold py-3 rounded-lg transition-colors">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1621] text-white p-4 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-[#4a9c6d]" /> Dashboard de Vendas
          </h1>
          <button onClick={loadStats} className="bg-[#2b5278] hover:bg-[#34608b] p-2 rounded-lg text-white">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1c2732] p-4 rounded-xl border border-[#2b5278]">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-1">
              <DollarSign className="w-4 h-4" /> Faturamento
            </div>
            <div className="text-2xl font-bold text-[#4a9c6d]">
              R$ {stats?.totalRevenue.toFixed(2)}
            </div>
          </div>
          <div className="bg-[#1c2732] p-4 rounded-xl border border-[#2b5278]">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-1">
              <Users className="w-4 h-4" /> Visitantes
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {stats?.totalVisitors}
            </div>
          </div>
          <div className="bg-[#1c2732] p-4 rounded-xl border border-[#2b5278]">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-1">
              <TrendingUp className="w-4 h-4" /> Conversão
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {stats?.conversionRate}%
            </div>
          </div>
          <div className="bg-[#1c2732] p-4 rounded-xl border border-[#2b5278]">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-1">
              <Activity className="w-4 h-4" /> Online Agora
            </div>
            <div className="text-2xl font-bold text-yellow-400 animate-pulse">
              {stats?.activeUsers}
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Barras (Vendas Semanal) */}
          <div className="bg-[#1c2732] p-6 rounded-xl border border-[#2b5278]">
            <h3 className="font-semibold mb-6">Vendas últimos 7 dias</h3>
            <div className="bar-container">
              {stats?.salesByDay.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end gap-2 group">
                  <div 
                    className="w-full max-w-[30px] bg-[#4a9c6d] rounded-t hover:bg-[#5bb582] transition-all relative"
                    style={{ height: `${(item.value / 1000) * 100}%`, minHeight: '4px' }}
                  >
                     <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        R${item.value}
                     </span>
                  </div>
                  <span className="text-[10px] text-gray-400">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico de Pizza (CSS Conic Gradient) */}
          <div className="bg-[#1c2732] p-6 rounded-xl border border-[#2b5278] flex flex-col items-center justify-center">
             <h3 className="font-semibold mb-6 w-full text-left">Distribuição de Status</h3>
             <div className="flex items-center gap-8">
                <div 
                  className="pie-chart"
                  style={{ 
                    '--p-paid': '65%', 
                    '--p-pending': '90%' 
                  } as React.CSSProperties}
                />
                <div className="flex flex-col gap-2 text-sm">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div> Pago (65%)
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div> Pendente (25%)
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div> Falha (10%)
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Tabela de Transações Recentes */}
        <div className="bg-[#1c2732] rounded-xl border border-[#2b5278] overflow-hidden">
          <div className="p-4 border-b border-[#2b5278]">
            <h3 className="font-semibold">Últimas Transações</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#151e27] text-gray-400">
                <tr>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Localização</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2b5278]">
                {stats?.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#232e3c] transition-colors">
                    <td className="p-4 font-medium">{tx.customerName}</td>
                    <td className="p-4">R$ {tx.amount.toFixed(2)}</td>
                    <td className="p-4 flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {tx.location}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        tx.status === 'paid' ? 'bg-green-500/20 text-green-400' : 
                        tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.status === 'paid' ? 'PAGO' : tx.status === 'pending' ? 'PENDENTE' : 'FALHA'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};