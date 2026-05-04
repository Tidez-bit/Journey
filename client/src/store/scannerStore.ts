import { create } from 'zustand';
import api from '../lib/api';

interface ScannerState {
  scanners: any[];
  selectedDate: string;
  selectedTimeframe: string;
  watchlist: string[];
  realTimePrices: Record<string, any>;
  isLoading: boolean;
  setWatchlist: (pairs: string[]) => void;
  setTimeframe: (tf: string) => void;
  setSelectedDate: (date: string) => void;
  fetchScanners: (date: string, timeframe: string) => Promise<void>;
  createScanner: (formData: any) => Promise<any>;
  connectWebSocket: () => WebSocket;
  setRealTimePrices: (prices: Record<string, any>) => void;
}

export const useScannerStore = create<ScannerState>((set, get) => ({
  scanners: [],
  selectedDate: new Date().toISOString().split('T')[0],
  selectedTimeframe: '4H',
  watchlist: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT'],
  realTimePrices: {},
  isLoading: false,

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
  }
}));
