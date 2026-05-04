import { useLocation } from 'react-router-dom';
import { Menu, Bell, Moon, Plus } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  
  // Format pathname to Title Case
  const getPageTitle = () => {
    const path = location.pathname.substring(1);
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const title = getPageTitle();

  return (
    <header className="h-16 flex-shrink-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-30 transition-all">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        
        {/* Left section: Hamburger & Title */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col">
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 mb-0.5">
              <span>Journey</span>
              <span>/</span>
              <span className="text-blue-400">{title}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 leading-none">
              {title}
            </h1>
          </div>
        </div>

        {/* Right section: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mock Notifications */}
          <button className="relative p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-slate-900" />
          </button>
          
          {/* Mock Theme Toggle */}
          <button className="p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors hidden sm:block">
            <Moon className="w-5 h-5" />
          </button>
          

        </div>

      </div>
    </header>
  );
}
