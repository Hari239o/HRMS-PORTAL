"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '@/utils/api';
;
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Activity,
  Server,
  FileText,
  Download,
  Award,
  Star,
  Mail,
  Key,
  Send,
  MessageSquare,
  X,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  // Admin Specific State
  const [adminStats, setAdminStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    halfDaysToday: 0,
    absentToday: 0,
    leavesToday: 0
  });
  const [chartData, setChartData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [starDeclarationForm, setStarDeclarationForm] = useState({ employeeId: '', badge: 'week' });

  // Shared State
  const [starPerformers, setStarPerformers] = useState([]);
  const [messageFormOpenId, setMessageFormOpenId] = useState(null);
  const [customMessage, setCustomMessage] = useState('');

  const sendCongratulations = (id, name, isCustom = false) => {
    toast.success(`Message sent to ${name}!`);
    if (isCustom) {
      setMessageFormOpenId(null);
      setCustomMessage('');
    }
  };

  // Employee Specific State
  const [empStats, setEmpStats] = useState({
    presentDays: 0,
    halfDays: 0,
    absentDays: 0,
    approvedLeaves: 0,
    totalWorkingDays: 0
  });
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [payslips, setPayslips] = useState([]);
          
  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id, user?.role]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      if (user.role === 'admin') {
        const [statsRes, analyticsRes, activityRes, employeesRes, starsRes] = await Promise.all([
          api.get(`/api/reports/dashboard-stats`),
          api.get(`/api/reports/analytics/monthly?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`),
          api.get(`/api/reports/recent-activity`),
          api.get(`/api/employees`),
          api.get(`/api/employees/star-performers`)
        ]);
        
        setAdminStats(statsRes.data);
        setRecentActivity(activityRes.data);
        setAllEmployees(employeesRes.data);
        setStarPerformers(starsRes.data);
                
        const analyticsData = Object.entries(analyticsRes.data).map(([name, value]) => ({ 
          name, 
          value,
          color: name === 'Present' ? '#6366f1' : name === 'Late' ? '#f59e0b' : '#f43f5e'
        }));
        setChartData(analyticsData);
      } else {
        // Employee Dashboard Data
        const [attendanceRes, leavesRes, payslipsRes, starsRes, meRes] = await Promise.all([
          api.get(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/attendance`),
          api.get(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/leaves`),
          api.get(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/salary`),
          api.get(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/employees/star-performers`),
          api.get(`/api/employees/me`)
        ]);

        const personalAttendance = attendanceRes.data || [];
        const personalLeaves = leavesRes.data || [];
        setStarPerformers(starsRes.data);
        setEmployeeDetails(meRes.data);
        
        if (meRes.data) {
          updateUser({
            department: meRes.data.department,
            role: meRes.data.role,
            name: meRes.data.name,
            avatar: meRes.data.avatar
          });
        }

        const presentCount = personalAttendance.filter(a => a.status === 'Present').length;
        const halfDayCount = personalAttendance.filter(a => a.status === 'Half Day').length;
        const absentCount = personalAttendance.filter(a => a.status === 'Absent').length;
        const approvedCount = personalLeaves.filter(l => l.status === 'Approved').length;

        setEmpStats({
          presentDays: presentCount,
          halfDays: halfDayCount,
          absentDays: absentCount,
          approvedLeaves: approvedCount,
          totalWorkingDays: presentCount + (halfDayCount * 0.5)
        });

        setPayslips(payslipsRes.data || []);
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      let friendlyError = 'Unable to load dashboard data. Please refresh the page.';
      if (err.response?.status === 503) {
        friendlyError = 'Database temporarily unavailable. Please try again later.';
      } else if (err.response?.data?.error) {
        const serverError = err.response.data.error;
        friendlyError = typeof serverError === 'string' ? serverError : (serverError.message || friendlyError);
      }
      setDashboardError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const downloadPayslip = async (salaryId, month) => {
    try {
      const response = await axios({
        url: `/api/salary/generate/${salaryId}`,
        method: 'GET',
        responseType: 'blob', // Important for file download
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Payslip download error', err);
    }
  };

  const declareStarPerformer = async (e) => {
    e.preventDefault();
    if (!starDeclarationForm.employeeId) return toast.error('Please select an employee');
    try {
      await api.patch(`/api/employees/${starDeclarationForm.employeeId}/badge`, { starPerformer: starDeclarationForm.badge });
      toast.success('Star Performer declared successfully!');
      fetchData();
    } catch (err) {
      toast.error('Failed to declare star performer');
    }
  };

  const removeStarPerformer = async (id) => {
    if (!window.confirm('Remove this badge?')) return;
    try {
      await api.patch(`/api/employees/${id}/badge`, { starPerformer: 'none' });
      toast.success('Badge removed');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove badge');
    }
  };

  const handleSelfChangePassword = async () => {
    const currentPassword = window.prompt("Enter your CURRENT password:");
    if (!currentPassword) return;
    
    const newPassword = window.prompt("Enter your NEW password:");
    if (!newPassword) return;

    try {
      await api.put(`/api/auth/change-password`, { currentPassword, newPassword });
      toast.success('Password changed successfully! Please use it on your next login.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    }
  };

    const StatCard = ({ title, value, icon: Icon, color, trend }) => {
      const textColor = color ? color.replace('bg-', 'text-') : 'text-blue-600';
      const bgColor = color ? color.replace('bg-', 'bg-').replace('600', '50').replace('500', '50') : 'bg-blue-50';
      
      return (
        <div className="group relative rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="p-6 flex flex-col justify-between h-full relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgColor} ${textColor} group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={24} />
              </div>
              {trend && <span className="px-2 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-500 border border-slate-100">{trend}</span>}
            </div>
            <div>
              <h4 className="text-3xl font-black tracking-tight text-slate-800 mb-1">{value}</h4>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
            </div>
          </div>
        </div>
      );
    };

  const ProfileCard = ({ title, profile, highlight }) => {
    if (!profile) {
      return (
        <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 w-64">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <UserX size={18} className="text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
              <p className="text-sm font-bold text-slate-500">Not Assigned</p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group cursor-default w-64 ${highlight ? 'bg-indigo-50/60 backdrop-blur-md border-indigo-200 shadow-lg ring-1 ring-indigo-100' : 'bg-white/60 backdrop-blur-md border-white/50 shadow-sm hover:shadow-md hover:border-indigo-200'} border`}>
        <div className="flex items-center gap-4">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-slate-200" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm ring-1 ring-slate-200">
              {profile.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">{title}</p>
            <p className="text-sm font-black text-slate-800 leading-tight">{profile.name}</p>
            <p className="text-xs font-medium text-slate-500 truncate max-w-[120px]">{profile.email}</p>
          </div>
        </div>
        <a href={`mailto:${profile.email}`} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100" title={`Email ${profile.name}`}>
          <Mail size={14} />
        </a>
      </div>
    );
  };


  // Removed blocking loading spinner to allow instant rendering

  if (dashboardError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4 text-center">
        <Server size={48} className="text-rose-500" />
        <h2 className="text-2xl font-black text-slate-900">Dashboard unavailable</h2>
        <p className="max-w-xl text-sm text-slate-500">{dashboardError}</p>
        <button
          onClick={() => {
            setDashboardError(null);
            fetchData();
          }}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const AppGridItem = ({ title, icon: Icon, link }) => (
    <Link href={link} className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all border border-slate-100 group">
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-50 transition-all">
        <Icon size={24} className="text-slate-600 group-hover:text-blue-600" />
      </div>
      <span className="text-xs font-bold text-slate-700 text-center">{title}</span>
    </Link>
  );

  // EMPLOYEE VIEW
  if (user && user.role !== 'admin') {
    return (
      <div className="flex flex-col gap-5 md:gap-6 pb-12 w-full max-w-lg mx-auto md:max-w-none fade-in">
        
        {/* Search Bar */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search by Member name or Member ID" 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 transition-all hover:border-slate-300"
          />
        </div>

        {/* Banner Removed */}

        {/* Wall of Fame (Employee View) */}
        {starPerformers.length > 0 && (
          <div className="bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-5 sm:p-6 mb-2">
            <h3 className="font-black text-lg text-slate-800 flex items-center gap-2 mb-4">
              <Star size={20} className="text-yellow-400 drop-shadow-sm fill-yellow-400" /> Wall of Fame
            </h3>
            <div className="space-y-3">
              {starPerformers.map(star => (
                <div key={star.id} className="bg-gradient-to-r from-yellow-50 to-amber-50/50 border border-yellow-100/50 rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-md">
                  <div className="w-12 h-12 rounded-full bg-white text-yellow-600 flex items-center justify-center font-black text-lg shadow-sm ring-2 ring-yellow-200/50">
                    {star.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-base leading-tight text-slate-800">{star.name}</p>
                    <p className="text-xs font-black text-yellow-600 uppercase tracking-widest">{star.starPerformer}ly Star Performer</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Big Check Out Button */}
        <Link href="/attendance" className="w-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-5 flex items-center justify-between shadow-xl shadow-orange-500/20 hover:shadow-2xl hover:shadow-orange-500/30 transition-all active:scale-[0.98] group">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full border border-white/30 group-hover:rotate-12 transition-transform">
              <Clock size={24} className="text-white" />
            </div>
            <span className="text-white font-black text-lg tracking-wide">Punch In / Out</span>
          </div>
          <span className="text-white text-[11px] font-bold bg-black/10 px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1 group-hover:bg-black/20 transition-colors shadow-sm">
            Click here <ArrowUpRight size={12} />
          </span>
        </Link>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-2">
          <AppGridItem title="Task Box" icon={ClipboardList} link="#" />
          <AppGridItem title="Attendance" icon={CalendarDays} link="/attendance" />
          <AppGridItem title="Leave" icon={Calendar} link="/leaves" />
          <AppGridItem title="Payroll" icon={Receipt} link="/salary" />
          <AppGridItem title="Performance" icon={TrendingUp} link="/performance" />
          <AppGridItem title="Holidays" icon={CalendarDays} link="/holidays" />
          <AppGridItem title="HR Documents" icon={FileText} link="/documents" />
          <AppGridItem title="HR Policies" icon={FileSpreadsheet} link="/hr-policies" />
          <AppGridItem title="Recruitment" icon={Briefcase} link="#" />
          <AppGridItem title="Separation" icon={UserX} link="/resignations" />
          <AppGridItem title="Member" icon={Users} link="#" />
          <AppGridItem title="Vibe" icon={Smile} link="#" />
        </div>

      </div>
    );
  }

  // ADMIN VIEW
  return (
    <div className="space-y-6 fade-in pb-12">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Admin <span className="text-blue-600">Command Center</span>
          </h1>
        </div>
      </div>

      {/* Admin 12-item App Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 mt-2">
        <AppGridItem title="Task Box" icon={ClipboardList} link="/taskbox" />
        <AppGridItem title="Attendance" icon={CalendarDays} link="/attendance" />
        <AppGridItem title="Leave" icon={Calendar} link="/leaves" />
        <AppGridItem title="Payroll" icon={Receipt} link="/salary" />
        <AppGridItem title="Performance" icon={TrendingUp} link="/performance" />
        <AppGridItem title="Holidays" icon={CalendarDays} link="/holidays" />
        <AppGridItem title="HR Documents" icon={FileText} link="/documents" />
        <AppGridItem title="HR Policies" icon={FileSpreadsheet} link="/hr-policies" />
        <AppGridItem title="Recruitment" icon={Briefcase} link="/recruitment" />
        <AppGridItem title="Separation" icon={UserX} link="/resignations" />
        <AppGridItem title="Member" icon={Users} link="/employees" />
        <AppGridItem title="Vibe" icon={Smile} link="#" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 mt-4">
        <StatCard title="Total Workforce" value={adminStats.totalEmployees} icon={Users} color="bg-blue-600" />
        <StatCard title="Present Today" value={adminStats.presentToday} icon={UserCheck} color="bg-blue-600" />
        <StatCard title="Absent Pool" value={adminStats.absentToday} icon={UserX} color="bg-blue-600" />
        <StatCard title="Leave Requests" value={adminStats.leavesToday} icon={Calendar} color="bg-blue-600" />
        <StatCard title="Half Days Today" value={adminStats.halfDaysToday || 0} icon={Clock} color="bg-blue-600" />
      </div>

      <div className="rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl overflow-hidden mb-6 relative">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 p-8 gap-10">
          <div>
            <h3 className="font-black text-3xl mb-2 flex items-center gap-3 text-slate-800">
              <Star size={32} className="text-yellow-400 drop-shadow-sm" /> Declare Star Performer
            </h3>
            <p className="text-slate-500 text-sm mb-6">Select an employee to feature them on everyone's dashboard directly.</p>
            
            <form onSubmit={declareStarPerformer} className="flex flex-col sm:flex-row gap-3">
              <select 
                className="py-3 px-4 text-sm flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:bg-white focus:border-blue-300 outline-none transition-colors"
                value={starDeclarationForm.employeeId}
                onChange={(e) => setStarDeclarationForm({...starDeclarationForm, employeeId: e.target.value})}
                required
              >
                <option value="" disabled>-- Select Employee --</option>
                {allEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              <select 
                className="py-3 px-4 text-sm w-full sm:w-32 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:bg-white focus:border-blue-300 outline-none transition-colors"
                value={starDeclarationForm.badge}
                onChange={(e) => setStarDeclarationForm({...starDeclarationForm, badge: e.target.value})}
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all flex-shrink-0">
                Declare
              </button>
            </form>
          </div>
          
          <div className="lg:border-l border-slate-100 lg:pl-10 flex flex-col justify-center">
            <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-4">Current Wall of Fame</h4>
            {starPerformers.length > 0 ? (
              <div className="space-y-3">
                {starPerformers.map(star => (
                  <div key={star.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between group transition-all hover:border-slate-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shadow-sm ring-1 ring-slate-200">
                        {star.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight text-slate-800">{star.name}</p>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{star.starPerformer}ly Star</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeStarPerformer(star.id)} 
                      className="px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-bold bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg transition-all opacity-0 group-hover:opacity-100" 
                      title="Revoke Badge"
                    >
                      <UserX size={12} /> Revoke
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 border-dashed text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center mb-3">
                  <Star size={24} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400 italic font-medium">No star performers declared currently.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card border border-white/50 shadow-xl shadow-slate-100/30 bg-white/60 backdrop-blur-xl">
          <h3 className="font-black text-lg text-slate-800 flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-blue-600" /> Workforce Reliability Analytics
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          

          <div className="card bg-white/60 backdrop-blur-md border border-white/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-blue-600" /> Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.length > 0 ? recentActivity.map((act, i) => (
                <div key={i} className="flex items-start gap-3 pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                    {act.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{act.name}</p>
                    <p className="text-[10px] text-slate-400">{act.action} • {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-300 italic py-4 text-center">No recent activity.</p>
              )}
            </div>
          </div>

          <div className="card border border-white/50 bg-white/60 backdrop-blur-md shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex justify-between items-center">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link href="/employees" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all font-bold text-slate-700 text-xs">
                <span>Add & Manage Employees</span>
                <ChevronRight size={14} />
              </Link>
              <Link href="/leaves" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all font-bold text-slate-700 text-xs">
                <span>Approve Leaves</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
