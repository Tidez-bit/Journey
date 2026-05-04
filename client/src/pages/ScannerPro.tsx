import React, { useEffect, useState } from 'react';
import { useScannerStore } from '../store/scannerStore';
import { useDashboardStore } from '../store/dashboardStore';
import PriceTicker from '../components/PriceTicker';
import PDArrayVisual from '../components/PDArrayVisual';
import LiquidityMarker from '../components/LiquidityMarker';
import OrderBlockBadge from '../components/OrderBlockBadge';
import { RefreshCw, Search, Plus, SlidersHorizontal, BarChart2, Zap, ArrowUpRight, ArrowDownRight, Activity, X, Save, Eye, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TIMEFRAMES = ['15m', '1H', '4H', '1D', '1W'];

// Mock Data for mini chart
const generateMockChartData = (basePrice: number) => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: i,
    price: basePrice + (Math.random() - 0.5) * (basePrice * 0.02)
  }));
};

export default function ScannerPro() {
  const { scanners, selectedDate, selectedTimeframe, watchlist, fetchScanners, setTimeframe, setSelectedDate, createScanner, realTimePrices } = useScannerStore();
  const { stats, updateSettings, fetchDashboardStats } = useDashboardStore();
  const scannerEnabled = stats?.scannerEnabled ?? true;
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({ pair: 'BTC/USDT' });
  
  // Detail Panel State
  const [selectedScanner, setSelectedScanner] = useState<any>(null);
  const [panelNotes, setPanelNotes] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchScanners(selectedDate, selectedTimeframe);
    if (!stats) fetchDashboardStats();
  }, [selectedDate, selectedTimeframe, fetchScanners, stats, fetchDashboardStats]);

  const handleManualAdd = () => {
    setFormData({
      date: selectedDate,
      pair: watchlist[0] || 'BTC/USDT',
      timeframe: selectedTimeframe,
      currentPrice: realTimePrices[watchlist[0]]?.price || 0,
      lastHigh: 0,
      lastLow: 0,
      pdArray: 'EQUILIBRIUM',
      pdPercent: 50,
      liquiditySide: 'NONE',
      obSide: 'NONE',
      trend: 'SIDEWAYS',
      volume: 'NORMAL',
      bias: 'NEUTRAL'
    });
    setIsAddModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await createScanner(formData);
    setIsAddModalOpen(false);
  };

  const handleAutoScan = async () => {
    setIsRefreshing(true);
    if (watchlist.length > 0) {
      // Simulate scan delay
      await new Promise(r => setTimeout(r, 800));
      const pair = watchlist[0];
      const price = realTimePrices[pair]?.price || 65000;
      await createScanner({
        date: selectedDate,
        pair,
        timeframe: selectedTimeframe,
        currentPrice: price,
        lastHigh: price * 1.05,
        lastLow: price * 0.95,
        pdArray: 'DISCOUNT',
        pdPercent: 45,
        liquiditySide: 'ABOVE',
        liquidityAbove: price * 1.02,
        obSide: 'BULLISH',
        obBullish: (price * 0.98).toString(),
        trend: 'BULLISH',
        volume: 'HIGH',
        bias: 'BULLISH'
      });
    }
    setIsRefreshing(false);
  };

  const openDetailPanel = (scanner: any) => {
    setSelectedScanner(scanner);
    setPanelNotes(scanner.notes || '');
  };

  const saveDetailNotes = () => {
    // In a real app, update the scanner with the notes
    alert('Notes saved for ' + selectedScanner.pair);
    setSelectedScanner(null);
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  return (
    <motion.div className="space-y-6 relative overflow-hidden" variants={containerVariants} initial="hidden" animate="show">
      
      {/* 7.1 Control Bar */}
      <motion.div variants={itemVariants} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl shadow-slate-900/50">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Search className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 leading-tight">Scanner Pro</h1>
            <p className="text-xs text-slate-400">SMC algorithmic detection</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden p-1 shadow-inner">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent px-3 py-1.5 text-sm font-medium text-slate-300 focus:outline-none cursor-pointer"
            />
          </div>
          
          <div className="flex bg-slate-900 rounded-xl border border-slate-700 p-1 shadow-inner">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedTimeframe === tf 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex-1 xl:flex-none"></div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => updateSettings({ scannerEnabled: !scannerEnabled })}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center transition-all ${
                scannerEnabled 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                  : 'bg-slate-900 border border-slate-700 text-slate-500'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${scannerEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></div>
              {scannerEnabled ? 'SCANNER ON' : 'SCANNER OFF'}
            </button>

            <button 
              onClick={handleAutoScan} 
              disabled={isRefreshing}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
              title="Refresh Auto Scan"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            
            <button 
              onClick={handleManualAdd} 
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-all shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </button>
          </div>
        </div>
      </motion.div>

      {/* 7.2 Price Ticker */}
      <motion.div variants={itemVariants}>
        <PriceTicker />
      </motion.div>

      {/* 7.3 Scanner Table */}
      <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl shadow-slate-900/50">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-sm font-bold text-slate-100 flex items-center"><Activity className="w-4 h-4 mr-2 text-blue-500"/> Scan Results</h2>
          <button className="text-xs font-medium text-slate-400 hover:text-blue-400 flex items-center transition-colors">
            <SlidersHorizontal className="w-3 h-3 mr-1" /> Filters
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-900/80 border-b border-slate-700/80 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">Price / Range</th>
                <th className="px-6 py-4">PD Array</th>
                <th className="px-6 py-4">Liquidity</th>
                <th className="px-6 py-4">Order Block</th>
                <th className="px-6 py-4">Structure</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {scanners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-300 font-medium mb-1">No scan data available</p>
                    <p className="text-slate-500 text-sm">Run Auto Scan or Add manually for {selectedDate} ({selectedTimeframe}).</p>
                  </td>
                </tr>
              ) : (
                scanners.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-700/40 transition-colors group cursor-pointer" onClick={() => openDetailPanel(s)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                          {s.pair.split('/')[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200">{s.pair}</div>
                          <div className="text-[10px] text-slate-500 font-medium">{new Date(s.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-medium text-slate-200 mb-1">
                        ${s.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </div>
                      <div className="flex items-center text-[10px] text-slate-500 font-mono">
                        <span className="text-red-400/70">L: ${s.lastLow.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        <span className="mx-1">-</span>
                        <span className="text-emerald-400/70">H: ${s.lastHigh.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <PDArrayVisual percent={s.pdPercent} />
                      <div className="mt-1 text-[10px] font-bold text-slate-500 text-center">{s.pdArray}</div>
                    </td>
                    <td className="px-6 py-4">
                      <LiquidityMarker side={s.liquiditySide} above={s.liquidityAbove} below={s.liquidityBelow} />
                    </td>
                    <td className="px-6 py-4">
                      <OrderBlockBadge side={s.obSide} bullish={s.obBullish} bearish={s.obBearish} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`flex items-center px-2 py-0.5 text-[10px] font-bold rounded ${s.trend === 'BULLISH' ? 'bg-emerald-500/10 text-emerald-400' : s.trend === 'BEARISH' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'}`}>
                          {s.trend === 'BULLISH' ? <TrendingUp className="w-3 h-3 mr-1"/> : s.trend === 'BEARISH' ? <TrendingDown className="w-3 h-3 mr-1"/> : <Minus className="w-3 h-3 mr-1"/>}
                          TREND: {s.trend}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                          s.volume === 'HIGH' ? 'border-emerald-500/30 text-emerald-400' : 
                          s.volume === 'LOW' ? 'border-red-500/30 text-red-400' : 
                          'border-slate-500/30 text-slate-400'
                        }`}>
                          VOL: {s.volume}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* 7.4 Scanner Detail Panel (Slide-in) */}
      <AnimatePresence>
        {selectedScanner && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedScanner(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%', opacity: 0.5 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center font-bold text-sm text-slate-200">
                    {selectedScanner.pair.split('/')[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">{selectedScanner.pair}</h2>
                    <p className="text-xs font-medium text-slate-400">{selectedScanner.timeframe} • {new Date(selectedScanner.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedScanner(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                
                {/* Status Banners */}
                <div className="flex gap-2">
                  <div className={`flex-1 p-3 rounded-xl border ${selectedScanner.bias === 'BULLISH' ? 'bg-emerald-500/10 border-emerald-500/30' : selectedScanner.bias === 'BEARISH' ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800 border-slate-700'}`}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Overall Bias</p>
                    <p className={`text-sm font-bold flex items-center ${selectedScanner.bias === 'BULLISH' ? 'text-emerald-400' : selectedScanner.bias === 'BEARISH' ? 'text-red-400' : 'text-slate-300'}`}>
                      {selectedScanner.bias === 'BULLISH' ? <ArrowUpRight className="w-4 h-4 mr-1"/> : selectedScanner.bias === 'BEARISH' ? <ArrowDownRight className="w-4 h-4 mr-1"/> : null}
                      {selectedScanner.bias}
                    </p>
                  </div>
                  <div className="flex-1 p-3 rounded-xl border bg-slate-800 border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Price</p>
                    <p className="text-sm font-mono font-bold text-slate-200">${selectedScanner.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
                  </div>
                </div>

                {/* Mini Candlestick / Chart Placeholder */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center"><BarChart2 className="w-4 h-4 mr-1"/> Price Action</h3>
                    <span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-500">Live</span>
                  </div>
                  <div className="h-40 w-full relative">
                    {/* Visual Markers Overlay */}
                    {selectedScanner.liquiditySide === 'ABOVE' && <div className="absolute top-[20%] left-0 right-0 border-t border-dashed border-red-500/50 z-10 flex justify-end pr-2"><span className="text-[8px] text-red-400 bg-slate-900 px-1 -mt-1">Buyside Liq</span></div>}
                    {selectedScanner.obSide === 'BULLISH' && <div className="absolute bottom-[30%] left-0 right-0 h-4 bg-emerald-500/10 border-y border-emerald-500/30 z-10 flex justify-end pr-2 items-center"><span className="text-[8px] text-emerald-400 bg-slate-900 px-1">+OB</span></div>}
                    
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={generateMockChartData(selectedScanner.currentPrice)}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={selectedScanner.trend === 'BEARISH' ? '#EF4444' : '#10B981'} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={selectedScanner.trend === 'BEARISH' ? '#EF4444' : '#10B981'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="price" stroke={selectedScanner.trend === 'BEARISH' ? '#EF4444' : '#10B981'} strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Technical Levels Grid */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Key Levels Detected</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-[10px] text-slate-500 mb-1">PD Array State</p>
                      <p className="text-sm font-bold text-slate-300">{selectedScanner.pdArray} <span className="text-xs font-normal text-slate-500">({selectedScanner.pdPercent}%)</span></p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-[10px] text-slate-500 mb-1">Liquidity Pool</p>
                      <p className="text-sm font-bold text-slate-300">{selectedScanner.liquiditySide !== 'NONE' ? `${selectedScanner.liquiditySide}` : 'Neutral'}</p>
                    </div>
                    <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20">
                      <p className="text-[10px] text-emerald-500/70 mb-1">+ Bullish OB</p>
                      <p className="text-sm font-mono font-bold text-emerald-400">{selectedScanner.obBullish ? `$${selectedScanner.obBullish}` : 'None'}</p>
                    </div>
                    <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/20">
                      <p className="text-[10px] text-red-500/70 mb-1">- Bearish OB</p>
                      <p className="text-sm font-mono font-bold text-red-400">{selectedScanner.obBearish ? `$${selectedScanner.obBearish}` : 'None'}</p>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Analysis Notes</h3>
                  <textarea 
                    value={panelNotes}
                    onChange={(e) => setPanelNotes(e.target.value)}
                    placeholder="Add your confluence notes here..."
                    className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-600 outline-none transition-all duration-200 resize-none"
                  />
                </div>
              </div>

              <div className="p-5 border-t border-slate-800 bg-slate-900">
                <button onClick={saveDetailNotes} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-blue-500/20">
                  <Save className="w-4 h-4 mr-2" /> Save Analysis
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Manual Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-500"/> Manual Scanner Entry</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Pair</label>
                  <input type="text" required value={formData.pair} onChange={e => setFormData({...formData, pair: e.target.value.toUpperCase()})} placeholder="e.g. BTC/USDT" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-600 outline-none transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Current Price</label>
                  <input type="number" step="any" required value={formData.currentPrice} onChange={e => setFormData({...formData, currentPrice: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-600 outline-none transition-all duration-200 font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Market Bias</label>
                  <select value={formData.bias} onChange={e => setFormData({...formData, bias: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-600 outline-none transition-all duration-200 appearance-none">
                     <option value="BULLISH">Bullish</option>
                     <option value="BEARISH">Bearish</option>
                     <option value="NEUTRAL">Neutral</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                   <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-colors">Cancel</button>
                   <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all">Add to Scanner</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
