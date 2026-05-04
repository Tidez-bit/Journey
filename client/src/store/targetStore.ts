import { create } from 'zustand';
import api from '../lib/api';

interface Target {
  id: string;
  type: string;
  name: string;
  startBalance: number;
  targetBalance: number;
  dailyPercent: number | null;
  deadline: string | null;
  isActive: boolean;
  dailyTargetLogs?: any[];
}

interface TargetState {
  targets: Target[];
  dailyLogs: any[];
  projection: any;
  isLoading: boolean;
  error: string | null;
  fetchTargets: () => Promise<void>;
  createTarget: (data: any) => Promise<void>;
  updateTarget: (id: string, data: any) => Promise<void>;
  deleteTarget: (id: string) => Promise<void>;
  fetchDailyLogs: (startDate?: string, endDate?: string) => Promise<void>;
  createDailyLog: (data: any) => Promise<void>;
  fetchProjection: (startBalance: number, dailyPercent: number, days: number) => Promise<void>;
}

export const useTargetStore = create<TargetState>((set, get) => ({
  targets: [],
  dailyLogs: [],
  projection: null,
  isLoading: false,
  error: null,
  
  fetchTargets: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/targets');
      set({ targets: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createTarget: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/targets', data);
      await get().fetchTargets();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateTarget: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/targets/${id}`, data);
      await get().fetchTargets();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteTarget: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/targets/${id}`);
      await get().fetchTargets();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchDailyLogs: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const response = await api.get(`/targets/daily-logs?${params.toString()}`);
      set({ dailyLogs: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createDailyLog: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/targets/daily-logs', data);
      await get().fetchDailyLogs();
      await get().fetchTargets();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchProjection: async (startBalance, dailyPercent, days) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/targets/projection?startBalance=${startBalance}&dailyPercent=${dailyPercent}&days=${days}`);
      set({ projection: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  }
}));
