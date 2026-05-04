import React, { useEffect, useState } from 'react';
import { useTargetStore } from '../store/targetStore';
import { useDashboardStore } from '../store/dashboardStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Target as TargetIcon, Calendar, TrendingUp, Settings, Plus, CheckCircle, XCircle, ChevronLeft, ChevronRight, Edit2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../components/ui/Modal';

export default function Targets() {
  const { targets, dailyLogs, projection, fetchTargets, createTarget, updateTarget, fetchDailyLogs, createDailyLog, fetchProjection } = useTargetStore();
  const { stats, fetchDashboardStats } = useDashboardStore();

  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [globalFormData, setGlobalFormData] = useState({ name: 'My Global Target', targetBalance: 10000, startBalance: 1000, deadline: '' });
  
  const [dailyFormData, setDailyFormData] = useState({ dailyPercent: 2 });
  const [isCompounding, setIsCompounding] = useState(true);
  
  const [projectionDays, setProjectionDays] = useState(30);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchTargets();
    fetchDailyLogs();
    fetchDashboardStats();
  }, [fetchTargets, fetchDailyLogs, fetchDashboardStats]);

  const globalTarget = targets.find(t => t.type === 'GLOBAL' && t.isActive);
  const dailyTarget = targets.find(t => t.type === 'DAILY' && t.isActive);

  useEffect(() => {
    if (dailyTarget) {
      setDailyFormData({ dailyPercent: dailyTarget.dailyPercent || 2 });
    }
  }, [dailyTarget]);

  useEffect(() => {
    if (dailyTarget) {
      const startBalance = stats?.currentBalance || dailyTarget.startBalance || 1000;
      fetchProjection(startBalance, dailyTarget.dailyPercent || 2, projectionDays);
    }
  }, [dailyTarget, stats, projectionDays, fetchProjection]);

  const currentBalance = stats?.currentBalance || 0;
  
  // Progress Calculation
  const globalProgress = globalTarget 
    ? Math.min(100, Math.max(0, ((currentBalance - globalTarget.startBalance) / (globalTarget.targetBalance - globalTarget.startBalance)) * 100))
    : 0;

  const daysRemaining = globalTarget?.deadline 
    ? Math.max(0, Math.ceil((new Date(globalTarget.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))
    : null;

  const handleCreateGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (globalTarget) {
      await updateTarget(globalTarget.id, globalFormData);
    } else {
      await createTarget({ ...globalFormData, type: 'GLOBAL' });
    }
    setIsGlobalModalOpen(false);
  };

  const handleSaveDaily = async () => {
    if (dailyTarget) {
      await updateTarget(dailyTarget.id, { dailyPercent: dailyFormData.dailyPercent });
    } else {
      await createTarget({ type: 'DAILY', name: 'Daily Compounding', startBalance: currentBalance, targetBalance: 0, dailyPercent: dailyFormData.dailyPercent });
    }
  };

  const handleCalculateToday = async () => {
    if (!dailyTarget) return alert("Set a daily target first!");
    const today = new Date().toISOString().split('T')[0];
    await createDailyLog({ targetId: dailyTarget.id, date: today });
    alert("Calculated and saved log for today!");
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  // Heatmap generation
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0 = Sun
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarGrid = [...blanks, ...days];

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="show">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Targets & Compounding</h1>
          <p className="text-sm text-slate-400 mt-1">Track your progress and stay consistent</p>
        </div>
        <button onClick={handleCalculateToday} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-5 py-2.5 rounded-lg flex items-center transition-all shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 font-medium">
          <TrendingUp className="w-5 h-5 mr-2" /> Mark Today
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 5.1 Global Target Card */}
        <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-slate-900/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <TargetIcon className="w-48 h-48 text-blue-500 transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <TargetIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">{globalTarget ? globalTarget.name : 'Global Target'}</h2>
                <p className="text-xs text-slate-400">Master Goal Progress</p>
              </div>
            </div>
            <button onClick={() => {
              if (globalTarget) setGlobalFormData({ name: globalTarget.name, targetBalance: globalTarget.targetBalance, startBalance: globalTarget.startBalance, deadline: globalTarget.deadline ? globalTarget.deadline.split('T')[0] : '' });
              setIsGlobalModalOpen(true);
            }} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          
          {globalTarget ? (
            <div className="relative z-10">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Current Balance</p>
                  <p className="text-3xl font-bold text-slate-100">${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400 mb-1">Target</p>
                  <p className="text-xl font-bold text-blue-400">${globalTarget.targetBalance.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                  <span>{globalProgress.toFixed(1)}% Completed</span>
                  <span>${Math.max(0, globalTarget.targetBalance - currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} left</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-4 border border-slate-700/50 shadow-inner overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-1000 relative" style={{ width: `${globalProgress}%` }}>
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] -translate-x-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                <div>
                  <p className="text-xs text-slate-500 font-medium">STARTING BALANCE</p>
                  <p className="text-sm font-semibold text-slate-300">${globalTarget.startBalance.toLocaleString()}</p>
                </div>
                {daysRemaining !== null && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">DEADLINE</p>
                    <p className={`text-sm font-bold ${daysRemaining < 30 ? 'text-orange-400' : 'text-slate-300'}`}>
                      {daysRemaining} days remaining
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 relative z-10 bg-slate-900/30 rounded-xl border border-slate-700/50 border-dashed">
              <TargetIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">You haven't set a master goal yet.</p>
              <button onClick={() => setIsGlobalModalOpen(true)} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg inline-flex items-center transition-colors">
                <Plus className="w-4 h-4 mr-2"/> Set Target
              </button>
            </div>
          )}
        </motion.div>

        {/* 5.2 Daily Target Settings */}
        <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-slate-900/50 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Daily Compounding</h2>
                <p className="text-xs text-slate-400">Settings & Projection</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-400">Daily Target</label>
                  <span className="text-lg font-bold text-emerald-400">{dailyFormData.dailyPercent}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="0.1" max="5" step="0.1" 
                    value={dailyFormData.dailyPercent} 
                    onChange={(e) => {
                      setDailyFormData({ dailyPercent: parseFloat(e.target.value) });
                    }} 
                    onMouseUp={handleSaveDaily}
                    onTouchEnd={handleSaveDaily}
                    className="w-full accent-emerald-500 cursor-pointer" 
                  />
                </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 opacity-10"><Zap className="w-16 h-16 text-yellow-500" /></div>
                <div className="flex justify-between items-center mb-1 relative z-10">
                  <label className="text-sm font-medium text-slate-400">Compounding</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isCompounding} onChange={(e) => setIsCompounding(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </div>
                <p className="text-xs text-slate-500 relative z-10 mt-2">Reinvest profits daily</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-400 font-medium mb-1">Today's Target Profit</p>
                <p className="text-xs text-slate-500">Based on {currentBalance.toLocaleString()} balance</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-400">
                  +${(currentBalance * (dailyFormData.dailyPercent / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5.3 Calendar Heatmap */}
        <motion.div variants={itemVariants} className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-slate-900/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500"/> Consistency Heatmap</h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1 hover:bg-slate-700 rounded-md text-slate-400 transition-colors"><ChevronLeft className="w-4 h-4"/></button>
              <span className="text-sm font-medium text-slate-200 w-24 text-center">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
              <button onClick={nextMonth} className="p-1 hover:bg-slate-700 rounded-md text-slate-400 transition-colors"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-500 py-1">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {calendarGrid.map((day, idx) => {
              if (day === null) return <div key={`blank-${idx}`} className="h-10 rounded-lg bg-transparent"></div>;
              
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const log = dailyLogs.find(l => new Date(l.date).toISOString().split('T')[0] === dateStr);
              const isFuture = new Date(dateStr) > new Date();
              
              let baseClass = "h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all group relative cursor-pointer ";
              if (isFuture) baseClass += "bg-slate-900/40 text-slate-600 border border-slate-800";
              else if (!log) baseClass += "bg-slate-700/50 text-slate-400 hover:bg-slate-600";
              else if (log.isAchieved) baseClass += "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]";
              else baseClass += "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]";

              return (
                <div key={day} className={baseClass}>
                  {day}
                  {/* Tooltip */}
                  {!isFuture && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-900 border border-slate-700 rounded-lg p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                      <p className="text-xs text-slate-300 font-bold mb-1">{monthNames[currentMonth.getMonth()]} {day}</p>
                      {log ? (
                        <>
                          <p className="text-[10px] text-slate-400">Target: ${log.targetAmount.toFixed(2)}</p>
                          <p className={`text-[10px] font-bold ${log.isAchieved ? 'text-emerald-400' : 'text-red-400'}`}>Actual: ${log.actualPnl.toFixed(2)}</p>
                        </>
                      ) : (
                        <p className="text-[10px] text-slate-500">No log entry</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 5.4 Projection Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-slate-900/50 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-500"/> Equity Projection</h2>
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
              {[30, 60, 90].map(days => (
                <button
                  key={days}
                  onClick={() => setProjectionDays(days)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${projectionDays === days ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 min-h-[300px] w-full">
            {projection && projection.projection ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projection.projection} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `D${v}`} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#F8FAFC', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#06B6D4', fontWeight: 'bold' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Projected Balance']}
                    labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                    labelFormatter={(label) => `Day ${label}`}
                  />
                  <Area type="monotone" dataKey="accumulatedBalance" stroke="#06B6D4" strokeWidth={3} fillOpacity={1} fill="url(#colorProjected)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                Configure a daily target to see projection
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <Modal isOpen={isGlobalModalOpen} onClose={() => setIsGlobalModalOpen(false)} title={globalTarget ? 'Edit Target' : 'Set Master Target'} size="sm" showCloseButton={false}>
        <form onSubmit={handleCreateGlobal} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Target Name</label>
            <input type="text" required value={globalFormData.name} onChange={(e) => setGlobalFormData({...globalFormData, name: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-600 outline-none transition-all duration-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Target Balance ($)</label>
            <input type="number" required value={globalFormData.targetBalance} onChange={(e) => setGlobalFormData({...globalFormData, targetBalance: Number(e.target.value)})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-600 outline-none transition-all duration-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Deadline (Optional)</label>
            <input type="date" value={globalFormData.deadline} onChange={(e) => setGlobalFormData({...globalFormData, deadline: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-600 outline-none transition-all duration-200" />
          </div>
          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={() => setIsGlobalModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all">Save</button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
