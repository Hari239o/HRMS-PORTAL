import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  X
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
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/reports/dashboard-stats`),
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/reports/analytics/monthly?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`),
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/reports/recent-activity`),
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/employees`),
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/employees/star-performers`)
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
          axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5002"}`}/api/attendance`),
          axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5002"}`}/api/leaves`),
          axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5002"}`}/api/salary`),
          axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5002"}`}/api/employees/star-performers`),
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/employees/me`)
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
        url: `${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/salary/generate/${salaryId}`,
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
      await axios.patch(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/employees/${starDeclarationForm.employeeId}/badge`, { starPerformer: starDeclarationForm.badge });
      toast.success('Star Performer declared successfully!');
      fetchData();
    } catch (err) {
      toast.error('Failed to declare star performer');
    }
  };

  const removeStarPerformer = async (id) => {
    if (!window.confirm('Remove this badge?')) return;
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/employees/${id}/badge`, { starPerformer: 'none' });
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
      await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/auth/change-password`, { currentPassword, newPassword });
      toast.success('Password changed successfully! Please use it on your next login.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    }
  };

    const StatCard = ({ title, value, icon: Icon, color, trend }) => {
      const textColor = color ? color.replace('bg-', 'text-') : 'text-indigo-600';
      const bgColor = color ? color.replace('bg-', 'bg-').replace('600', '50').replace('500', '50') : 'bg-indigo-50';
      
      return (
        <div className="group relative rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="p-6 flex flex-col justify-between h-full">
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
      <div className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 group cursor-default w-64 ${highlight ? 'bg-indigo-50/50 border-indigo-300 shadow-md ring-1 ring-indigo-200' : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200'} border`}>
        <div className="flex items-center gap-4">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-slate-200" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-sm ring-1 ring-slate-200">
              {profile.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-0.5">{title}</p>
            <p className="text-sm font-black text-slate-800 leading-tight">{profile.name}</p>
            <p className="text-xs font-medium text-slate-500 truncate max-w-[120px]">{profile.email}</p>
          </div>
        </div>
        <a href={`mailto:${profile.email}`} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100" title={`Email ${profile.name}`}>
          <Mail size={14} />
        </a>
      </div>
    );
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium text-sm">Authenticating Secure Session...</p>
      </div>
    );
  }

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
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // EMPLOYEE VIEW
  if (user && user.role !== 'admin') {
    return (
      <div className="space-y-6 fade-in pb-12">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded">
              Employee Portal
            </span>
            <span className="text-xs text-slate-400">{new Date().toLocaleDateString()}</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Welcome Back, <span className="text-indigo-600">{user.name}</span>
            {user.starPerformer === 'month' && (
              <span className="flex items-center gap-1 text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-white px-3 py-1 rounded-lg shadow-md shadow-amber-500/20">
                <Award size={14} /> Star of the Month
              </span>
            )}
            {user.starPerformer === 'week' && (
              <span className="flex items-center gap-1 text-xs font-black bg-gradient-to-r from-sky-400 to-indigo-500 text-white px-3 py-1 rounded-lg shadow-md shadow-indigo-500/20">
                <Star size={14} /> Star of the Week
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Department: {user.department || 'Operations'}</p>
        </div>

        {starPerformers.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm relative overflow-hidden mb-8">
            <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none">
              <Award size={250} className="transform translate-x-10 -translate-y-10 text-slate-900" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center">
              <div className="md:w-1/3">
                <h2 className="text-3xl font-black mb-2 flex items-center gap-3 text-slate-800">
                  <Star size={32} className="text-yellow-400 drop-shadow-sm" /> Company Wall of Fame
                </h2>
                <p className="text-slate-500 text-sm font-medium max-w-xs leading-relaxed">
                  Honoring our top performers who have demonstrated outstanding dedication and excellence.
                </p>
              </div>
              
              <div className="flex-1 flex flex-wrap gap-4 w-full">
                {starPerformers.map(star => {
                  const isMonth = star.starPerformer === 'month';
                  return (
                    <div key={star.id} className="relative overflow-hidden rounded-2xl p-4 pr-16 flex items-center gap-4 transition-all hover:-translate-y-1 bg-slate-50 border border-slate-200 shadow-sm group">
                      <div className="absolute -right-4 -bottom-4 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform">
                        {isMonth ? <Award size={80} className="text-slate-900" /> : <Star size={80} className="text-slate-900" />}
                      </div>
                      
                      {star.avatar ? (
                        <img src={star.avatar} alt={star.name} className="w-14 h-14 rounded-full object-cover shadow-sm ring-1 ring-slate-200 relative z-10" />
                      ) : (
                        <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl shadow-sm ring-1 ring-slate-200 relative z-10 bg-gradient-to-tr from-indigo-100 to-indigo-50 text-indigo-600">
                          {star.name.charAt(0)}
                        </div>
                      )}
                      
                      <div className="relative z-10">
                        <p className="font-black text-lg text-slate-800">{star.name}</p>
                        <p className={`text-[10px] uppercase tracking-widest font-black flex items-center gap-1 mt-0.5 ${isMonth ? 'text-amber-500' : 'text-sky-500'}`}>
                          {isMonth ? '🌟 Star of the Month' : '⭐ Star of the Week'}
                        </p>
                        {user.id !== star.id && (
                          <div className="mt-4 flex flex-col gap-2">
                            {messageFormOpenId !== star.id ? (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => sendCongratulations(star.id, star.name)}
                                  className="text-xs bg-white hover:bg-slate-100 text-indigo-600 border border-slate-200 transition-colors font-bold py-2 px-4 rounded-xl shadow-sm flex items-center gap-2"
                                >
                                  <Star size={14} /> Quick Wishes
                                </button>
                                <button 
                                  onClick={() => {
                                    setMessageFormOpenId(star.id);
                                    setCustomMessage('');
                                  }}
                                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors font-bold py-2 px-4 rounded-xl shadow-sm flex items-center gap-2"
                                >
                                  <MessageSquare size={14} /> Custom
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                                <input 
                                  type="text" 
                                  value={customMessage}
                                  onChange={(e) => setCustomMessage(e.target.value)}
                                  placeholder="Type your wishes..."
                                  className="text-xs bg-transparent text-slate-800 placeholder-slate-400 px-2 py-1 w-full focus:outline-none"
                                />
                                <button 
                                  onClick={() => sendCongratulations(star.id, star.name, true)}
                                  className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                                  title="Send Message"
                                >
                                  <Send size={14} />
                                </button>
                                <button 
                                  onClick={() => setMessageFormOpenId(null)}
                                  className="text-slate-400 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Cancel"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {user.id === star.id && (
                          <p className="mt-3 text-[10px] bg-indigo-50 text-indigo-700 font-bold py-1.5 px-3 rounded-lg inline-flex items-center gap-1 shadow-sm">
                            <Star size={12} /> That's You! 🎉
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Days Present" value={empStats.presentDays} icon={UserCheck} color="bg-indigo-600" />
          <StatCard title="Total Days Absent" value={empStats.absentDays} icon={UserX} color="bg-rose-600" />
          <StatCard title="Total Half Days" value={empStats.halfDays || 0} icon={Clock} color="bg-orange-500" />
          <StatCard title="Total Working Days" value={empStats.totalWorkingDays} icon={Briefcase} color="bg-slate-600" />
        </div>

        {/* Full width Horizontal Tree */}
        <div className="card border border-slate-100 bg-gradient-to-br from-white to-slate-50/50 mb-6 overflow-x-auto w-full">
          <h3 className="font-black text-slate-800 mb-8 flex items-center justify-center gap-2 min-w-max">
            <Users size={18} className="text-indigo-600" /> Organizational Hierarchy
          </h3>
          <div className="flex flex-col items-center min-w-max pb-8 pt-4">
            {/* Manager Node */}
            <div className="flex flex-col items-center">
              <ProfileCard title="Reporting Manager" profile={employeeDetails?.managerProfile} />
              <div className="w-0.5 h-8 bg-indigo-200"></div>
            </div>
            
            {/* Team Leader Node */}
            <div className="flex flex-col items-center">
               <ProfileCard title="Team Leader" profile={employeeDetails?.teamLeaderProfile || { name: 'Not Assigned' }} />
               {employeeDetails?.teamMembers && employeeDetails.teamMembers.length > 0 && (
                 <div className="w-0.5 h-8 bg-indigo-200"></div>
               )}
            </div>

            {/* Team Members Branches */}
            {employeeDetails?.teamMembers && employeeDetails.teamMembers.length > 0 ? (
              <div className="relative flex justify-center w-full mt-0">
                {/* Horizontal branch line */}
                <div className="absolute top-0 h-0.5 bg-indigo-200" 
                     style={{ 
                       width: employeeDetails.teamMembers.length > 1 ? `calc(100% - ${100 / employeeDetails.teamMembers.length}%)` : '0',
                       left: employeeDetails.teamMembers.length > 1 ? `calc(${50 / employeeDetails.teamMembers.length}%)` : '50%'
                     }}>
                </div>
                
                <div className="flex justify-center w-full" style={{ gap: '2rem' }}>
                  {employeeDetails.teamMembers.map((member) => (
                    <div key={member.id} className="relative flex flex-col items-center flex-1">
                      {/* Vertical line connecting up to the horizontal branch */}
                      <div className="absolute top-0 w-0.5 h-8 bg-indigo-200"></div>
                      <div className="pt-8">
                        <ProfileCard 
                          title={member.id === user.id ? 'You' : member.role.replace('_', ' ')} 
                          profile={member} 
                          highlight={member.id === user.id}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative flex justify-center w-full mt-0">
                <div className="flex justify-center w-full pt-8 relative">
                   <div className="absolute top-0 w-0.5 h-8 bg-indigo-200"></div>
                   <ProfileCard title="You" profile={user} highlight={true} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card bg-white shadow-xl shadow-slate-100/30 border border-slate-100">
            <h3 className="font-black text-lg text-slate-800 mb-6 flex items-center gap-2">
              <FileText size={20} className="text-indigo-600" /> My Generated Payslips
            </h3>
            {payslips.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {payslips.map((pay) => (
                  <div key={pay.id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 uppercase text-sm">{pay.month}</p>
                      <p className="text-xs text-slate-400">Net Payable: ₹{pay.netSalary}</p>
                    </div>
                    <button 
                      onClick={() => downloadPayslip(pay.id, pay.month)}
                      className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all"
                    >
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">
                <FileText size={40} className="mx-auto mb-3 text-slate-200" />
                No Payslips Generated by Geonixa Admin yet.
              </div>
            )}
          </div>

          <div className="space-y-6">
            

            <div className="card border border-slate-100 bg-white">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                 HR Point of Contact
              </h4>
              <ProfileCard title="HR Representative" profile={employeeDetails?.hrProfile} />
            </div>

            <div className="card border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-indigo-600" /> Quick Access
              </h3>
              <div className="space-y-2">
                <Link to="/attendance" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all font-bold text-slate-700 text-sm">
                  <span>Check In / Check Out</span>
                  <ChevronRight size={16} />
                </Link>
                <Link to="/leaves" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all font-bold text-slate-700 text-sm">
                  <span>Request Time Off</span>
                  <ChevronRight size={16} />
                </Link>
                <button 
                  onClick={handleSelfChangePassword}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-all font-bold text-indigo-700 text-sm"
                >
                  <span className="flex items-center gap-2"><Key size={16} /> Change Password</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
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
            <span className="px-3 py-1 bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 shadow-sm">
              <Server size={12} /> Operations
            </span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">Command Center</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Link to="/reports" className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
            <Download size={18} /> Generate Report
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Total Workforce" value={adminStats.totalEmployees} icon={Users} color="bg-indigo-600" />
        <StatCard title="Present Today" value={adminStats.presentToday} icon={UserCheck} color="bg-emerald-600" />
        <StatCard title="Absent Pool" value={adminStats.absentToday} icon={UserX} color="bg-rose-600" />
        <StatCard title="Leave Requests" value={adminStats.leavesToday} icon={Calendar} color="bg-amber-600" />
        <StatCard title="Half Days Today" value={adminStats.halfDaysToday || 0} icon={Clock} color="bg-orange-500" />
      </div>

      <div className="rounded-3xl border border-slate-100 shadow-sm bg-white overflow-hidden mb-6 relative">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 p-8 gap-10">
          <div>
            <h3 className="font-black text-3xl mb-2 flex items-center gap-3 text-slate-800">
              <Star size={32} className="text-yellow-400 drop-shadow-sm" /> Declare Star Performer
            </h3>
            <p className="text-slate-500 text-sm mb-6">Select an employee to feature them on everyone's dashboard directly.</p>
            
            <form onSubmit={declareStarPerformer} className="flex flex-col sm:flex-row gap-3">
              <select 
                className="py-3 px-4 text-sm flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:bg-white focus:border-indigo-300 outline-none transition-colors"
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
                className="py-3 px-4 text-sm w-full sm:w-32 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:bg-white focus:border-indigo-300 outline-none transition-colors"
                value={starDeclarationForm.badge}
                onChange={(e) => setStarDeclarationForm({...starDeclarationForm, badge: e.target.value})}
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all flex-shrink-0">
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm shadow-sm ring-1 ring-slate-200">
                        {star.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight text-slate-800">{star.name}</p>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{star.starPerformer}ly Star</p>
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
        <div className="lg:col-span-2 card border border-slate-100 shadow-xl shadow-slate-100/30 bg-white">
          <h3 className="font-black text-lg text-slate-800 flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-indigo-600" /> Workforce Reliability Analytics
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
          

          <div className="card bg-white border border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-indigo-600" /> Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.length > 0 ? recentActivity.map((act, i) => (
                <div key={i} className="flex items-start gap-3 pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-[10px] font-bold">
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

          <div className="card border border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex justify-between items-center">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link to="/employees" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all font-bold text-slate-700 text-xs">
                <span>Add & Manage Employees</span>
                <ChevronRight size={14} />
              </Link>
              <Link to="/leaves" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all font-bold text-slate-700 text-xs">
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
