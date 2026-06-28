"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Menu, QrCode, HelpCircle, Star } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';

export default function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const adminOnlyRoutes = ['/settings', '/reports'];
  if (adminOnlyRoutes.some(route => pathname?.startsWith(route)) && user.role !== 'admin') {
    router.replace('/dashboard');
    return null;
  }


  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-100 flex items-center justify-between p-3 z-40 relative">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 -ml-1 text-slate-500 hover:text-blue-600 focus:outline-none">
              <Menu size={20} />
            </button>
            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-serif italic font-bold border-2 border-white shadow-sm ring-1 ring-slate-200">
              G
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-sm ring-2 ring-blue-100 relative">
              <Star size={16} className="fill-white" />
              <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping"></div>
            </button>
            
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-xs">{user?.name?.charAt(0)}</div>
              )}
            </div>
            
            <button className="text-blue-500 hover:text-blue-600">
              <QrCode size={22} />
            </button>
            
            <button className="text-blue-500 hover:text-blue-600">
              <HelpCircle size={22} />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 md:pb-8 pb-24">
          <div className="w-full max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
