import { ArrowUp, ArrowDown } from 'lucide-react';

export default function LiquidityMarker({ side, above, below }: { side: string, above?: number, below?: number }) {
  if (!side || side === 'NONE') return <span className="text-slate-500 text-xs">-</span>;

  return (
    <div className="flex flex-col text-xs font-medium">
      {(side === 'ABOVE' || side === 'BOTH') && above && (
        <span className="flex items-center text-blue-400"><ArrowUp className="w-3 h-3 mr-1" /> {above}</span>
      )}
      {(side === 'BELOW' || side === 'BOTH') && below && (
        <span className="flex items-center text-orange-400"><ArrowDown className="w-3 h-3 mr-1" /> {below}</span>
      )}
    </div>
  );
}
