"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { hasAdminAccess, isSuperAdmin } from '@/utils/rbac';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  FileText, 
  Users, 
  BarChart3, 
  LogOut,
  User,
  ShieldCheck,
  Settings,
  Bell,
  CalendarDays,
  Trophy,
  Award,
  Star,
  Target,
  PhoneCall,
  Clock,
  Briefcase,
  CreditCard,
  FileSpreadsheet,
  ClipboardList,
  UserMinus,
  Smartphone,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout, portalMode, setPortalMode } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Attendance', icon: CalendarCheck, path: '/attendance' },
    { name: 'Leave', icon: FileText, path: '/leaves' },
    { name: 'Separation', icon: UserMinus, path: '/resignations' },
    { name: 'Holidays', icon: CalendarDays, path: '/holidays' },
    { name: 'Performance', icon: Trophy, path: '/performance' },
    { name: 'HR Documents', icon: FileText, path: '/documents' },
  ];

  const adminItems = [
    { name: 'Workforce Directory', icon: Users, path: '/employees' },
    { name: 'Intelligence', icon: BarChart3, path: '/reports' },
    { name: 'Payroll', icon: ShieldCheck, path: '/salary' },
  ];

  const studentMenuItems = [
    { name: 'Student Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
    { name: 'Payments', icon: CreditCard, path: '/student/payments' },
    { name: 'Enrollment', icon: Briefcase, path: '/student/enrollment' },
    { name: 'Documents', icon: FileText, path: '/student/documents' },
    { name: 'Certificates', icon: Award, path: '/student/certificates' },
    { name: 'Support Tickets', icon: PhoneCall, path: '/student/support' },
    { name: 'Realtime Updates', icon: Clock, path: '/student/realtime' },
  ];

  const isStudent = portalMode === 'student';
  const getThemeClasses = (isActive) => {
    if (isActive) {
      if (isStudent) {
        return 'bg-gradient-to-r from-sky-500 to-sky-400 text-white shadow-lg shadow-sky-500/30 translate-x-1';
      }
      return 'bg-gradient-to-r from-[#ff5a1f] to-[#e04812] text-white shadow-lg shadow-[#ff5a1f]/30 translate-x-1';
    }
    if (isStudent) {
      return 'text-slate-500 hover:bg-white/50 hover:text-sky-600';
    }
    return 'text-slate-500 hover:bg-white/50 hover:text-[#ff5a1f]';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed md:relative inset-y-0 left-0 z-[60] w-72 h-full bg-white border-r border-slate-200 flex flex-col shadow-sm transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 pb-2 relative">
          <button 
            className="md:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 z-10"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
          <div className="flex items-center justify-center mb-1 w-full mt-0">
            <img src="/geonixa-logo.png" alt="Geonixa" className="w-48 h-auto object-contain drop-shadow-sm" />
          </div>

        {user.role === 'student' && (
          <div className="flex bg-white/40 backdrop-blur-sm border border-white/60 p-1 rounded-xl overflow-hidden shadow-inner mt-2 mx-4">
            <button 
              onClick={() => setPortalMode('hr')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!isStudent ? 'bg-white text-[#ff5a1f] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              HR Portal
            </button>
            <button 
              onClick={() => setPortalMode('student')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${isStudent ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Student
            </button>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        <div>
          <p className="px-4 mb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Core Modules</p>
          <div className="space-y-1.5">
            {(isStudent ? studentMenuItems : menuItems).map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${getThemeClasses(isActive)}`}
                >
                  <item.icon size={20} className="transition-transform group-hover:scale-110" />
                  <span className="font-bold text-sm tracking-tight">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {!isStudent && hasAdminAccess(user) && (
          <div>
            <p className="px-4 mb-4 mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Administration</p>
            <div className="space-y-1.5">
              {adminItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${getThemeClasses(isActive)}`}
                  >
                    <item.icon size={20} className="transition-transform group-hover:scale-110" />
                    <span className="font-bold text-sm tracking-tight">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-slate-50 rounded-[20px] p-4 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-[#ff5a1f] relative overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={20} />
              )}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 truncate tracking-tight">{user.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.role.replace('_', ' ')}</p>
              {user.starPerformer === 'month' && (
                <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm shadow-amber-200">
                  <Award size={10} /> Star of the Month
                </span>
              )}
              {user.starPerformer === 'week' && (
                <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-sm shadow-sky-200">
                  <Star size={10} /> Star of the Week
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 mb-3">
            {hasAdminAccess(user) ? (
              <Link 
                href="/settings"
                className={`flex-1 p-2 rounded-xl transition-all flex items-center justify-center border ${pathname === '/settings' ? 'bg-[#ff5a1f]/10 text-[#ff5a1f] border-[#ff5a1f]/20' : 'bg-white text-slate-500 hover:text-[#ff5a1f] hover:shadow-sm border-slate-200'}`}
                title="Settings"
              >
                <Settings size={18} />
              </Link>
            ) : (
              <button className={`flex-1 p-2 bg-white rounded-xl text-slate-500 hover:text-[#ff5a1f] hover:shadow-sm transition-all flex items-center justify-center border border-slate-200`} title="Settings">
                <Settings size={18} />
              </button>
            )}
            <button className={`flex-1 p-2 bg-white rounded-xl text-slate-500 hover:text-[#ff5a1f] hover:shadow-sm transition-all flex items-center justify-center border border-slate-200`} title="Notifications">
              <Bell size={18} />
            </button>
          </div>
          
          <button
            onClick={logout}
            className="w-full py-2.5 bg-rose-50 rounded-xl text-rose-600 hover:bg-rose-100 hover:shadow-sm transition-all flex items-center justify-center gap-2 border border-rose-100 font-bold text-sm"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;
