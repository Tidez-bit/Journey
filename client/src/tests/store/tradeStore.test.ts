import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTradeStore } from '../../store/tradeStore';
import api from '../../lib/api';

// Mock the api module
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock trade factory
const mockTrade = (overrides = {}) => ({
  id: 'trade-1',
  openTime: '2024-01-01T10:00:00Z',
  pair: 'BTCUSDT',
  direction: 'LONG' as const,
  entryPrice: 50000,
  exitPrice: 51000,
  pnl: 100,
  margin: 1000,
  pnlPercent: 10,
  isRuleViolated: false,
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
  ...overrides,
});

describe('tradeStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
      useTradeStore.setState({
        trades: [],
        pagination: null,
        currentTrade: null,
        isLoading: false,
        error: null,
      });
    });
    
    vi.clearAllMocks();
  });

  it('should have initial state with trades = [], isLoading = false', () => {
    const { result } = renderHook(() => useTradeStore());

    expect(result.current.trades).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.currentTrade).toBeNull();
  });

  it('should set trades array with fetchTrades', async () => {
    const mockTrades = [
      mockTrade({ id: 'trade-1', pnl: 100 }),
      mockTrade({ id: 'trade-2', pnl: 200 }),
    ];

    vi.mocked(api.get).mockResolvedValueOnce({
      data: mockTrades,
    });

    const { result } = renderHook(() => useTradeStore());

    await act(async () => {
      await result.current.fetchTrades();
    });

    expect(result.current.trades).toEqual(mockTrades);
    expect(result.current.trades.length).toBe(2);
    expect(result.current.isLoading).toBe(false);
  });

  it('should set isLoading = true during fetchTrades', async () => {
    vi.mocked(api.get).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100))
    );

    const { result } = renderHook(() => useTradeStore());

    act(() => {
      result.current.fetchTrades();
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should create trade and refresh trades list', async () => {
    const newTrade = mockTrade({ id: 'trade-new', pnl: 150 });

    vi.mocked(api.post).mockResolvedValueOnce({ data: newTrade });
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [newTrade],
    });

    const { result } = renderHook(() => useTradeStore());

    let success = false;
    await act(async () => {
      success = await result.current.createTrade({
        pair: 'BTCUSDT',
        direction: 'LONG',
        entryPrice: 50000,
        exitPrice: 51000,
        pnl: 150,
      });
    });

    expect(success).toBe(true);
    expect(api.post).toHaveBeenCalledWith('/trades', expect.any(Object));
    expect(api.get).toHaveBeenCalled(); // fetchTrades called after create
  });

  it('should update trade and refresh trades list', async () => {
    const initialTrades = [
      mockTrade({ id: 'trade-1', pnl: 100 }),
      mockTrade({ id: 'trade-2', pnl: 200 }),
    ];

    const updatedTrades = [
      mockTrade({ id: 'trade-1', pnl: 150 }), // Updated
      mockTrade({ id: 'trade-2', pnl: 200 }),
    ];

    // Initial fetch
    vi.mocked(api.get).mockResolvedValueOnce({ data: initialTrades });

    const { result } = renderHook(() => useTradeStore());

    await act(async () => {
      await result.current.fetchTrades();
    });

    expect(result.current.trades[0].pnl).toBe(100);

    // Update trade
    vi.mocked(api.put).mockResolvedValueOnce({ data: updatedTrades[0] });
    vi.mocked(api.get).mockResolvedValueOnce({ data: updatedTrades });

    await act(async () => {
      await result.current.updateTrade('trade-1', { pnl: 150 });
    });

    expect(api.put).toHaveBeenCalledWith('/trades/trade-1', { pnl: 150 });
    expect(result.current.trades[0].pnl).toBe(150);
  });

  it('should delete trade and refresh trades list', async () => {
    const initialTrades = [
      mockTrade({ id: 'trade-1', pnl: 100 }),
      mockTrade({ id: 'trade-2', pnl: 200 }),
    ];

    const tradesAfterDelete = [
      mockTrade({ id: 'trade-2', pnl: 200 }),
    ];

    // Initial fetch
    vi.mocked(api.get).mockResolvedValueOnce({ data: initialTrades });

    const { result } = renderHook(() => useTradeStore());

    await act(async () => {
      await result.current.fetchTrades();
    });

    expect(result.current.trades.length).toBe(2);

    // Delete trade
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { success: true } });
    vi.mocked(api.get).mockResolvedValueOnce({ data: tradesAfterDelete });

    await act(async () => {
      await result.current.deleteTrade('trade-1');
    });

    expect(api.delete).toHaveBeenCalledWith('/trades/trade-1');
    expect(result.current.trades.length).toBe(1);
    expect(result.current.trades[0].id).toBe('trade-2');
  });

  it('should not find deleted trade in array after deleteTrade', async () => {
    const initialTrades = [
      mockTrade({ id: 'trade-1', pnl: 100 }),
      mockTrade({ id: 'trade-2', pnl: 200 }),
    ];

    const tradesAfterDelete = [
      mockTrade({ id: 'trade-2', pnl: 200 }),
    ];

    // Initial fetch
    vi.mocked(api.get).mockResolvedValueOnce({ data: initialTrades });

    const { result } = renderHook(() => useTradeStore());

    await act(async () => {
      await result.current.fetchTrades();
    });

    // Delete trade
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { success: true } });
    vi.mocked(api.get).mockResolvedValueOnce({ data: tradesAfterDelete });

    await act(async () => {
      await result.current.deleteTrade('trade-1');
    });

    const deletedTrade = result.current.trades.find(t => t.id === 'trade-1');
    expect(deletedTrade).toBeUndefined();
  });

  it('should set currentTrade with setCurrentTrade', () => {
    const { result } = renderHook(() => useTradeStore());
    
    const trade = mockTrade({ id: 'trade-123' });

    act(() => {
      result.current.setCurrentTrade(trade);
    });

    expect(result.current.currentTrade).toEqual(trade);
  });

  it('should fetch trade by id with fetchTradeById', async () => {
    const trade = mockTrade({ id: 'trade-123', pnl: 250 });

    vi.mocked(api.get).mockResolvedValueOnce({ data: trade });

    const { result } = renderHook(() => useTradeStore());

    let fetchedTrade;
    await act(async () => {
      fetchedTrade = await result.current.fetchTradeById('trade-123');
    });

    expect(fetchedTrade).toEqual(trade);
    expect(result.current.currentTrade).toEqual(trade);
    expect(api.get).toHaveBeenCalledWith('/trades/trade-123');
  });

  it('should handle error on failed fetchTrades', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTradeStore());

    await act(async () => {
      await result.current.fetchTrades();
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle error on failed createTrade', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { data: { message: 'Validation error' } }
    });

    const { result } = renderHook(() => useTradeStore());

    let success = false;
    await act(async () => {
      success = await result.current.createTrade({});
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Validation error');
  });
});
