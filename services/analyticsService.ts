
import { DashboardStats } from '../types';

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await fetch('/api/stats');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Falha ao carregar dados');
  } catch (error) {
    console.error('Analytics Error:', error);
    // Retornar fallback vazio se falhar
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
};