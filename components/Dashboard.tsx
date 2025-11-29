import React, { useState } from 'react';
import { fetchDashboardStats } from '../services/analyticsService';
import { DashboardStats } from '../types';
import { Users, DollarSign, TrendingUp, Activity, MapPin, RefreshCw, LogOut } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') {
      setIsAuthenticated(true);
      loadStats();
    } else {
      alert('Senha incorreta!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setStats(null);
  }

  const loadStats = async () => {
    setLoading(true);
    const data = await fetchDashboardStats();
    setStats(data);
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0e1621] flex items-center justify-center p-4 font-sans">
        <form onSubmit={handleLogin} className="bg-[#1c2732] p-8 rounded-xl shadow-2xl border border-[#2b5278] w-full max-w-sm">
          <h2 className="text-white text-xl font-bold mb-6 text-center flex justify-center items-center gap-2">
            <Lock className="w-5 h-5 text-[#4a9c6d]" /> Acesso Restrito
          </h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha de administrador"
            className="w-full bg-[#0f161e] text-white p-3 rounded-lg border border-[#2b5278] focus:border-[#4a9c6d] outline-none mb-4 placeholder-gray-500"
          />
          <button type="submit" className="w-full bg-[#4a9c6d] hover:bg-[#3d8b5e] text-white font-bold py-3 rounded-lg transition-colors shadow-lg">
            Acessar Painel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1621] text-white p-4 overflow-y-auto font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-[#1c2732] p-4 rounded-xl border border-[#2b5278] shadow-lg sticky top-0 z-10">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-white">
            <Activity className="text-[#4a9c6d]" /> Dashboard
          </h1>
          <div className="flex gap-2">
            <button onClick={loadStats} className="bg-[#2b5278] hover:bg-[#34608b] p-2 rounded-lg text-white transition-colors" title="Atualizar">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleLogout} className="bg-red-900/50 hover:bg-red-800/50 p-2 rounded-lg text-red-200 transition-colors" title="Sair">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1c2732] p-4 rounded-xl border border-[#2b5278] shadow-lg">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-1 font-bold">
              <DollarSign className="w-4 h-4 text-[#4a9c6d]" /> Faturamento
            </div>
            <div className="text-2xl font-bold text-[#4a9c6d]">
              R$ {stats?.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-[#1c2732] p-4 rounded-xl border border-[#2b5278] shadow-lg">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-1 font-bold">
              <Users className="w-4 h-4 text-blue-400" /> Visitantes
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {stats?.totalVisitors}
            </div>
          </div>
          <div className="bg-[#1c2732] p-4 rounded-xl border border-[#2b5278] shadow-lg">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-1 font-bold">
              <TrendingUp className="w-4 h-4 text-purple-400" /> Conversão
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {stats?.conversionRate}%
            </div>
          </div>
          <div className="bg-[#1c2732] p-4 rounded-xl border border-[#2b5278] shadow-lg">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-1 font-bold">
              <Activity className="w-4 h-4 text-yellow-400" /> Online
            </div>
            <div className="text-2xl font-bold text-yellow-400 animate-pulse">
              {stats?.activeUsers}
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Barras */}
          <div className="bg-[#1c2732] p-6 rounded-xl border border-[#2b5278] shadow-lg">
            <h3 className="font-semibold mb-6 text-gray-200">Vendas (7 dias)</h3>
            <div className="bar-container w-full h-40 flex items-end justify-between gap-2">
              {stats?.salesByDay.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end gap-2 group cursor-pointer">
                  <div 
                    className="w-full bg-[#4a9c6d] rounded-t hover:bg-[#5bb582] transition-all relative shadow-[0_0_10px_rgba(74,156,109,0.3)]"
                    style={{ height: `${(item.value / 1500) * 100}%`, minHeight: '6px' }}
                  >
                     <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                        R$ {item.value}
                     </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico de Pizza */}
          <div className="bg-[#1c2732] p-6 rounded-xl border border-[#2b5278] flex flex-col items-center justify-center shadow-lg">
             <h3 className="font-semibold mb-6 w-full text-left text-gray-200">Status dos Pedidos</h3>
             <div className="flex flex-row items-center justify-center gap-8 w-full">
                <div 
                  className="pie-chart shadow-xl relative"
                  style={{ 
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    background: `conic-gradient(
                      #4ade80 0% 65%, 
                      #facc15 65% 90%, 
                      #ef4444 90% 100%
                    )`
                  } as React.CSSProperties}
                >
                  <div className="absolute inset-0 m-auto bg-[#1c2732] rounded-full w-[60%] h-[60%] flex items-center justify-center">
                     <span className="text-xs text-gray-400 font-bold">Total</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 text-sm">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#4ade80] rounded-full shadow-[0_0_8px_#4ade80]"></div> 
                      <span className="text-gray-300">Pago (65%)</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#facc15] rounded-full shadow-[0_0_8px_#facc15]"></div> 
                      <span className="text-gray-300">Pendente (25%)</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#ef4444] rounded-full shadow-[0_0_8px_#ef4444]"></div> 
                      <span className="text-gray-300">Falha (10%)</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Tabela de Transações Recentes */}
        <div className="bg-[#1c2732] rounded-xl border border-[#2b5278] overflow-hidden shadow-lg">
          <div className="p-4 border-b border-[#2b5278] bg-[#232e3c]">
            <h3 className="font-semibold text-white">Últimas Transações</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#151e27] text-gray-400">
                <tr>
                  <th className="p-4 font-medium uppercase text-xs tracking-wider">Cliente</th>
                  <th className="p-4 font-medium uppercase text-xs tracking-wider">Valor</th>
                  <th className="p-4 font-medium uppercase text-xs tracking-wider">Localização</th>
                  <th className="p-4 font-medium uppercase text-xs tracking-wider">Status</th>
                  <th className="p-4 font-medium uppercase text-xs tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2b5278]">
                {stats?.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#232e3c] transition-colors cursor-default">
                    <td className="p-4 font-medium text-white">{tx.customerName}</td>
                    <td className="p-4 text-[#4a9c6d] font-bold">R$ {tx.amount.toFixed(2)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        {tx.location}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                        tx.status === 'paid' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 
                        tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : 
                        'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {tx.status === 'paid' ? 'PAGO' : tx.status === 'pending' ? 'PENDENTE' : 'FALHA'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">{tx.date}</td>
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