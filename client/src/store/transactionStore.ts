import { create } from 'zustand';
import api from '../lib/api';

interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW';
  amount: number;
  note: string;
  date: string;
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  addTransaction: (data: { type: string; amount: number; note: string; date: string }) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/transactions');
      set({ transactions: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch transactions', isLoading: false });
    }
  },
  addTransaction: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/transactions', data);
      await get().fetchTransactions();
    } catch (error: any) {
      set({ error: error.message || 'Failed to add transaction', isLoading: false });
      throw error;
    }
  }
}));
