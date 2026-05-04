import React from 'react';

export const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement> & { variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral' }> = ({ 
  children, 
  variant = 'neutral', 
  className = '', 
  ...props 
}) => {
  const variants = {
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    info: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    neutral: 'bg-slate-700 text-slate-300 border border-slate-600'
  };

  return (
    <span 
      className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
