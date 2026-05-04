import { create } from 'zustand';
import api from '../lib/api';

interface DashboardStats {
  totalPnL: number;
  winRate: number;
  totalTrades: number;
  bestTrade: number;
  worstTrade: number;
  winStreak: number;
  maxWinStreak: number;
  currentBalance: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  equityCurve: { date: string; balance: number }[];
  recentTrades: any[];
  dailyPnL: { date: string; pnl: number }[];
  maxLossUsed: number;
  maxLossType: string;
  maxLossValue: number;
  scannerEnabled: boolean;
}

interface DashboardState {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  fetchDashboardStats: () => Promise<void>;
  updateSettings: (settings: Partial<DashboardStats>) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  isLoading: false,
  error: null,
  fetchDashboardStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/dashboard/stats');
      set({ stats: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch dashboard stats', isLoading: false });
    }
  },
  updateSettings: async (settings) => {
    try {
      await api.put('/settings', settings);
      set((state) => ({ stats: state.stats ? { ...state.stats, ...settings } : null }));
    } catch (error: any) {
      console.error('Failed to update settings:', error);
    }
  },
}));
