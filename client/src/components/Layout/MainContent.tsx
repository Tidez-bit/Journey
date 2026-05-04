import { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 relative overflow-y-auto bg-gradient-to-br from-slate-950 to-slate-900 custom-scrollbar">
      {/* Background Decorative Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Content Container */}
      <div className="relative w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 min-h-full">
        {/* Page Transition Wrapper */}
        <div className="animate-fade-in animate-slide-up">
          {children}
        </div>
      </div>
    </main>
  );
}
