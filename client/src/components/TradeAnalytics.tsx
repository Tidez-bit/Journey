import React, { useEffect, useState } from 'react';
import { useTradeStore } from '../store/tradeStore';
import { Card } from './ui/Card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Target, Activity, DollarSign, 
  BarChart3, Calendar, Clock, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function TradeAnalytics() {
  const { analytics, fetchAnalytics, isLoading } = useTradeStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchAnalytics({ startDate, endDate });
  }, [startDate, endDate, fetchAnalytics]);

  if (isLoading && !analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analytics) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Date Filters */}
      <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
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
        <div className="flex-1 min-w-[200px]">
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
        <button
          onClick={() => {
            setStartDate('');
            setEndDate('');
          }}
          className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
        >
          Reset
        </button>
      </motion.div>

      {/* Metrics Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Trades</p>
              <p className="text-2xl font-bold text-slate-100">{analytics.metrics.totalTrades}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Win Rate</p>
              <p className="text-2xl font-bold text-slate-100">{analytics.metrics.winRate.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Profit Factor</p>
              <p className="text-2xl font-bold text-slate-100">
                {analytics.metrics.profitFactor === Infinity ? '∞' : analytics.metrics.profitFactor.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Avg Win</p>
              <p className="text-2xl font-bold text-emerald-400">+${analytics.metrics.avgWin.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Avg Loss</p>
              <p className="text-2xl font-bold text-red-400">-${analytics.metrics.avgLoss.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Running</p>
              <p className="text-2xl font-bold text-yellow-400">{analytics.metrics.runningTrades}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Closed</p>
              <p className="text-2xl font-bold text-emerald-400">{analytics.metrics.closedTrades}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* PnL per Pair Chart */}
      {analytics.pnlPerPair.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-400" />
              PnL per Pair
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.pnlPerPair}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="pair" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  formatter={(value: any) => [`$${value.toFixed(2)}`, 'PnL']}
                />
                <Bar dataKey="pnl" radius={[8, 8, 0, 0]}>
                  {analytics.pnlPerPair.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* Win Rate per Strategy Chart */}
      {analytics.winRatePerStrategy.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Win Rate per Strategy
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.winRatePerStrategy} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis dataKey="strategy" type="category" stroke="#94a3b8" style={{ fontSize: '12px' }} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  formatter={(value: any, name: string, props: any) => [
                    `${value.toFixed(1)}% (${props.payload.totalTrades} trades)`, 
                    'Win Rate'
                  ]}
                />
                <Bar dataKey="winRate" fill="#06b6d4" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* Trade Distribution Heatmap */}
      {analytics.tradeDistribution.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Trade Distribution (Last 30 Days)
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {analytics.tradeDistribution.map((day) => {
                const intensity = Math.min(day.count / 5, 1); // Max intensity at 5 trades
                return (
                  <div
                    key={day.date}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center p-2 border border-slate-700 transition-all hover:scale-105 cursor-pointer"
                    style={{
                      backgroundColor: `rgba(34, 197, 94, ${intensity * 0.5})`,
                    }}
                    title={`${day.date}: ${day.count} trade${day.count !== 1 ? 's' : ''}`}
                  >
                    <div className="text-xs text-slate-400">{new Date(day.date).getDate()}</div>
                    <div className="text-sm font-bold text-slate-200">{day.count}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500/10 border border-slate-700"></div>
                <span>Less</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500/50 border border-slate-700"></div>
                <span>More</span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {analytics.metrics.totalTrades === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-800 border-slate-700 p-12 text-center">
            <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No Data Available</h3>
            <p className="text-slate-500">
              {startDate || endDate 
                ? 'No closed trades found in the selected date range.' 
                : 'Start trading to see your analytics here.'}
            </p>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
