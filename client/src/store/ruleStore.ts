import { create } from 'zustand';
import api from '../lib/api';

interface Rule {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: string;
}

interface RuleStats {
  totalTrades: number;
  tradesWithViolation: number;
  complianceRate: number;
  violationRate: number;
  rules: any[];
}

interface RuleState {
  rules: Rule[];
  ruleStats: RuleStats | null;
  isLoading: boolean;
  error: string | null;
  fetchRules: () => Promise<void>;
  createRule: (data: any) => Promise<boolean>;
  updateRule: (id: string, data: any) => Promise<boolean>;
  deleteRule: (id: string) => Promise<void>;
  toggleRuleActive: (id: string, currentStatus: boolean) => Promise<void>;
  fetchRuleStats: () => Promise<void>;
  attachRuleToTrade: (tradeId: string, ruleId: string) => Promise<void>;
  removeRuleFromTrade: (tradeRuleId: string) => Promise<void>;
}

export const useRuleStore = create<RuleState>((set, get) => ({
  rules: [],
  ruleStats: null,
  isLoading: false,
  error: null,

  fetchRules: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/rules');
      set({ rules: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createRule: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/rules', data);
      await get().fetchRules();
      await get().fetchRuleStats();
      return true;
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      return false;
    }
  },

  updateRule: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/rules/${id}`, data);
      await get().fetchRules();
      await get().fetchRuleStats();
      return true;
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      return false;
    }
  },

  deleteRule: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/rules/${id}`);
      await get().fetchRules();
      await get().fetchRuleStats();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  toggleRuleActive: async (id, currentStatus) => {
    await get().updateRule(id, { isActive: !currentStatus });
  },

  fetchRuleStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/rules/stats');
      set({ ruleStats: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  attachRuleToTrade: async (tradeId, ruleId) => {
    try {
      await api.post('/rules/trade-rules', { tradeId, ruleId });
    } catch (error: any) {
      console.error(error);
    }
  },

  removeRuleFromTrade: async (tradeRuleId) => {
    try {
      await api.delete(`/rules/trade-rules/${tradeRuleId}`);
    } catch (error: any) {
      console.error(error);
    }
  }
}));
