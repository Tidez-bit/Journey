import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Layout/Sidebar';
import Header from './Layout/Header';
import MainContent from './Layout/MainContent';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans text-slate-300">
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        setIsOpen={setIsMobileMenuOpen} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        <MainContent>
          <Outlet />
        </MainContent>
      </div>
    </div>
  );
}
