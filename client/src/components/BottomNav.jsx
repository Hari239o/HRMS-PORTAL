"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, CalendarCheck, FileText, Folder } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Don't show bottom nav if not logged in
  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Attendance', icon: CalendarCheck, path: '/attendance' },
    { name: 'Time Off', icon: FileText, path: '/leaves' },
    { name: 'Documents', icon: Folder, path: '/documents' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center w-full py-1 gap-1 transition-all ${
                isActive 
                  ? 'text-blue-600 scale-105' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-full ${isActive ? 'bg-blue-50' : ''}`}>
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
  );
}
