export default function OrderBlockBadge({ side, bullish, bearish }: { side: string, bullish?: string, bearish?: string }) {
  if (!side || side === 'NONE') return <span className="text-slate-500 text-xs">-</span>;

  return (
    <div className="flex flex-col text-[10px] font-bold gap-1">
      {(side === 'BEARISH' || side === 'BOTH') && bearish && (
        <span className="px-1.5 py-0.5 bg-red-600/30 text-red-400 rounded">OB_BEAR: {bearish}</span>
      )}
      {(side === 'BULLISH' || side === 'BOTH') && bullish && (
        <span className="px-1.5 py-0.5 bg-emerald-600/30 text-emerald-400 rounded">OB_BULL: {bullish}</span>
      )}
    </div>
  );
}
