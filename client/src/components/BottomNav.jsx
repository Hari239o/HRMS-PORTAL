"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, CalendarCheck, FileText, TrendingUp, User, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Don't show bottom nav if not logged in
  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Attendance', icon: CalendarCheck, path: '/attendance' },
    { name: 'Leave', icon: FileText, path: '/leaves' },
    { name: 'Performance', icon: TrendingUp, path: '/performance' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            
            if (item.action) {
              return (
                <button
                  key={item.name}
                  onClick={item.action}
                  className={`flex flex-col items-center justify-center w-full py-1 gap-1 transition-all ${
                    isActive 
                      ? 'text-[#ff5a1f] scale-105' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className={`p-1.5 rounded-full transition-colors duration-300 ${isActive ? 'bg-[#ff5a1f]/10' : ''}`}>
                    {item.name === 'Profile' ? (
                      <div className={`w-[22px] h-[22px] rounded-full overflow-hidden flex items-center justify-center ${isActive ? 'ring-2 ring-[#ff5a1f] ring-offset-1' : ''}`}>
                        <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=ff5a1f&color=fff`} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    )}
                  </div>
                  <span className={`text-[10px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.name}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center w-full py-1 gap-1 transition-all ${
                  isActive 
                    ? 'text-[#ff5a1f] scale-105' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`p-1.5 rounded-full transition-colors duration-300 ${isActive ? 'bg-[#ff5a1f]/10' : ''}`}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
