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
    <div className="flex h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-100 flex items-center justify-between p-3 z-50 sticky top-0 w-full shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center pl-2">
              <img src="/logo-only.png" alt="Geonixa" className="h-9 w-auto object-contain" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-100">
              <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=ff5a1f&color=fff`} alt="Profile" className="w-full h-full object-cover" />
            </div>
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
