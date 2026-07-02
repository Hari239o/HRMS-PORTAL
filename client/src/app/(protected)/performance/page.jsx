"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { AlertTriangle, Trophy, Star, Shield, Award, Send, Users, Smartphone, RefreshCw, Trash2, Download, Search, X, Target, TrendingUp, Sparkles, Clock, Wallet, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { hasAdminAccess, isSuperAdmin, hasApproverAccess } from '@/utils/rbac';

export default function Performance() {
  const { user } = useAuth();
  const isStandardEmployee = !['admin', 'hr', 'manager', 'post_sales', 'post sales'].includes(user?.role);
  const isPostSales = user?.role === 'post_sales' || user?.role === 'post sales';
  const [clearances, setClearances] = useState([]);
  const [selectedClearance, setSelectedClearance] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [isDefaulting, setIsDefaulting] = useState(false);
  const [warningText, setWarningText] = useState('');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [targetData, setTargetData] = useState({ targetCount: 30, achievedCount: 0 });
  const [submissions, setSubmissions] = useState([]);
  
  // Submission Form State
  const [form, setForm] = useState({
    studentName: '',
    domain: '',
    collegeName: '',
    mailId: '',
    phoneNumber: '',
    totalAmount: '',
    amountPaid: '',
    remainingAmount: '',
    remainingAmountDate: '',
    courseType: 'Live',
    courseDuration: '1',
    file: null
  });

  // Admin View Intakes State
  const [adminIntakes, setAdminIntakes] = useState([]);
  const [selectedEmpForIntakes, setSelectedEmpForIntakes] = useState('');

  // Admin Assignment State
  const [adminForm, setAdminForm] = useState({
    employeeId: '',
    targetCount: 30,
    month: new Date().toISOString().substring(0, 7)
  });

  const [employeeSearch, setEmployeeSearch] = useState('');

  const exportToCSV = (dataList, filename) => {
    if (!dataList || dataList.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = ['Student Name', 'Email', 'Phone', 'College', 'Domain', 'Total Amount', 'Amount Paid', 'Remaining Amount', 'Date'];
    const csvRows = [
      headers.join(','),
      ...dataList.map(row => [
        `"${row.studentName || ''}"`,
        `"${row.mailId || ''}"`,
        `"${row.phoneNumber || ''}"`,
        `"${row.collegeName || ''}"`,
        `"${row.domain || ''}"`,
        row.totalAmount || 0,
        row.amountPaid || 0,
        row.remainingAmount || 0,
        `"${new Date(row.date).toLocaleDateString()}"`
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const chartDataMap = submissions.reduce((acc, curr) => {
    const dateStr = new Date(curr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[dateStr]) {
      acc[dateStr] = { date: dateStr, intakes: 0 };
    }
    acc[dateStr].intakes += 1;
    return acc;
  }, {});
  const chartData = Object.values(chartDataMap).reverse();

  const filteredEmployees = employees.filter(emp => 
    (emp.name && emp.name.toLowerCase().includes(employeeSearch.toLowerCase())) || 
    (emp.department && emp.department.toLowerCase().includes(employeeSearch.toLowerCase()))
  );

  const totalIntakes = submissions.filter(s => s.approvalStatus === 'Approved').length;
  const pendingIntakes = submissions.filter(s => !s.approvalStatus || s.approvalStatus === 'Pending').length;
  const progressPercent = targetData.targetCount ? Math.min(Math.round((targetData.achievedCount / targetData.targetCount) * 100), 100) : 0;
  const progressStatus = targetData.achievedCount >= targetData.targetCount ? 'On track' : 'Needs attention';
  const progressTone = targetData.achievedCount >= targetData.targetCount ? 'emerald' : 'amber';

    useEffect(() => {
    if (isPostSales) {
      fetchClearances();
    }
  }, [isPostSales]);

  useEffect(() => {
    fetchPerformance();
    if (hasAdminAccess(user)) {
      fetchWorkforce();
    }
  }, [user?.id, user?.role]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/tasks/performance`);
      setTargetData(res.data.target);
      setSubmissions(res.data.submissions);
    } catch (err) {
      toast.error('Failed to load goal metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkforce = async () => {
    try {
      const res = await api.get(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/employees`);
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  
  const fetchClearances = async () => {
    try {
      const res = await api.get('/api/tasks/submit/clearances');
      setClearances(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!selectedClearance || !paymentAmount) return;
    
    try {
      await api.patch(`/api/tasks/submit/${selectedClearance.id}/update-payment`, {
        additionalPayment: paymentAmount,
        paymentDate: paymentDate || new Date().toISOString()
      });
      toast.success('Payment updated successfully');
      setSelectedClearance(null);
      setPaymentAmount('');
      setPaymentDate('');
      fetchClearances();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update payment');
    }
  };

  
  const handleDefaultPayment = async (e) => {
    e.preventDefault();
    if (!selectedClearance || !warningText) return;
    try {
      await api.patch(`/api/tasks/submit/${selectedClearance.id}/default`, { warning: warningText });
      toast.success('Submission defaulted successfully');
      setSelectedClearance(null);
      setWarningText('');
      setIsDefaulting(false);
      fetchClearances();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to default submission');
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    
    // Validation for remaining amount date
    if (form.remainingAmount > 0) {
      if (!form.remainingAmountDate) {
        toast.error('Please select a due date for the remaining amount.');
        return;
      }
      
      const selectedDate = new Date(form.remainingAmountDate);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Reset time to midnight for accurate day calculation
      
      const diffTime = selectedDate.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 10) {
        toast.error('The remaining amount due date must be within 10 days from today.');
        return;
      } else if (diffDays < 0) {
        toast.error('The due date cannot be in the past.');
        return;
      }
    }

    try {
      await api.post(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/tasks/submit`, form);
      toast.success('Sale registered successfully!');
      setForm({ studentName: '', domain: '', collegeName: '', mailId: '', phoneNumber: '', totalAmount: '', amountPaid: '', remainingAmount: '', remainingAmountDate: '' });
      fetchPerformance();
    } catch (err) {
      toast.error('Submission failed');
    }
  };

  const handleTargetAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/tasks/target`, adminForm);
      toast.success('Target provisioned successfully.');
      fetchPerformance();
    } catch (err) {
      toast.error('Provisioning failed');
    }
  };

  const grantBadge = async (id, level) => {
    try {
      await api.patch(`/api/employees/${id}/badge`, { starPerformer: level });
      toast.success(`Badge updated to ${level}`);
      fetchWorkforce();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const unlockDevice = async (id) => {
    try {
      await api.patch(`/api/employees/${id}/reset-device`);
      toast.success('Hardware pair cleared.');
      fetchWorkforce();
    } catch (err) {
      toast.error('Unlock failed');
    }
  };

  const fetchAdminIntakes = async (empId) => {
    setSelectedEmpForIntakes(empId);
    if (!empId) {
      setAdminIntakes([]);
      return;
    }
    try {
      const res = await api.get(`/api/tasks/performance?employeeId=${empId}`);
      setAdminIntakes(res.data.submissions || []);
    } catch (err) {
      toast.error('Failed to load employee intakes');
    }
  };

  const handleDeleteSubmission = async (id, isAdminView = false) => {
    if (!window.confirm('Are you sure you want to delete this intake?')) return;
    try {
      await api.delete(`/api/tasks/submit/${id}`);
      toast.success('Intake deleted successfully');
      if (isAdminView) {
        fetchAdminIntakes(selectedEmpForIntakes);
      } else {
        fetchPerformance();
      }
    } catch (err) {
      toast.error('Failed to delete intake');
    }
  };

  const handleUpdateStatus = async (id, field, value, isAdminView = false) => {
    try {
      await api.patch(`/api/tasks/submit/${id}/status`, { [field]: value });
      toast.success('Status updated');
      if (isAdminView) {
        fetchAdminIntakes(selectedEmpForIntakes);
      } else {
        fetchPerformance();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] animate-in fade-in duration-1000">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-4 border-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          <div className="absolute inset-4 rounded-full border-b-4 border-pink-500 animate-spin" style={{ animationDuration: '2s' }}></div>
          <Trophy className="absolute inset-0 m-auto text-blue-600 animate-pulse" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      
      {isStandardEmployee && (
  <>
  {/* HEADER SECTION WITH GLASSMORPHISM */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-10 shadow-2xl border border-slate-800 animate-in slide-in-from-top-8 duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight flex items-center gap-3">
              <Trophy className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" size={36} /> 
              Performance Intelligence
            </h1>
            <p className="text-slate-400 mt-2 text-sm font-medium flex items-center gap-2">
              <Sparkles size={14} className="text-blue-400" />
              Real-time goal tracking, gamified incentives, and quota management.
            </p>
          </div>
          <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-inner">
            <span className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-2">
              <TrendingUp size={16} /> Live Data Sync
            </span>
          </div>
        </div>
      </div>

      {/* METRICS WIDGETS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* Widget 1: Monthly Target */}
        <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white hover:border-blue-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden animate-in zoom-in-95 duration-500 delay-100">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/70">Monthly Quota</p>
              <h2 className="mt-2 text-4xl font-black text-slate-800">{targetData.achievedCount}<span className="text-2xl text-slate-400">/{targetData.targetCount}</span></h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">Sales goal achieved</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-3.5 text-white shadow-lg shadow-blue-500/30 transform transition-transform group-hover:rotate-12">
              <Target size={24} />
            </div>
          </div>
          <div className="relative z-10 mt-6">
            <div className="h-3 overflow-hidden rounded-full bg-slate-100 shadow-inner">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out relative overflow-hidden" 
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.15em] text-blue-600 flex justify-between">
              <span>{progressPercent}% Complete</span>
              {progressPercent >= 100 && <span className="text-emerald-500 animate-pulse">🔥 Target Hit</span>}
            </p>
          </div>
        </div>

        {/* Widget 2: Total Intakes */}
        <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white hover:border-sky-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden animate-in zoom-in-95 duration-500 delay-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500/70">Total Approved Intakes</p>
              <h2 className="mt-2 text-4xl font-black text-slate-800">{totalIntakes}</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">{pendingIntakes > 0 ? `${pendingIntakes} pending approval` : 'Logged this month'}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-3.5 text-white shadow-lg shadow-sky-500/30 transform transition-transform group-hover:rotate-12">
              <RefreshCw size={24} />
            </div>
          </div>
          <div className="relative z-10 mt-6 h-12 flex items-end">
             <div className="w-full h-px bg-gradient-to-r from-sky-200 to-transparent"></div>
          </div>
        </div>

        {/* Widget 3: Team Coverage */}
        <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white hover:border-emerald-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden animate-in zoom-in-95 duration-500 delay-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/70">Coverage Focus</p>
              <h2 className="mt-2 text-4xl font-black text-slate-800">{hasAdminAccess(user) ? employees.length : 'Self'}</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">{hasAdminAccess(user) ? 'Active employees monitored' : 'Individual KPI dashboard'}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3.5 text-white shadow-lg shadow-emerald-500/30 transform transition-transform group-hover:rotate-12">
              <Users size={24} />
            </div>
          </div>
          <div className="relative z-10 mt-6 h-12 flex items-end">
             <div className="w-full h-px bg-gradient-to-r from-emerald-200 to-transparent"></div>
          </div>
        </div>

        {/* Widget 4: Current Status */}
        <div className={`group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white transition-all duration-500 hover:-translate-y-1 overflow-hidden animate-in zoom-in-95 duration-500 delay-400 ${progressTone === 'emerald' ? 'hover:border-emerald-200 hover:shadow-emerald-500/20' : 'hover:border-amber-200 hover:shadow-amber-500/20'}`}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 ${progressTone === 'emerald' ? 'bg-emerald-100' : 'bg-amber-100'}`}></div>
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${progressTone === 'emerald' ? 'text-emerald-500/70' : 'text-amber-500/70'}`}>Current Status</p>
              <h2 className="mt-2 text-2xl md:text-3xl font-black text-slate-800 leading-tight">{progressStatus}</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">{hasAdminAccess(user) ? 'Review organizational progress' : 'Stay aligned with your quota'}</p>
            </div>
            <div className={`rounded-2xl p-3.5 text-white shadow-lg transform transition-transform group-hover:rotate-12 ${progressTone === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30' : 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30'}`}>
              <Shield size={24} />
            </div>
          </div>
          <div className="relative z-10 mt-6 h-12 flex items-end">
             <div className={`w-full h-px bg-gradient-to-r to-transparent ${progressTone === 'emerald' ? 'from-emerald-200' : 'from-amber-200'}`}></div>
          </div>
        </div>
      </div>

      {/* TRENDS CHART */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8 animate-in slide-in-from-bottom-8 duration-700 delay-300">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-black text-2xl text-slate-800 flex items-center gap-3">
              <TrendingUp size={28} className="text-blue-500" /> Intake Velocity Trends
            </h3>
            <p className="text-sm font-semibold text-slate-400 mt-1">Daily submission metrics across the month</p>
          </div>
        </div>
        <div className="h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIntakes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 'bold'}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 'bold'}} axisLine={false} tickLine={false} allowDecimals={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
                  labelStyle={{ fontWeight: '900', color: '#1e293b', marginBottom: '4px' }}
                  itemStyle={{ fontWeight: 'bold', color: '#6366f1' }}
                />
                <Area type="monotone" dataKey="intakes" stroke="url(#colorIntakes)" strokeWidth={4} fillOpacity={1} fill="url(#colorIntakes)" activeDot={{ r: 8, strokeWidth: 0, fill: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
              <TrendingUp size={32} className="opacity-20 mb-3" />
              <p className="text-sm font-bold tracking-wide">NOT ENOUGH DATA TO PLOT TRENDS</p>
            </div>
          )}
        </div>
      </div>

      
  </>
)}
{isStandardEmployee && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700 delay-500">
          
          
                    {/* DATA ENTRY FORM */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-white to-slate-50 rounded-3xl shadow-xl border border-white p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              
              <h3 className="font-black text-slate-800 text-xl flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                  <Send size={20} />
                </div>
                Log New Transaction
              </h3>
              
              <form onSubmit={handleStudentSubmit} className="space-y-5">
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Student Full Name</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                    value={form.studentName}
                    onChange={(e) => setForm({...form, studentName: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Domain specialisation</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                    value={form.domain}
                    onChange={(e) => setForm({...form, domain: e.target.value})}
                    placeholder="e.g. Data Science"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">College / Institution</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                    value={form.collegeName}
                    onChange={(e) => setForm({...form, collegeName: e.target.value})}
                    placeholder="e.g. Oxford University"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                    value={form.mailId}
                    onChange={(e) => setForm({...form, mailId: e.target.value})}
                    placeholder="student@example.com"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Total Invoice Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                    value={form.totalAmount}
                    onChange={(e) => setForm({...form, totalAmount: e.target.value, remainingAmount: e.target.value - (form.amountPaid || 0)})}
                    placeholder="e.g. 50000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Amount Paid (₹)</label>
                    <input 
                      type="number" 
                      required 
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                      value={form.amountPaid}
                      onChange={(e) => setForm({...form, amountPaid: e.target.value, remainingAmount: (form.totalAmount || 0) - e.target.value})}
                      placeholder="e.g. 10000"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Remaining (₹)</label>
                    <input 
                      type="number" 
                      readOnly
                      className="w-full bg-slate-100/50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-black text-slate-600 outline-none cursor-not-allowed"
                      value={form.remainingAmount}
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Due Date for Remaining</label>
                  <input 
                    type="date" 
                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                    value={form.remainingAmountDate}
                    onChange={(e) => setForm({...form, remainingAmountDate: e.target.value})}
                  />
                </div>
                
                <button type="submit" className="w-full mt-4 relative overflow-hidden group rounded-xl p-[2px]">
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-xl opacity-70 group-hover:opacity-100 blur-sm transition-opacity duration-300"></span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-xl animate-gradient-x"></span>
                  <div className="relative flex items-center justify-center gap-2 bg-blue-600 px-4 py-3.5 rounded-xl transition-all duration-300 group-hover:bg-opacity-0">
                    <Send size={16} className="text-white" />
                    <span className="font-bold text-sm text-white tracking-wide">Submit Transaction</span>
                  </div>
                </button>
              </form>
            </div>
          </div>

          {/* RECENT INTAKES TABLE */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden h-full flex flex-col">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h3 className="font-black text-2xl text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                    <Star size={24} />
                  </div>
                  Recent Intakes
                </h3>
                <button 
                  onClick={() => exportToCSV(submissions, `my_intakes_export_${new Date().getTime()}.csv`)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all group"
                >
                  <Download size={16} className="text-blue-500 group-hover:-translate-y-0.5 transition-transform" /> 
                  Export CSV
                </button>
              </div>
              
              <div className="overflow-x-auto flex-1 p-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-5">Student / Contact</th>
                      <th className="px-6 py-5">Domain / College</th>
                      <th className="px-6 py-5">Payment Status</th>
                      <th className="px-6 py-5 text-center">Process Check</th>
                      <th className="px-6 py-5 text-right">Date / Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-medium text-slate-700">
                    {submissions.length > 0 ? submissions.map((sub) => (
                      <tr key={sub.id} className={`transition-all border-b border-slate-50 last:border-0 group ${sub.approvalStatus === 'Defaulted' ? 'bg-red-200 hover:bg-red-300' : sub.approvalStatus === 'Approved' && sub.remainingAmount === 0 ? 'bg-green-200 hover:bg-green-300' : 'hover:bg-blue-50/30'}`}>
                        <td className="px-6 py-5">
                          <p className="font-black text-sm text-slate-800 mb-1">{sub.studentName}</p>
                          <div className="mb-2">
                            {sub.approvalStatus === 'Defaulted' && (
                              <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider rounded border border-rose-700 block w-max mb-1">Defaulted / Withdrawn</span>
                            )}
                            {sub.approvalStatus === 'Defaulted' && sub.defaultWarning && (
                              <p className="mb-2 text-[10px] text-rose-700 font-bold max-w-xs">{sub.defaultWarning}</p>
                            )}
                            {sub.approvalStatus === 'Approved' && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded border border-emerald-200">Approved</span>
                            )}
                            {sub.approvalStatus === 'Rejected' && (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-wider rounded border border-rose-200">Rejected</span>
                            )}
                            {(!sub.approvalStatus || sub.approvalStatus === 'Pending') && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-wider rounded border border-amber-200">Pending Approval</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{sub.mailId}</span>
                            <span>•</span>
                            <span>{sub.phoneNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-700 mb-0.5">{sub.domain}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">{sub.collegeName}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            {sub.remainingAmount > 0 ? (
                              <>
                                <div className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded">
                                  <span className="text-[10px] font-bold text-slate-500">Total:</span>
                                  <span className="font-black text-slate-800">₹{sub.totalAmount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center bg-emerald-50 px-2 py-1 rounded border border-emerald-100/50">
                                  <span className="text-[10px] font-bold text-emerald-600">Paid:</span>
                                  <span className="font-black text-emerald-700">₹{sub.amountPaid || 0}</span>
                                </div>
                                <div className="flex justify-between items-center bg-rose-50 px-2 py-1 rounded border border-rose-100/50">
                                  <span className="text-[10px] font-bold text-rose-500">Due {sub.remainingAmountDate ? `(${new Date(sub.remainingAmountDate).toLocaleDateString()})` : ''}:</span>
                                  <span className="font-black text-rose-600">₹{sub.remainingAmount}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between items-center bg-emerald-50 px-2 py-2 rounded border border-emerald-200 shadow-sm">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Total Amount Paid:</span>
                                <span className="font-black text-emerald-700">₹{sub.amountPaid || sub.totalAmount}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2 items-center">
                            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner w-max">
                              <button onClick={() => handleUpdateStatus(sub.id, 'callStatus', 'Answered')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${sub.callStatus === 'Answered' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}>Call Done</button>
                              <button onClick={() => handleUpdateStatus(sub.id, 'callStatus', 'Dropped')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${sub.callStatus === 'Dropped' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}>No Ans</button>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner w-max">
                              <button onClick={() => handleUpdateStatus(sub.id, 'paymentStatus', 'Paid')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${sub.paymentStatus === 'Paid' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}>Fee Paid</button>
                              <button onClick={() => handleUpdateStatus(sub.id, 'paymentStatus', 'Dropped')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${sub.paymentStatus === 'Dropped' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}>Dropped</button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex flex-col items-end gap-3">
                            <span className="text-slate-400 font-bold bg-slate-50 border border-slate-100 px-2 py-1 rounded text-[10px]">{new Date(sub.date).toLocaleDateString()}</span>
                            <button 
                              onClick={() => handleDeleteSubmission(sub.id)}
                              className="w-8 h-8 rounded-full bg-white border border-slate-200 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/30 transition-all opacity-0 group-hover:opacity-100"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="text-center py-20 bg-slate-50/50">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <Star size={40} className="opacity-20 mb-4" />
                            <p className="font-bold">No students reported yet.</p>
                            <p className="text-[10px] uppercase tracking-wider mt-1">Start logging your intakes today</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN CONTROL PANEL OVERHAUL */}
      {hasAdminAccess(user) && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 delay-500 mt-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-b from-white to-slate-50 rounded-3xl shadow-xl border border-white p-8 relative overflow-hidden h-full">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                <h3 className="font-black text-slate-800 text-xl flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                    <Shield size={20} />
                  </div>
                  Provision Quota
                </h3>
                <form onSubmit={handleTargetAssign} className="space-y-5">
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-emerald-500">Select Employee</label>
                    <div className="relative">
                      <select 
                        required 
                        className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm appearance-none"
                        value={adminForm.employeeId}
                        onChange={(e) => setAdminForm({...adminForm, employeeId: e.target.value})}
                      >
                        <option value="">Choose worker...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-emerald-500">Target Baseline</label>
                    <input 
                      type="number" 
                      required 
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm"
                      value={adminForm.targetCount}
                      onChange={(e) => setAdminForm({...adminForm, targetCount: e.target.value})}
                      placeholder="30"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-emerald-500">Select Month</label>
                    <input 
                      type="month" 
                      required 
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm"
                      value={adminForm.month}
                      onChange={(e) => setAdminForm({...adminForm, month: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="w-full mt-4 relative overflow-hidden group rounded-xl p-[2px]">
                    <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl opacity-70 group-hover:opacity-100 blur-sm transition-opacity duration-300"></span>
                    <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl"></span>
                    <div className="relative flex items-center justify-center gap-2 bg-emerald-600 px-4 py-3.5 rounded-xl transition-all duration-300 group-hover:bg-opacity-0">
                      <Shield size={16} className="text-white" />
                      <span className="font-bold text-sm text-white tracking-wide">Set Quota Threshold</span>
                    </div>
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2 relative rounded-3xl shadow-2xl border border-white/60 overflow-hidden bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 backdrop-blur-2xl">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at center, #6366f1 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="p-8 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div>
                  <h3 className="font-black text-2xl text-white flex items-center gap-3">
                    <Users size={24} className="text-blue-400" /> Devices & Star Performers
                  </h3>
                  <p className="text-blue-200/70 text-xs font-semibold mt-1">Manage workforce biometrics, badges, and device links</p>
                </div>
                <div className="relative max-w-xs w-full">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
                  <input 
                    type="text" 
                    placeholder="Search workforce..." 
                    className="w-full pl-11 pr-4 py-3 text-sm border-2 border-blue-500/30 rounded-xl outline-none focus:border-blue-400 transition-colors bg-white/5 backdrop-blur-md font-semibold text-white placeholder:text-blue-300/50"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto relative z-10 p-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-blue-300 text-[10px] font-black uppercase tracking-widest border-b border-blue-500/20">
                      <th className="px-6 py-4">Employee Data</th>
                      <th className="px-6 py-4">Honor Badge</th>
                      <th className="px-6 py-4 text-center">Recognition Actions</th>
                      <th className="px-6 py-4 text-right">Security Pairing</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-medium text-slate-300">
                    {filteredEmployees.length > 0 ? filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-white/5 transition-all border-b border-blue-500/10 last:border-0 group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/30">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-sm text-white">{emp.name}</p>
                              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">{emp.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {emp.starPerformer && emp.starPerformer !== 'none' ? (
                            <div className="relative inline-block">
                              <div className="absolute inset-0 bg-amber-400 rounded-lg blur-md opacity-30"></div>
                              <span className="relative px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black rounded-lg flex items-center gap-1.5 w-max border border-amber-400 shadow-xl uppercase tracking-widest text-[9px]">
                                <Star size={12} className="fill-white" /> {emp.starPerformer} Star
                              </span>
                            </div>
                          ) : (
                            <span className="text-blue-400/50 font-bold text-[10px] uppercase tracking-widest bg-white/5 border border-white/5 px-3 py-1 rounded-md">None</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex gap-2 items-center justify-center">
                            <button onClick={() => grantBadge(emp.id, 'week')} className="px-3 py-1.5 bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white border border-blue-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm transition-all hover:-translate-y-0.5">Week</button>
                            <button onClick={() => grantBadge(emp.id, 'month')} className="px-3 py-1.5 bg-sky-500/20 text-sky-300 hover:bg-sky-500 hover:text-white border border-sky-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm transition-all hover:-translate-y-0.5">Month</button>
                            <button onClick={() => grantBadge(emp.id, 'none')} className="px-3 py-1.5 bg-white/5 text-slate-400 hover:bg-rose-500 hover:text-white border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm transition-all hover:-translate-y-0.5">Clear</button>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          {emp.deviceId ? (
                            <div className="flex items-center justify-end gap-3">
                              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/30">
                                <Smartphone size={12} /> Linked
                              </span>
                              <button 
                                onClick={() => unlockDevice(emp.id)} 
                                className="text-[10px] text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-rose-500/30 transition-all hover:-translate-y-0.5 border border-rose-400"
                              >
                                <X size={12} strokeWidth={3} /> Unlink
                              </button>
                            </div>
                          ) : (
                            <span className="text-blue-400/50 font-bold text-[10px] uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 inline-flex items-center gap-1.5">
                              <Smartphone size={12} className="opacity-50" /> Unpaired
                            </span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="text-center py-20 text-blue-300/50 font-semibold bg-white/5">
                          <div className="flex flex-col items-center gap-3">
                            <Users size={40} className="opacity-20" />
                            <p>No workforce records found.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mt-8">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h3 className="font-black text-2xl text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                  <Star size={24} />
                </div>
                Employee Intelligence Log
              </h3>
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <select 
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
                    value={selectedEmpForIntakes}
                    onChange={(e) => fetchAdminIntakes(e.target.value)}
                  >
                    <option value="">-- Master view: Select Employee --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">▼</div>
                </div>
                <button 
                  onClick={() => exportToCSV(adminIntakes, `intakes_export_${new Date().getTime()}.csv`)}
                  className="flex w-full md:w-auto items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5"
                >
                  <Download size={16} /> Export Data
                </button>
              </div>
            </div>
            
            {selectedEmpForIntakes ? (
              <div className="overflow-x-auto p-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                      <th className="px-6 py-5">Entity</th>
                      <th className="px-6 py-5">Contact Details</th>
                      <th className="px-6 py-5">Financial State</th>
                      <th className="px-6 py-5 text-center">Operations</th>
                      <th className="px-6 py-5 text-right">Sys Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                    {adminIntakes.length > 0 ? adminIntakes.map((sub) => (
                      <tr key={sub.id} className={`transition-all group ${sub.approvalStatus === 'Defaulted' ? 'bg-red-200 hover:bg-red-300' : sub.approvalStatus === 'Approved' && sub.remainingAmount === 0 ? 'bg-green-200 hover:bg-green-300' : 'hover:bg-blue-50/30'}`}>
                        <td className="px-6 py-5">
                          <p className="font-black text-sm text-slate-800 mb-0.5">{sub.studentName}</p>
                          <p className="font-bold text-blue-600 text-[10px] uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded w-max">{sub.domain}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{sub.collegeName}</p>
                          {sub.approvalStatus === 'Defaulted' && (
                            <div className="mt-2">
                              <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider rounded border border-rose-700 block w-max mb-1">Defaulted / Withdrawn</span>
                              {sub.defaultWarning && <p className="mt-1 text-[10px] text-rose-700 font-bold max-w-[200px]">{sub.defaultWarning}</p>}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-700 mb-0.5">{sub.mailId}</p>
                          <p className="text-[10px] text-slate-400">{sub.phoneNumber}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1 max-w-[200px]">
                            {sub.remainingAmount > 0 ? (
                              <>
                                <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total</span>
                                  <span className="font-black text-slate-800">₹{sub.totalAmount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center bg-emerald-50 px-2 py-1.5 rounded border border-emerald-100">
                                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Cleared</span>
                                  <span className="font-black text-emerald-700">₹{sub.amountPaid || 0}</span>
                                </div>
                                <div className="flex justify-between items-center bg-rose-50 px-2 py-1.5 rounded border border-rose-100">
                                  <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest truncate">Due {sub.remainingAmountDate ? `(${new Date(sub.remainingAmountDate).toLocaleDateString()})` : ''}</span>
                                  <span className="font-black text-rose-600">₹{sub.remainingAmount}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between items-center bg-emerald-50 px-2 py-2 rounded border border-emerald-200 shadow-sm">
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest truncate">Total Amount Paid</span>
                                <span className="font-black text-emerald-700">₹{sub.amountPaid || sub.totalAmount}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2 items-center">
                            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner w-max">
                              <button onClick={() => handleUpdateStatus(sub.id, 'callStatus', 'Answered', true)} className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${sub.callStatus === 'Answered' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}>Answered</button>
                              <button onClick={() => handleUpdateStatus(sub.id, 'callStatus', 'Dropped', true)} className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${sub.callStatus === 'Dropped' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}>Missed</button>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner w-max">
                              <button onClick={() => handleUpdateStatus(sub.id, 'paymentStatus', 'Paid', true)} className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${sub.paymentStatus === 'Paid' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}>Collected</button>
                              <button onClick={() => handleUpdateStatus(sub.id, 'paymentStatus', 'Dropped', true)} className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${sub.paymentStatus === 'Dropped' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}>Lost</button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex flex-col items-end gap-3">
                            <span className="text-slate-400 font-bold bg-slate-50 border border-slate-100 px-2 py-1 rounded text-[10px]">{new Date(sub.date).toLocaleDateString()}</span>
                            <button 
                              onClick={() => handleDeleteSubmission(sub.id, true)}
                              className="w-8 h-8 rounded-full bg-white border border-slate-200 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/30 transition-all opacity-0 group-hover:opacity-100"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="text-center py-24 bg-slate-50/50">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <div className="p-4 bg-slate-100 rounded-full mb-4">
                              <Star size={32} className="text-slate-300" />
                            </div>
                            <p className="font-bold text-sm">No records found for this employee.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-24 bg-slate-50/50 flex flex-col items-center justify-center">
                <Search size={48} className="text-blue-200 mb-4" />
                <p className="text-slate-500 font-bold">Select a profile above to pull records</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isPostSales && (() => {
        const pendingClearances = clearances.filter(c => c.remainingAmount > 0);
        const completedClearances = clearances.filter(c => c.remainingAmount === 0);
        
        const totalRevenueCollected = clearances.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
        const totalRevenuePending = pendingClearances.reduce((sum, c) => sum + (c.remainingAmount || 0), 0);
        
        // Group pending by employee
        const pendingByEmployee = {};
        pendingClearances.forEach(c => {
          if (!pendingByEmployee[c.employeeName]) {
            pendingByEmployee[c.employeeName] = 0;
          }
          pendingByEmployee[c.employeeName] += (c.remainingAmount || 0);
        });
        
        return (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 mb-12">
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl"></div>
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center relative z-10">
                <Shield size={28} />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-slate-400">Total Cleared Revenue</p>
                <h3 className="text-2xl font-black text-slate-800">₹{totalRevenueCollected.toLocaleString()}</h3>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full blur-2xl"></div>
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center relative z-10">
                <Wallet size={28} />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-slate-400">Total Pending Revenue</p>
                <h3 className="text-2xl font-black text-slate-800">₹{totalRevenuePending.toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-700 col-span-1 md:col-span-3">
              <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-widest flex items-center gap-2">
                <Users size={16} className="text-blue-400" />
                Employee Wise Revenue Analytics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(
                  clearances.reduce((acc, sub) => {
                    const name = sub.employeeName || 'Unknown';
                    if (!acc[name]) acc[name] = { total: 0, received: 0, pending: 0 };
                    acc[name].total += (sub.totalAmount || 0);
                    acc[name].received += (sub.amountPaid || 0);
                    acc[name].pending += (sub.remainingAmount || 0);
                    return acc;
                  }, {})
                ).map(([emp, stats]) => (
                  <div key={emp} className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50">
                    <span className="text-sm font-bold text-white mb-3 block border-b border-slate-700 pb-2">{emp}</span>
                    <div className="flex justify-between text-xs mt-2">
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-widest text-[9px]">Total</span>
                        <span className="font-medium text-slate-200">₹{stats.total.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-widest text-[9px]">Received</span>
                        <span className="font-medium text-emerald-400">₹{stats.received.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-widest text-[9px]">Pending</span>
                        <span className="font-medium text-amber-400">₹{stats.pending.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Clearances Box */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-2xl text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                    <Wallet size={20} />
                  </div>
                  Pending Clearances
                </h3>
                <p className="text-sm font-semibold text-slate-400 mt-1">Manage and update payments for approved transactions</p>
              </div>
            </div>
            
            {pendingClearances.length === 0 ? (
              <div className="bg-slate-50/50 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-700 mb-1">No pending clearances!</h3>
                <p className="text-slate-500 font-medium text-sm">All approved transactions have been fully paid.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Employee</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Student Info</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Financials</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingClearances.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-700">{format(new Date(sub.date), 'dd MMM yyyy')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                              {sub.employeeName.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-slate-800">{sub.employeeName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-800">{sub.studentName}</p>
                          <p className="text-xs font-semibold text-slate-500">{sub.domain} • {sub.collegeName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded-md w-max">
                              Paid: ₹{sub.amountPaid?.toLocaleString()}
                            </span>
                            <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-md w-max">
                              Total: ₹{sub.totalAmount?.toLocaleString()}
                            </span>
                            <span className="text-xs font-bold bg-red-50 text-red-700 px-2 py-1 rounded-md w-max">
                              Remaining: ₹{sub.remainingAmount?.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right space-y-2">
                          <button 
                            onClick={() => setSelectedClearance(sub)}
                            className="w-full px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl transition-colors inline-flex justify-center items-center gap-2 font-bold text-xs"
                          >
                            <Wallet size={14} /> Update Payment
                          </button>
                          <button 
                            onClick={() => handleDeleteSubmission(sub.id, true)}
                            className="w-full px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-colors inline-flex justify-center items-center gap-2 font-bold text-xs"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Completed Clearances Box */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-2xl text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                    <Shield size={20} />
                  </div>
                  Completed Clearances
                </h3>
                <p className="text-sm font-semibold text-slate-400 mt-1">Fully paid and resolved transactions</p>
              </div>
            </div>
            
            {completedClearances.length === 0 ? (
              <div className="bg-slate-50/50 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-700 mb-1">No completed clearances yet.</h3>
                <p className="text-slate-500 font-medium text-sm">Clear pending payments to see them here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse opacity-75 hover:opacity-100 transition-opacity">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Employee</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Student Info</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Final Financials</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedClearances.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-700">{format(new Date(sub.date), 'dd MMM yyyy')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                              {sub.employeeName.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-slate-600">{sub.employeeName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-600">{sub.studentName}</p>
                          <p className="text-xs font-semibold text-slate-400">{sub.domain} • {sub.collegeName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md w-max border border-emerald-100">
                              Fully Paid: ₹{sub.totalAmount?.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDeleteSubmission(sub.id, true)}
                            className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-colors inline-flex justify-center items-center gap-2 font-bold text-xs"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedClearance && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                <div className={`absolute top-0 left-0 w-full h-1 ${isDefaulting ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-800">
                    {isDefaulting ? 'Mark as Defaulted' : 'Update Payment'}
                  </h3>
                  <button 
                    onClick={() => { setSelectedClearance(null); setPaymentAmount(''); setPaymentDate(''); setIsDefaulting(false); setWarningText(''); }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={isDefaulting ? handleDefaultPayment : handleUpdatePayment} className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm font-bold text-slate-700 mb-2">Student: {selectedClearance.studentName}</p>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-600">Total Paid: ₹{selectedClearance.amountPaid?.toLocaleString()}</span>
                      <span className="text-slate-400">Date: {format(new Date(selectedClearance.lastPaymentDate || selectedClearance.updatedAt || selectedClearance.date), 'dd MMM')}</span>
                    </div>
                    <p className="text-sm font-black text-rose-600 mt-2">Remaining Balance: ₹{selectedClearance.remainingAmount?.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <input 
                      type="checkbox" 
                      id="defaultToggle" 
                      checked={isDefaulting}
                      onChange={(e) => setIsDefaulting(e.target.checked)}
                      className="w-4 h-4 text-rose-600 bg-slate-100 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                    />
                    <label htmlFor="defaultToggle" className="text-sm font-bold text-slate-700 cursor-pointer">
                      Application Withdrawn / Default Payment
                    </label>
                  </div>

                  {!isDefaulting ? (
                    <div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Payment Amount (₹)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            max={selectedClearance.remainingAmount}
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-4 font-medium transition-all"
                            placeholder="Enter amount"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Date Received</label>
                          <input
                            type="date"
                            required
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-4 font-medium transition-all"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-lg shadow-blue-500/30"
                      >
                        Confirm Payment
                      </button>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-rose-600">Description / Warning Message</label>
                      <textarea
                        required
                        rows="3"
                        value={warningText}
                        onChange={(e) => setWarningText(e.target.value)}
                        className="w-full bg-rose-50 border border-rose-200 text-rose-900 placeholder-rose-400 text-sm rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent block p-4 font-medium transition-all"
                        placeholder="State the reason for default or withdrawal..."
                      />
                      <button
                        type="submit"
                        className="w-full mt-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2"
                      >
                        <AlertTriangle size={18} /> Submit Default Notice
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
        );
      })()}
    </div>
  );
}