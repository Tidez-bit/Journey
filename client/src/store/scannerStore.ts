import { create } from 'zustand';
import api from '../lib/api';

interface WatchlistItem {
  id: string;
  userId: string;
  pair: string;
  order: number;
  createdAt: string;
}

interface ScannerState {
  scanners: any[];
  selectedDate: string;
  selectedTimeframe: string;
  watchlist: string[];
  watchlistItems: WatchlistItem[];
  realTimePrices: Record<string, any>;
  isLoading: boolean;
  fetchWatchlist: () => Promise<void>;
  addToWatchlist: (pair: string) => Promise<void>;
  removeFromWatchlist: (pair: string) => Promise<void>;
  setWatchlist: (pairs: string[]) => void;
  setTimeframe: (tf: string) => void;
  setSelectedDate: (date: string) => void;
  fetchScanners: (date: string, timeframe: string) => Promise<void>;
  createScanner: (formData: any) => Promise<any>;
  connectWebSocket: () => WebSocket;
  setRealTimePrices: (prices: Record<string, any>) => void;
  saveNote: (pair: string, timeframe: string, note: string) => Promise<void>;
  loadNotes: () => Promise<any[]>;
  analyzePair: (pair: string, timeframe: string) => Promise<any>;
}

export const useScannerStore = create<ScannerState>((set, get) => ({
  scanners: [],
  selectedDate: new Date().toISOString().split('T')[0],
  selectedTimeframe: '4H',
  watchlist: [],
  watchlistItems: [],
  realTimePrices: {},
  isLoading: false,

  fetchWatchlist: async () => {
    try {
      const { data } = await api.get('/watchlist');
      const pairs = data.map((item: WatchlistItem) => item.pair);
      set({ watchlistItems: data, watchlist: pairs });
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
      // Fallback to default watchlist if API fails
      set({ watchlist: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT'] });
    }
  },

  addToWatchlist: async (pair: string) => {
    try {
      const { data } = await api.post('/watchlist', { pair });
      set((state) => ({
        watchlistItems: [...state.watchlistItems, data],
        watchlist: [...state.watchlist, pair],
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add to watchlist');
    }
  },

  removeFromWatchlist: async (pair: string) => {
    try {
      await api.delete(`/watchlist/${encodeURIComponent(pair)}`);
      set((state) => ({
        watchlistItems: state.watchlistItems.filter((item) => item.pair !== pair),
        watchlist: state.watchlist.filter((p) => p !== pair),
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to remove from watchlist');
    }
  },

  setWatchlist: (pairs) => set({ watchlist: pairs }),
  setTimeframe: (tf) => set({ selectedTimeframe: tf }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  setRealTimePrices: (prices) => set({ realTimePrices: prices }),

  fetchScanners: async (date, timeframe) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/scanner?date=${date}&timeframe=${timeframe}`);
      set({ scanners: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  connectWebSocket: () => {
    const wsUrl = import.meta.env.MODE === 'production' 
      ? `wss://${window.location.host}/ws/prices`
      : 'ws://localhost:5000/ws/prices';
      
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const prices = JSON.parse(event.data);
        get().setRealTimePrices(prices);
      } catch (e) {
        // ignore
      }
    };
    return ws;
  },

  createScanner: async (formData) => {
    const { data } = await api.post('/scanner', formData);
    set((state) => ({ scanners: [data, ...state.scanners.filter(s => s.id !== data.id)] }));
    return data;
  },

  saveNote: async (pair, timeframe, note) => {
    await api.patch('/scanner/notes', { pair, timeframe, note });
    // Update local state if scanner exists
    set((state) => ({
      scanners: state.scanners.map(s => 
        s.pair === pair && s.timeframe === timeframe 
          ? { ...s, notes: note }
          : s
      )
    }));
  },

  loadNotes: async () => {
    try {
      const { data } = await api.get('/scanner/notes');
      return data.data || [];
    } catch (error) {
      return [];
    }
  },

  analyzePair: async (pair, timeframe) => {
    const { data } = await api.post('/scanner/analyze', { pair, timeframe });
    return data.data;
  }
}));
