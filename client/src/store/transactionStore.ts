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
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
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
  },
  updateTransaction: async (id: string, data: Partial<Transaction>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/transactions/${id}`, data);
      set(state => ({
        transactions: state.transactions.map(t => 
          t.id === id ? response.data.data : t
        ),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update transaction', isLoading: false });
      throw error;
    }
  },
  deleteTransaction: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/transactions/${id}`);
      set(state => ({
        transactions: state.transactions.filter(t => t.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete transaction', isLoading: false });
      throw error;
    }
  }
}));
