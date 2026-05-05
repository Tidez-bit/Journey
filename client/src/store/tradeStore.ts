import { create } from 'zustand';
import api from '../lib/api';

interface PartialClose {
  id: string;
  tradeId: string;
  closeTime: string;
  closePrice: number;
  closedSize: number;
  pnl: number;
  notes?: string;
  createdAt: string;
}

interface Trade {
  id: string;
  openTime: string;
  exitTime?: string;
  pair: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  slPrice?: number;
  tpPrice?: number;
  exitPrice?: number;
  pnl: number;
  pnlPercent?: number;
  strategy?: string;
  screenshotUrl?: string;
  notes?: string;
  tags?: string;
  isRuleViolated: boolean;
  status: 'RUNNING' | 'CLOSED';
  tradeRules?: any[];
  partialclose?: PartialClose[];
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface TradeAnalytics {
  metrics: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
    runningTrades: number;
    closedTrades: number;
  };
  pnlPerPair: Array<{ pair: string; pnl: number }>;
  winRatePerStrategy: Array<{ strategy: string; winRate: number; totalTrades: number }>;
  tradeDistribution: Array<{ date: string; count: number }>;
}

interface TradeState {
  trades: Trade[];
  pagination: Pagination | null;
  currentTrade: Trade | null;
  analytics: TradeAnalytics | null;
  isLoading: boolean;
  error: string | null;
  fetchTrades: (filters?: { startDate?: string; endDate?: string; pair?: string; status?: string; page?: number; limit?: number }) => Promise<void>;
  fetchTradeById: (id: string) => Promise<Trade | null>;
  createTrade: (data: any) => Promise<boolean>;
  updateTrade: (id: string, data: any) => Promise<boolean>;
  deleteTrade: (id: string) => Promise<boolean>;
  setCurrentTrade: (trade: Trade | null) => void;
  createPartialClose: (tradeId: string, data: any) => Promise<boolean>;
  deletePartialClose: (tradeId: string, partialId: string) => Promise<boolean>;
  fetchAnalytics: (filters?: { startDate?: string; endDate?: string }) => Promise<void>;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  trades: [],
  pagination: null,
  currentTrade: null,
  analytics: null,
  isLoading: false,
  error: null,
  fetchTrades: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.pair) params.append('pair', filters.pair);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await api.get(`/trades?${params.toString()}`);
      set({ 
        trades: response.data.data || response.data, 
        pagination: response.data.pagination || null,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch trades', isLoading: false });
    }
  },
  fetchTradeById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/trades/${id}`);
      set({ currentTrade: response.data, isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch trade details', isLoading: false });
      return null;
    }
  },
  createTrade: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/trades', data);
      await get().fetchTrades();
      return true;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create trade', isLoading: false });
      return false;
    }
  },
  updateTrade: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/trades/${id}`, data);
      await get().fetchTrades();
      return true;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update trade', isLoading: false });
      return false;
    }
  },
  deleteTrade: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/trades/${id}`);
      await get().fetchTrades();
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete trade', isLoading: false });
      return false;
    }
  },
  setCurrentTrade: (trade) => set({ currentTrade: trade }),
  createPartialClose: async (tradeId, data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/trades/${tradeId}/partial-close`, data);
      // Refresh current trade to show new partial close
      await get().fetchTradeById(tradeId);
      return true;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create partial close', isLoading: false });
      return false;
    }
  },
  deletePartialClose: async (tradeId, partialId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/trades/${tradeId}/partial-close/${partialId}`);
      // Refresh current trade
      await get().fetchTradeById(tradeId);
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete partial close', isLoading: false });
      return false;
    }
  },
  fetchAnalytics: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/trades/analytics?${params.toString()}`);
      set({ analytics: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch analytics', isLoading: false });
    }
  },
}));
