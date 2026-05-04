import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, ArrowLeftRight, Target, ShieldAlert, Activity, LogOut, Compass, X } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Journal', path: '/journal', icon: BookOpen },
  { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
  { name: 'Target', path: '/targets', icon: Target },
  { name: 'Rules', path: '/rules', icon: ShieldAlert },
  { name: 'Scanner', path: '/scanner', icon: Activity },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 shadow-2xl lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent tracking-wide">
              JOURNEY
            </h1>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative overflow-hidden',
                  isActive 
                    ? 'text-blue-400 bg-blue-500/10 shadow-[inset_2px_0_0_0_#3b82f6]' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-50 pointer-events-none" />
                  )}
                  <item.icon className={clsx(
                    "w-5 h-5 transition-colors duration-200",
                    isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                  )} />
                  <span className="font-medium text-sm z-10">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        {/* User Profile */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/30">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/50 transition-colors group cursor-pointer">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold uppercase shadow-lg shadow-blue-500/20 shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold text-sm text-slate-200 truncate">{user?.name || 'Trader'}</span>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
