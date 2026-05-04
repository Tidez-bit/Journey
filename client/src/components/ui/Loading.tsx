import React from 'react';

export const Spinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ${className}`} />
);

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-700 rounded ${className}`} />
);

export const PageLoader: React.FC = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950">
    <div className="w-12 h-12 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mb-4" />
    <p className="text-slate-400 font-medium">Loading Journey...</p>
  </div>
);
