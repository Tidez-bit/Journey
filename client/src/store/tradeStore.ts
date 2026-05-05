import { create } from 'zustand';
import api from '../lib/api';

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
  tradeRules?: any[];
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

interface TradeState {
  trades: Trade[];
  pagination: Pagination | null;
  currentTrade: Trade | null;
  isLoading: boolean;
  error: string | null;
  fetchTrades: (filters?: { startDate?: string; endDate?: string; pair?: string; page?: number; limit?: number }) => Promise<void>;
  fetchTradeById: (id: string) => Promise<Trade | null>;
  createTrade: (data: any) => Promise<boolean>;
  updateTrade: (id: string, data: any) => Promise<boolean>;
  deleteTrade: (id: string) => Promise<boolean>;
  setCurrentTrade: (trade: Trade | null) => void;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  trades: [],
  pagination: null,
  currentTrade: null,
  isLoading: false,
  error: null,
  fetchTrades: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.pair) params.append('pair', filters.pair);
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
}));
