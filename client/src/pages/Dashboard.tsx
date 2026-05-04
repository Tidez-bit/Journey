import React, { useEffect, useState } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import EquityChart from '../components/EquityChart';
import { 
  Wallet, Activity, Target, Flame, Shield, 
  Settings, TrendingUp, TrendingDown, ArrowRightLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { stats, isLoading, fetchDashboardStats } = useDashboardStore();
  const [isMaxLossModalOpen, setIsMaxLossModalOpen] = useState(false);
  const [maxLossData, setMaxLossData] = useState({ type: 'FIXED', value: 0 });

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  useEffect(() => {
    if (stats) {
      setMaxLossData({ type: stats.maxLossType, value: stats.maxLossValue });
    }
  }, [stats]);

  const handleSaveMaxLoss = async (e: React.FormEvent) => {
    e.preventDefault();
    await useDashboardStore.getState().updateSettings({ maxLossType: maxLossData.type, maxLossValue: maxLossData.value });
    setIsMaxLossModalOpen(false);
  };

  const getRiskStatus = () => {
    if (!stats || stats.maxLossValue <= 0) return { percent: 0, limit: 0, color: 'bg-slate-600', text: 'text-slate-400', label: 'Not Set' };
    const limit = stats.maxLossType === 'PERCENTAGE' ? (stats.currentBalance * stats.maxLossValue / 100) : stats.maxLossValue;
    if (limit <= 0) return { percent: 0, limit: 0, color: 'bg-slate-600', text: 'text-slate-400', label: 'Not Set' };
    
    const percent = Math.min(100, (stats.maxLossUsed / limit) * 100);
    if (percent >= 100) return { percent, limit, color: 'bg-red-500', text: 'text-red-500', label: 'Limit Reached ⚠️' };
    if (percent >= 90) return { percent, limit, color: 'bg-amber-500', text: 'text-amber-500', label: 'Critical' };
    if (percent >= 80) return { percent, limit, color: 'bg-amber-400', text: 'text-amber-400', label: 'Warning' };
    return { percent, limit, color: 'bg-emerald-500', text: 'text-emerald-500', label: 'Safe ✅' };
  };

  if (isLoading || !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  const risk = getRiskStatus();

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      
      {/* 2.1 Stats Cards (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Balance Card */}
        <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg shadow-slate-900/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all" />
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-slate-400 font-medium text-sm">Current Balance</h3>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4 text-slate-100 relative z-10">
            ${stats.currentBalance.toFixed(2)}
          </p>
        </motion.div>

        {/* PnL Card */}
        <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg shadow-slate-900/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all group relative overflow-hidden">
          <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-xl transition-all ${stats.totalPnL >= 0 ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}`} />
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-slate-400 font-medium text-sm">Total PnL</h3>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.totalPnL >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <Activity className={`w-5 h-5 ${stats.totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            </div>
          </div>
          <div className="mt-4 flex items-end gap-2 relative z-10">
            <p className={`text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
            </p>
            {stats.profitFactor > 0 && (
              <p className="text-sm font-medium text-slate-500 mb-1">PF: {stats.profitFactor.toFixed(2)}</p>
            )}
          </div>
        </motion.div>

        {/* Win Rate Card */}
        <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg shadow-slate-900/50 hover:shadow-xl hover:shadow-cyan-500/10 transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all" />
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-slate-400 font-medium text-sm">Win Rate</h3>
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-cyan-500" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <p className="text-3xl font-bold text-slate-100">{stats.winRate.toFixed(1)}%</p>
            <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-3 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.winRate}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="bg-cyan-500 h-1.5 rounded-full" 
              />
            </div>
          </div>
        </motion.div>

        {/* Total Trades Card */}
        <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg shadow-slate-900/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all" />
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-slate-400 font-medium text-sm">Total Trades</h3>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4 text-slate-100 relative z-10">
            {stats.totalTrades}
          </p>
        </motion.div>

      </div>

      {/* 2.2 Equity Curve Chart */}
      <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg shadow-slate-900/50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-100">Equity Curve</h2>
          <div className="flex items-center bg-slate-900/50 rounded-lg p-1 border border-slate-700/50">
            {/* Note: Filters are mock for UI purposes */}
            {['1W', '1M', '3M', '1Y', 'ALL'].map((f, i) => (
              <button key={f} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${i === 4 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px] w-full">
          <EquityChart data={stats.equityCurve} />
        </div>
      </motion.div>

      {/* 2.3 Win Streak & Best/Worst & Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Win Streak */}
        <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
          <Flame className="w-8 h-8 text-orange-500 mb-3" />
          <p className="text-3xl font-bold text-slate-100">{stats.winStreak} <span className="text-base font-medium text-slate-500">days</span></p>
          <p className="text-xs text-slate-400 mt-2">Active Win Streak (Best: {stats.maxWinStreak})</p>
        </motion.div>

        {/* Best Trade */}
        <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
          <TrendingUp className="w-8 h-8 text-emerald-500 mb-3" />
          <p className="text-3xl font-bold text-emerald-400">+${stats.bestTrade.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-2">Best Trade (PnL)</p>
        </motion.div>

        {/* Worst Trade */}
        <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
          <TrendingDown className="w-8 h-8 text-red-500 mb-3" />
          <p className="text-3xl font-bold text-red-400">-${Math.abs(stats.worstTrade).toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-2">Worst Trade (PnL)</p>
        </motion.div>

        {/* Daily Max Loss (Kept from existing features for logic integrity) */}
        <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-xl p-6 relative">
          <div className="absolute top-4 right-4">
            <button onClick={() => setIsMaxLossModalOpen(true)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-900/50 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Shield className={`w-5 h-5 ${risk.text}`} />
            <h3 className="text-slate-300 font-medium text-sm">Risk Manager</h3>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <p className="text-2xl font-bold text-slate-100">${stats.maxLossUsed.toFixed(2)}</p>
            <p className="text-sm text-slate-500 mb-1">/ ${risk.limit.toFixed(2)} Limit</p>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 mb-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} animate={{ width: `${risk.percent}%` }} transition={{ duration: 1 }}
              className={`${risk.color} h-2 rounded-full shadow-[0_0_10px_currentColor]`} 
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold ${risk.text}`}>{risk.label}</span>
            <span className="text-xs text-slate-500 font-mono">{risk.percent.toFixed(1)}%</span>
          </div>
        </motion.div>
      </div>

      {/* 2.4 Recent Trades Table */}
      <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg shadow-slate-900/50 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-bold text-slate-100">Recent Trades</h2>
          <Link to="/journal" className="text-sm font-medium text-blue-500 hover:text-blue-400 flex items-center gap-1 group">
            View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Pair</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Entry</th>
                <th className="px-6 py-4 font-semibold">Exit</th>
                <th className="px-6 py-4 font-semibold text-right">PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {stats.recentTrades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No recent trades found.</td>
                </tr>
              ) : (
                stats.recentTrades.map((trade: any) => (
                  <tr key={trade.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {new Date(trade.openTime || trade.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-200">
                      {trade.pair}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
                        trade.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-300">
                      {trade.entryPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-300">
                      {trade.exitPrice || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold">
                      <span className={trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {trade.pnl > 0 ? '+' : ''}{trade.pnl?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Max Loss Settings Modal */}
      {isMaxLossModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl shadow-slate-900/80"
          >
            <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" /> Risk Settings
            </h3>
            <form onSubmit={handleSaveMaxLoss} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Limit Type</label>
                <select value={maxLossData.type} onChange={e => setMaxLossData({...maxLossData, type: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-600 outline-none transition-all duration-200">
                  <option value="FIXED">Fixed Amount (USDT)</option>
                  <option value="PERCENTAGE">Percentage of Balance (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Daily Limit Value</label>
                <div className="relative">
                  <input type="number" step="any" required value={maxLossData.value} onChange={e => setMaxLossData({...maxLossData, value: Number(e.target.value)})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 pl-8 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-600 outline-none transition-all duration-200" />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{maxLossData.type === 'FIXED' ? '$' : '%'}</span>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setIsMaxLossModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/25">Save Settings</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
