import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

  const menuItems = [
    { name: 'Command Center', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'My Attendance', icon: CalendarCheck, path: '/attendance' },
    { name: 'Time Off', icon: FileText, path: '/leaves' },
    { name: 'Workforce Directory', icon: Users, path: '/employees' },
    { name: 'Resignations', icon: UserMinus, path: '/resignations' },
    { name: 'Holidays', icon: CalendarDays, path: '/holidays' },
    { name: 'Performance', icon: Trophy, path: '/performance' },
    { name: 'My Documents', icon: FileText, path: '/documents' },
  ];

  const adminItems = [
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
        return 'bg-sky-500 text-white shadow-xl shadow-sky-100 translate-x-2';
      }
      return 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-2';
    }
    if (isStudent) {
      return 'text-slate-500 hover:bg-sky-50 hover:text-sky-500';
    }
    return 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600';
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

      <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-72 h-full bg-white border-r border-slate-100 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 pb-2 relative">
          <button 
            className="md:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
          <div className="flex items-center justify-center mb-4 w-full mt-2">
            <img src="/geonixa-logo.png" alt="Geonixa" className="w-48 h-auto object-contain drop-shadow-sm" />
          </div>

        <div className="flex bg-slate-100 p-1 rounded-xl overflow-hidden">
          <button 
            onClick={() => setPortalMode('hr')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!isStudent ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            HR Portal
          </button>
          {user.role === 'student' && (
            <button 
              onClick={() => setPortalMode('student')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${isStudent ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Student
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        <div>
          <p className="px-4 mb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Core Modules</p>
          <div className="space-y-1.5">
            {(isStudent ? studentMenuItems : menuItems).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${getThemeClasses(isActive)}`
                }
              >
                <item.icon size={20} className="transition-transform group-hover:scale-110" />
                <span className="font-bold text-sm tracking-tight">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {!isStudent && user.role === 'admin' && (
          <div>
            <p className="px-4 mb-4 mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Administration</p>
            <div className="space-y-1.5">
              {adminItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${getThemeClasses(isActive)}`
                  }
                >
                  <item.icon size={20} className="transition-transform group-hover:scale-110" />
                  <span className="font-bold text-sm tracking-tight">{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-slate-50 rounded-[20px] p-4 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 relative overflow-hidden">
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
          
          <div className="grid grid-cols-3 gap-2">
            {user.role === 'admin' ? (
              <NavLink 
                to="/settings"
                className={({ isActive }) => 
                  `p-2 rounded-xl transition-all flex items-center justify-center border ${isActive ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-white text-slate-400 hover:text-indigo-600 hover:shadow-md border-slate-100'}`
                }
              >
                <Settings size={18} />
              </NavLink>
            ) : (
              <button className={`p-2 bg-white rounded-xl text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all flex items-center justify-center border border-slate-100`}>
                <Settings size={18} />
              </button>
            )}
            <button className={`p-2 bg-white rounded-xl text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all flex items-center justify-center border border-slate-100`}>
              <Bell size={18} />
            </button>
            <button
              onClick={logout}
              className="p-2 bg-rose-50 rounded-xl text-rose-500 hover:bg-rose-100 hover:shadow-md transition-all flex items-center justify-center border border-rose-100"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;
