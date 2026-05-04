import React, { useState, useEffect } from 'react';
import { useTradeStore } from '../store/tradeStore';
import TradeForm from '../components/TradeForm';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { 
  Plus, Edit2, Trash2, ArrowUpRight, ArrowDownRight, 
  Calendar, Search, Filter, RotateCcw, Download,
  Activity, Target, TrendingUp, TrendingDown, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Journal() {
  const { trades, isLoading, fetchTrades, deleteTrade, fetchTradeById } = useTradeStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<any>(null);
  
  // Detail modal state
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<any>(null);
  
  // Filters
  const [filterPair, setFilterPair] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleFetchFiltered = () => {
    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (filterPair) filters.pair = filterPair;
    fetchTrades(filters);
  };

  useEffect(() => {
    handleFetchFiltered();
  }, [fetchTrades]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilterPair('');
    setFilterDirection('');
    fetchTrades({});
  };

  const handleExport = () => {
    if (!trades || trades.length === 0) {
      alert('Tidak ada data untuk di-export');
      return;
    }

    // Header kolom CSV
    const headers = [
      'Date',
      'Pair',
      'Direction',
      'Entry Price',
      'Exit Price',
      'Position Size',
      'Margin',
      'PnL (USD)',
      'PnL (%)',
      'Stop Loss',
      'Take Profit',
      'Result',
      'Notes'
    ];

    // Baris data
    const rows = trades.map(trade => [
      trade.openTime ? new Date(trade.openTime).toLocaleDateString('id-ID') : '',
      trade.pair || '',
      trade.direction || '',
      trade.entryPrice ?? '',
      trade.exitPrice ?? '',
      trade.positionSize ?? '',
      trade.margin ?? '',
      trade.pnl ?? '',
      trade.pnlPercent ? `${trade.pnlPercent.toFixed(2)}%` : '',
      trade.slPrice ?? '',
      trade.tpPrice ?? '',
      trade.pnl > 0 ? 'WIN' : trade.pnl < 0 ? 'LOSS' : 'BE',
      // Escape koma dan quote dalam notes
      trade.notes ? `"${String(trade.notes).replace(/"/g, '""')}"` : ''
    ]);

    // Gabungkan header + rows
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    // Tambahkan BOM untuk Excel agar UTF-8 terbaca dengan benar
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0]; // format: YYYY-MM-DD
    link.href = url;
    link.download = `journey-trades-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleViewDetail = async (tradeId: string) => {
    try {
      const trade = await fetchTradeById(tradeId);
      setSelectedTrade(trade);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch trade details:', error);
    }
  };

  const handleDelete = async (trade: any) => {
    setTradeToDelete(trade);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (tradeToDelete) {
      await deleteTrade(tradeToDelete.id);
      setTradeToDelete(null);
    }
  };

  const handleEdit = (trade: any) => {
    setEditingTrade(trade);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTrade(null);
  };

  const displayedTrades = trades.filter(t => filterDirection ? t.direction === filterDirection : true);
  
  let winCount = 0;
  let totalWinAmount = 0;
  let lossCount = 0;
  let totalLossAmount = 0;

  displayedTrades.forEach(t => {
    const pnl = t.pnl || 0;
    if (pnl > 0) {
      winCount++;
      totalWinAmount += pnl;
    } else if (pnl < 0) {
      lossCount++;
      totalLossAmount += Math.abs(pnl);
    }
  });

  const winRate = displayedTrades.length > 0 ? (winCount / displayedTrades.length) * 100 : 0;
  const avgWin = winCount > 0 ? totalWinAmount / winCount : 0;
  const avgLoss = lossCount > 0 ? totalLossAmount / lossCount : 0;
  const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : (totalWinAmount > 0 ? 999 : 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Trade Journal</h1>
          <p className="text-sm text-slate-400 mt-1">Manage and analyze your trading history</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-5 py-2.5 rounded-lg flex items-center transition-all shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Trade
        </button>
      </div>

      {/* 3.1 Filter Bar */}
      <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg shadow-slate-900/50 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Start Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-600 outline-none transition-all duration-200" 
            />
          </div>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">End Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-600 outline-none transition-all duration-200" 
            />
          </div>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Pair</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input 
              type="text" 
              placeholder="e.g. BTC/USDT" 
              value={filterPair} 
              onChange={e => setFilterPair(e.target.value)} 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-600 outline-none transition-all duration-200" 
            />
          </div>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Direction</label>
          <select 
            value={filterDirection} 
            onChange={e => setFilterDirection(e.target.value)} 
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-600 outline-none transition-all duration-200"
          >
            <option value="">All Directions</option>
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button 
            onClick={handleFetchFiltered}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button 
            onClick={handleResetFilters}
            className="flex-1 sm:flex-none bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none border border-slate-700 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </motion.div>

      {/* 3.2 Summary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg shadow-slate-900/50 hover:shadow-xl transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-slate-400 text-xs font-medium">Total Trades</p>
          </div>
          <p className="text-2xl font-bold text-slate-100">{displayedTrades.length}</p>
        </div>
        
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg shadow-slate-900/50 hover:shadow-xl transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-slate-400 text-xs font-medium">Win Rate</p>
          </div>
          <p className="text-2xl font-bold text-slate-100">{winRate.toFixed(1)}%</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg shadow-slate-900/50 hover:shadow-xl transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-slate-400 text-xs font-medium">Avg Win</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">+${avgWin.toFixed(2)}</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg shadow-slate-900/50 hover:shadow-xl transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-slate-400 text-xs font-medium">Avg Loss</p>
          </div>
          <p className="text-2xl font-bold text-red-400">-${avgLoss.toFixed(2)}</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg shadow-slate-900/50 hover:shadow-xl transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-slate-400 text-xs font-medium">Profit Factor</p>
          </div>
          <p className="text-2xl font-bold text-slate-100">{profitFactor === 999 ? '∞' : profitFactor.toFixed(2)}</p>
        </div>
      </motion.div>

      {/* 3.3 Trades Table */}
      <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg shadow-slate-900/50 overflow-hidden">
        {isLoading && trades.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-400">Loading your journey...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap text-sm">
              <thead className="bg-slate-900/80 border-b border-slate-700/80 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Pair</th>
                  <th className="px-6 py-4 font-semibold">Direction</th>
                  <th className="px-6 py-4 font-semibold">Entry</th>
                  <th className="px-6 py-4 font-semibold">SL</th>
                  <th className="px-6 py-4 font-semibold">TP</th>
                  <th className="px-6 py-4 font-semibold">Exit</th>
                  <th className="px-6 py-4 font-semibold text-right">PnL</th>
                  <th className="px-6 py-4 font-semibold">Strategy</th>
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {displayedTrades.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 mb-4">
                        <Search className="w-8 h-8 text-slate-600" />
                      </div>
                      <h3 className="text-slate-200 font-medium text-lg mb-1">No Trades Found</h3>
                      <p className="text-slate-500">Adjust your filters or add a new trade to get started.</p>
                    </td>
                  </tr>
                ) : (
                  displayedTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-slate-700/40 transition-colors group">
                      <td className="px-6 py-4 text-slate-400">
                        <div className="flex flex-col">
                          <span className="text-slate-300">{new Date(trade.openTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="text-xs">{new Date(trade.openTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-200">{trade.pair}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                          trade.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {trade.direction === 'LONG' ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                          {trade.direction}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">{trade.entryPrice}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">{trade.slPrice || '-'}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">{trade.tpPrice || '-'}</td>
                      <td className="px-6 py-4 font-mono text-slate-300">{trade.exitPrice || '-'}</td>
                      <td className={`px-6 py-4 text-right font-mono font-bold ${trade.pnl && trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trade.pnl && trade.pnl > 0 ? '+' : ''}{trade.pnl?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-900 text-slate-400 text-xs font-medium">
                          {trade.strategy || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(trade)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleViewDetail(trade.id)} className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-md transition-colors" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(trade)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* 3.4 Trade Form Modal (Existing Redesigned Component) */}
      {isFormOpen && <TradeForm onClose={handleCloseForm} tradeToEdit={editingTrade} />}

      {/* Trade Detail Modal */}
      {isDetailModalOpen && selectedTrade && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTrade(null);
          }}
          title={`Detail Trade — ${selectedTrade.pair}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Trade Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Pair" value={selectedTrade.pair} />
              <DetailRow 
                label="Direction" 
                value={
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                    selectedTrade.direction === 'LONG' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {selectedTrade.direction === 'LONG' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {selectedTrade.direction}
                  </span>
                }
              />
              <DetailRow 
                label="Open Time" 
                value={new Date(selectedTrade.openTime).toLocaleString('id-ID', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })} 
              />
              <DetailRow 
                label="Close Time" 
                value={selectedTrade.exitTime ? new Date(selectedTrade.exitTime).toLocaleString('id-ID', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : '—'} 
              />
            </div>

            {/* Price Info */}
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Price Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Entry Price" value={`$${selectedTrade.entryPrice}`} />
                <DetailRow label="Exit Price" value={selectedTrade.exitPrice ? `$${selectedTrade.exitPrice}` : '—'} />
                <DetailRow label="Stop Loss" value={selectedTrade.slPrice ? `$${selectedTrade.slPrice}` : '—'} />
                <DetailRow label="Take Profit" value={selectedTrade.tpPrice ? `$${selectedTrade.tpPrice}` : '—'} />
              </div>
            </div>

            {/* Position & PnL */}
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Position & Result</h3>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Position Size" value={selectedTrade.positionSize ? `${selectedTrade.positionSize}` : '—'} />
                <DetailRow label="Margin" value={selectedTrade.margin ? `$${selectedTrade.margin}` : '—'} />
                <DetailRow 
                  label="PnL" 
                  value={`$${selectedTrade.pnl?.toFixed(2) ?? '—'}`}
                  highlight={selectedTrade.pnl > 0 ? 'green' : selectedTrade.pnl < 0 ? 'red' : undefined}
                />
                <DetailRow 
                  label="PnL %" 
                  value={selectedTrade.pnlPercent ? `${selectedTrade.pnlPercent.toFixed(2)}%` : '—'}
                  highlight={selectedTrade.pnl > 0 ? 'green' : selectedTrade.pnl < 0 ? 'red' : undefined}
                />
              </div>
            </div>

            {/* Strategy & Notes */}
            {(selectedTrade.strategy || selectedTrade.notes) && (
              <div className="border-t border-slate-700 pt-4">
                {selectedTrade.strategy && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-slate-400">Strategy</span>
                    <p className="mt-1 text-slate-200">{selectedTrade.strategy}</p>
                  </div>
                )}
                {selectedTrade.notes && (
                  <div>
                    <span className="text-sm font-medium text-slate-400">Notes</span>
                    <p className="mt-1 text-slate-300 whitespace-pre-wrap">{selectedTrade.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Screenshot */}
            {selectedTrade.screenshotUrl && (
              <div className="border-t border-slate-700 pt-4">
                <span className="text-sm font-medium text-slate-400 block mb-2">Screenshot</span>
                <img 
                  src={selectedTrade.screenshotUrl} 
                  alt="Trade screenshot" 
                  className="w-full rounded-lg border border-slate-700"
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTradeToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Trade"
        message={
          tradeToDelete
            ? `Are you sure you want to delete this trade? ${tradeToDelete.pair} ${tradeToDelete.direction} on ${new Date(tradeToDelete.openTime).toLocaleDateString()}. This action cannot be undone.`
            : 'Are you sure you want to delete this trade?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </motion.div>
  );
}

// Helper component for detail rows
const DetailRow = ({ label, value, highlight }: { label: string; value: any; highlight?: 'green' | 'red' }) => (
  <div className="space-y-1">
    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
    <div className={`text-sm font-medium ${
      highlight === 'green' ? 'text-emerald-400' : 
      highlight === 'red' ? 'text-red-400' : 
      'text-slate-200'
    }`}>
      {value}
    </div>
  </div>
);
