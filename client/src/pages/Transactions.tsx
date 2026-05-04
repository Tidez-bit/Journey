import React, { useState, useEffect } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { useTradeStore } from '../store/tradeStore';
import { ArrowUpRight, ArrowDownRight, Plus, Wallet, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { EnhancedInput } from '../components/ui/EnhancedInput';

export default function Transactions() {
  const { transactions, isLoading: txLoading, fetchTransactions, addTransaction } = useTransactionStore();
  const { trades, fetchTrades } = useTradeStore();
  
  const [type, setType] = useState('DEPOSIT');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchTrades();
  }, [fetchTransactions, fetchTrades]);

  const netDeposit = transactions.reduce((acc, curr) => {
    if (curr.type === 'DEPOSIT') return acc + curr.amount;
    if (curr.type === 'WITHDRAW') return acc - curr.amount;
    return acc;
  }, 0);

  const totalPnL = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const currentBalance = netDeposit + totalPnL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addTransaction({
        type,
        amount: parseFloat(amount),
        note,
        date
      });
      setAmount('');
      setNote('');
    } catch (err: any) {
      setError('Failed to process transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Capital Management</h1>
          <p className="text-sm text-slate-400 mt-1">Manage deposits, withdrawals, and view balance</p>
        </div>
      </div>

      {/* 4.1 Balance Summary */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-slate-900/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-48 h-48 text-blue-500 transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 border-b md:border-b-0 md:border-r border-slate-700/50 pb-6 md:pb-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-slate-400 font-medium">Current Balance</h3>
              </div>
              <p className="text-4xl sm:text-5xl font-bold text-slate-100 tracking-tight">
                ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="col-span-2 grid grid-cols-2 gap-4 items-center">
              <div>
                <p className="text-sm text-slate-400 mb-1 flex items-center gap-1"><ArrowUpRight className="w-4 h-4 text-emerald-400"/> Net Deposit</p>
                <p className="text-2xl font-bold text-slate-200">${netDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1 flex items-center gap-1"><Activity className="w-4 h-4 text-purple-400"/> Total PnL</p>
                <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 4.2 Transaction Form */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg shadow-slate-900/50">
            <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" /> New Transaction
            </h2>
            
            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-6 text-sm">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Transaction Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setType('DEPOSIT')}
                    className={`relative p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      type === 'DEPOSIT' ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <ArrowDownRight className={`w-6 h-6 ${type === 'DEPOSIT' ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className={`font-bold text-sm ${type === 'DEPOSIT' ? 'text-emerald-400' : 'text-slate-400'}`}>DEPOSIT</span>
                  </motion.button>
                  
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setType('WITHDRAW')}
                    className={`relative p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      type === 'WITHDRAW' ? 'bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <ArrowUpRight className={`w-6 h-6 ${type === 'WITHDRAW' ? 'text-red-400' : 'text-slate-500'}`} />
                    <span className={`font-bold text-sm ${type === 'WITHDRAW' ? 'text-red-400' : 'text-slate-400'}`}>WITHDRAW</span>
                  </motion.button>
                </div>
              </div>

              <EnhancedInput 
                label="Amount (USDT)" 
                type="number" 
                step="0.01" min="0.01" 
                required 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0.00"
                className="text-lg font-mono"
              />

              <EnhancedInput 
                label="Date" 
                type="date" 
                required 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />

              <EnhancedInput 
                label="Note (Optional)" 
                type="text" 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                placeholder="e.g. Binance transfer" 
              />

              <motion.button 
                type="submit" 
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className={`w-full py-3 mt-4 rounded-xl font-bold text-white transition-all shadow-lg flex justify-center items-center gap-2 ${
                  isSubmitting ? 'bg-slate-600 cursor-not-allowed' :
                  type === 'DEPOSIT' 
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/25' 
                    : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/25'
                }`}
              >
                {isSubmitting ? 'Processing...' : (
                  <>
                    <Plus className="w-5 h-5" /> 
                    {type === 'DEPOSIT' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* 4.3 Transaction History */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg shadow-slate-900/50 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" /> Transaction History
              </h2>
            </div>
            
            {txLoading && transactions.length === 0 ? (
              <div className="flex-1 p-12 text-center flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-slate-400">Loading records...</p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left whitespace-nowrap text-sm">
                  <thead className="bg-slate-900/80 border-b border-slate-700/80 text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Type</th>
                      <th className="px-6 py-4 font-semibold">Note</th>
                      <th className="px-6 py-4 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 mb-4">
                            <Activity className="w-8 h-8 text-slate-600" />
                          </div>
                          <h3 className="text-slate-200 font-medium text-lg mb-1">No Transactions Yet</h3>
                          <p className="text-slate-500">Record your first deposit to get started.</p>
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-700/40 transition-colors group">
                          <td className="px-6 py-4 text-slate-300">
                            {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                              tx.type === 'DEPOSIT' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {tx.type === 'DEPOSIT' ? <ArrowDownRight className="w-3 h-3 mr-1" /> : <ArrowUpRight className="w-3 h-3 mr-1" />}
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 max-w-[200px] truncate" title={tx.note || ''}>
                            {tx.note || '-'}
                          </td>
                          <td className={`px-6 py-4 text-right font-mono font-bold ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
        
      </div>
    </motion.div>
  );
}
