export default function PDArrayVisual({ percent }: { percent: number }) {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  
  let badgeColor = 'bg-slate-500 text-slate-100';
  let label = 'EQ';
  
  if (clampedPercent > 50) {
    badgeColor = 'bg-red-500/20 text-red-400 border border-red-500/50';
    label = 'PREMIUM';
  } else if (clampedPercent < 50) {
    badgeColor = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50';
    label = 'DISCOUNT';
  }

  return (
    <div className="flex items-center space-x-2">
      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${badgeColor}`}>
        {label}
      </span>
      <span className="text-xs text-slate-400">{clampedPercent.toFixed(1)}%</span>
    </div>
  );
}
