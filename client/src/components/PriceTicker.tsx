import { useEffect, useState, useRef } from 'react';
import { useScannerStore } from '../store/scannerStore';
import { useDashboardStore } from '../store/dashboardStore';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';

export default function PriceTicker() {
  const { watchlist, realTimePrices, connectWebSocket } = useScannerStore();
  const stats = useDashboardStore(state => state.stats);
  const scannerEnabled = stats?.scannerEnabled ?? true;
  
  useEffect(() => {
    if (!scannerEnabled) return;
    const ws = connectWebSocket();
    return () => {
      ws.close();
    };
  }, [connectWebSocket, scannerEnabled]);

  if (!scannerEnabled) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
        <p className="text-slate-400 font-medium flex items-center justify-center">
          Scanner is Paused ⏸️
        </p>
        <p className="text-xs text-slate-500 mt-1">Enable live updates to see real-time prices</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {watchlist.map(pair => (
        <TickerCard key={pair} pair={pair} data={realTimePrices[pair]} />
      ))}
    </div>
  );
}

function TickerCard({ pair, data }: { pair: string, data: any }) {
  const [flash, setFlash] = useState('');
  const prevPriceRef = useRef<number | null>(null);

  useEffect(() => {
    if (data?.price && prevPriceRef.current !== null) {
      if (data.price > prevPriceRef.current) {
        setFlash('bg-emerald-500/20');
      } else if (data.price < prevPriceRef.current) {
        setFlash('bg-red-500/20');
      }
      const timer = setTimeout(() => setFlash(''), 500);
      prevPriceRef.current = data.price;
      return () => clearTimeout(timer);
    }
    if (data?.price) {
      prevPriceRef.current = data.price;
    }
  }, [data?.price]);

  if (!data) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center h-24 animate-pulse">
        <Clock className="w-5 h-5 text-slate-500 mb-2" />
        <span className="text-xs text-slate-500">{pair}</span>
      </div>
    );
  }

  const change = data.price - data.low;
  const isUp = change >= 0;

  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-xl p-4 transition-colors duration-300 ${flash}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-slate-300">{pair}</span>
        {isUp ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
      </div>
      <div className="text-xl font-bold text-slate-100">${data.price.toFixed(4)}</div>
      <div className="text-xs text-slate-400 mt-1 flex justify-between">
        <span>H: {data.high.toFixed(2)}</span>
        <span>L: {data.low.toFixed(2)}</span>
      </div>
    </div>
  );
}
