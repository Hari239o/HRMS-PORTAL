"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, CalendarCheck, FileText, TrendingUp, User, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  // Don't show bottom nav if not logged in
  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Attendance', icon: CalendarCheck, path: '/attendance' },
    { name: 'Leave', icon: FileText, path: '/leaves' },
    { name: 'Performance', icon: TrendingUp, path: '/performance' },
    { name: 'Profile', icon: User, action: () => setShowProfile(!showProfile) },
  ];

  return (
    <>
      {showProfile && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setShowProfile(false)} />
          <div className="fixed bottom-[72px] left-4 right-4 bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 z-50 md:hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 flex items-center justify-center text-[#ff5a1f] relative overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} />
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black text-slate-900 leading-tight truncate">{user.name}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Link href="/settings" onClick={() => setShowProfile(false)} className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm border border-slate-100 hover:bg-slate-100 transition-colors">
                <Settings size={18} /> Settings
              </Link>
              <button onClick={() => { setShowProfile(false); logout(); }} className="flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm border border-rose-100 hover:bg-rose-100 transition-colors">
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.name === 'Profile' && showProfile);
            
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
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
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
