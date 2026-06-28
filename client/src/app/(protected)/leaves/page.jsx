"use client";

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { 
  Plus, Calendar, Clock, CheckCircle2, XCircle, Info, MessageSquare, AlertTriangle, 
  ShieldAlert, Search, Filter, Activity, Download, ArrowRight, Paperclip
} from 'lucide-react';

const Leaves = () => {
  const { user } = useAuth();
  
  // Tabs: 'leaves' | 'problems'
  const [activeTab, setActiveTab] = useState('leaves');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Pending, Approved/Resolved, Rejected

  // Leaves State
  const [leaves, setLeaves] = useState([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    type: 'Casual Leave',
    fromDate: '',
    toDate: '',
    reason: '',
    document: null
  });

  // Problems State
  const [problems, setProblems] = useState([]);
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [problemFormData, setProblemFormData] = useState({
    category: 'IT Support',
    title: '',
    description: '',
    priority: 'Medium',
    document: null
  });

  useEffect(() => {
    fetchLeaves();
    fetchProblems();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await api.get(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/leaves`);
      setLeaves(res.data);
    } catch (err) {
      toast.error('Failed to fetch leaves');
    }
  };

  const fetchProblems = async () => {
    try {
      const res = await api.get(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/problems`);
      setProblems(res.data);
    } catch (err) {
      toast.error('Failed to fetch problems');
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('type', leaveFormData.type);
      formData.append('fromDate', leaveFormData.fromDate);
      formData.append('toDate', leaveFormData.toDate);
      formData.append('reason', leaveFormData.reason);
      if (leaveFormData.document) {
        formData.append('document', leaveFormData.document);
      }
      
      await api.post(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/leaves`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Leave application submitted successfully');
      setShowLeaveForm(false);
      setLeaveFormData({ type: 'Casual Leave', fromDate: '', toDate: '', reason: '', document: null });
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to submit leave application');
    }
  };

  const handleProblemSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('category', problemFormData.category);
      formData.append('title', problemFormData.title);
      formData.append('description', problemFormData.description);
      formData.append('priority', problemFormData.priority);
      if (problemFormData.document) {
        formData.append('document', problemFormData.document);
      }

      await api.post(`/api/problems`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Issue raised successfully. Our team will review it.');
      setShowProblemForm(false);
      setProblemFormData({ category: 'IT Support', title: '', description: '', priority: 'Medium', document: null });
      fetchProblems();
    } catch (err) {
      toast.error('Failed to raise problem');
    }
  };

  const handleUpdateLeaveStatus = async (id, status) => {
    try {
      await api.put(`/api/leaves/${id}/status`, { status });
      toast.success(`Leave ${status}`);
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to update leave status');
    }
  };

  const handleUpdateProblemStatus = async (id, status) => {
    try {
      await api.put(`/api/problems/${id}/status`, { status });
      toast.success(`Problem marked as ${status}`);
      fetchProblems();
    } catch (err) {
      toast.error('Failed to update problem status');
    }
  };

  // Helper for Initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Filtering Logic
  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch = leave.type?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          leave.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          leave.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || leave.status === statusFilter || 
                          (statusFilter === 'Approved/Resolved' && leave.status === 'Approved');
    return matchesSearch && matchesStatus;
  });

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          problem.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          problem.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          problem.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || problem.status === statusFilter || 
                          (statusFilter === 'Approved/Resolved' && problem.status === 'Resolved');
    return matchesSearch && matchesStatus;
  });

  // Admin Quick Stats
  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;
  const openProblemsCount = problems.filter(p => p.status === 'Pending').length;

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Critical': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Low': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200'; // Medium
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto">
      
      {/* Enterprise Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-indigo-600 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-indigo-500">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 blur-3xl rounded-full pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              Requests Center
            </h2>
            <p className="text-indigo-100 mt-2 text-sm font-medium">Enterprise portal for time-off and grievance management.</p>
          </div>
          
          <div className="flex bg-indigo-700/50 backdrop-blur-md p-1 rounded-xl border border-indigo-500/50 self-stretch sm:self-auto shadow-inner">
            <button 
              onClick={() => { setActiveTab('leaves'); setSearchQuery(''); setStatusFilter('All'); }}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'leaves' 
                  ? 'bg-white text-indigo-700 shadow-md' 
                  : 'text-indigo-100 hover:text-white hover:bg-indigo-500/50'
              }`}
            >
              <Calendar size={18} />
              Leave Requests
            </button>
            <button 
              onClick={() => { setActiveTab('problems'); setSearchQuery(''); setStatusFilter('All'); }}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'problems' 
                  ? 'bg-white text-rose-600 shadow-md' 
                  : 'text-indigo-100 hover:text-white hover:bg-indigo-500/50'
              }`}
            >
              <ShieldAlert size={18} />
              Helpdesk & Grievance
            </button>
          </div>
        </div>
      </div>

      {/* Admin Quick Stats & Export */}
      {user.role === 'admin' && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:w-auto">
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-4 hover:border-indigo-200 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Leaves</p>
                <p className="text-xl font-bold text-slate-900">{pendingLeavesCount}</p>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-4 hover:border-rose-200 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <Activity size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Tickets</p>
                <p className="text-xl font-bold text-slate-900">{openProblemsCount}</p>
              </div>
            </div>
          </div>
          
          <button className="w-full sm:w-auto bg-white/60 backdrop-blur-md border border-white/60 text-slate-700 hover:bg-white hover:border-indigo-200 px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all">
            <Download size={16} /> Export Report
          </button>
        </div>
      )}

      {/* Toolbar (Search & Filter) */}
      <div className="bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col md:flex-row gap-4 justify-between animate-in slide-in-from-bottom-4 duration-500 delay-75">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={activeTab === 'leaves' ? "Search leave records..." : "Search helpdesk tickets..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold text-slate-700 appearance-none outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved/Resolved">{activeTab === 'leaves' ? 'Approved' : 'Resolved'}</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          {activeTab === 'leaves' ? (
            user.role !== 'admin' && (
              <button 
                onClick={() => setShowLeaveForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all shrink-0"
              >
                <Plus size={18} /> Apply Leave
              </button>
            )
          ) : (
            user.role !== 'admin' && (
              <button 
                onClick={() => setShowProblemForm(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all shrink-0"
              >
                <MessageSquare size={18} /> Raise Issue
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'leaves' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-150">
          <div className="grid grid-cols-1 gap-4">
            {filteredLeaves.map((leave) => (
              <div key={leave.id} className="bg-white border border-slate-200 rounded-xl p-0 overflow-hidden hover:shadow-md transition-all duration-200 group flex flex-col">
                <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-3.5 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      leave.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {leave.status === 'Approved' ? <CheckCircle2 size={18} /> :
                       leave.status === 'Rejected' ? <XCircle size={18} /> :
                       <Clock size={18} />}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Leave ID</span>
                      <span className="text-sm font-bold text-slate-700">#LV-{leave.id?.slice(-5).toUpperCase() || 'UNKN'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                      leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      leave.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          leave.status === 'Approved' ? 'bg-emerald-500' :
                          leave.status === 'Rejected' ? 'bg-rose-500' :
                          'bg-amber-500 animate-pulse'
                        }`}></span>
                        {leave.status}
                      </span>
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                      {leave.type}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-5 max-w-sm">
                      <div className="bg-blue-50/50 border border-blue-100/50 rounded-lg px-4 py-3 flex-1">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">From Date</span>
                        <span className="text-sm font-bold text-slate-800">{new Date(leave.fromDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="text-slate-300">
                        <ArrowRight size={16} />
                      </div>
                      <div className="bg-blue-50/50 border border-blue-100/50 rounded-lg px-4 py-3 flex-1">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">To Date</span>
                        <span className="text-sm font-bold text-slate-800">{new Date(leave.toDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Reason</span>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {leave.reason}
                      </p>
                      {leave.documentUrl && (
                        <a href={leave.documentUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors w-max">
                          <Paperclip size={14} /> Attached Document
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-64 shrink-0 flex flex-col gap-4 border-l-0 md:border-l border-slate-100 md:pl-6">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Employee</span>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
                          {getInitials(leave.employee?.name || 'Unknown')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{leave.employee?.name || 'Unknown User'}</p>
                          <p className="text-xs text-slate-500 font-medium">Employee</p>
                        </div>
                      </div>
                    </div>
                    
                    {user.role === 'admin' && leave.status === 'Pending' && (
                      <div className="mt-auto pt-4 flex flex-col gap-2">
                        <button 
                          onClick={() => handleUpdateLeaveStatus(leave.id, 'Approved')}
                          className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <CheckCircle2 size={16} /> Approve Leave
                        </button>
                        <button 
                          onClick={() => handleUpdateLeaveStatus(leave.id, 'Rejected')}
                          className="w-full py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 font-semibold text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle size={16} /> Reject Leave
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredLeaves.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl text-center py-20 flex flex-col items-center justify-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <Calendar size={28} className="text-slate-400" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-1">No Leave Requests Found</h4>
                <p className="text-slate-500 text-sm font-medium">Adjust your filters or search query to find records.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'problems' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-150">
          <div className="grid grid-cols-1 gap-4">
            {filteredProblems.map((problem) => (
              <div key={problem.id} className="bg-white border border-slate-200 rounded-xl p-0 overflow-hidden hover:shadow-md transition-all duration-200 group flex flex-col">
                <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-3.5 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      problem.status === 'Resolved' ? 'bg-blue-100 text-blue-700' :
                      problem.status === 'Rejected' ? 'bg-slate-200 text-slate-600' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {problem.status === 'Resolved' ? <CheckCircle2 size={18} /> :
                       problem.status === 'Rejected' ? <XCircle size={18} /> :
                       <AlertTriangle size={18} />}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Ticket ID</span>
                      <span className="text-sm font-bold text-slate-700">#TKT-{problem.id?.slice(-5).toUpperCase() || 'UNKN'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                      problem.status === 'Resolved' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      problem.status === 'Rejected' ? 'bg-slate-50 text-slate-600 border border-slate-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          problem.status === 'Resolved' ? 'bg-blue-500' :
                          problem.status === 'Rejected' ? 'bg-slate-500' :
                          'bg-rose-500 animate-pulse'
                        }`}></span>
                        {problem.status}
                      </span>
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide bg-slate-800 text-white shadow-sm">
                      {problem.category}
                    </span>
                    {problem.priority && (
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${getPriorityColor(problem.priority)}`}>
                        {problem.priority}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-slate-900 mb-3">{problem.title}</h4>
                    <div className="text-sm text-slate-600 bg-slate-50/80 rounded-lg p-4 border border-slate-100 whitespace-pre-wrap leading-relaxed font-medium">
                      {problem.description}
                    </div>
                    {problem.documentUrl && (
                      <a href={problem.documentUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors w-max">
                        <Paperclip size={14} /> Attached Document
                      </a>
                    )}
                  </div>
                  
                  <div className="w-full md:w-64 shrink-0 flex flex-col gap-4 border-l-0 md:border-l border-slate-100 md:pl-6">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Requester</span>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200">
                          {getInitials(problem.employee?.name || 'Unknown')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{problem.employee?.name || 'Unknown User'}</p>
                          <p className="text-xs text-slate-500 font-medium">{new Date(problem.createdAt || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    </div>
                    
                    {user.role === 'admin' && problem.status === 'Pending' && (
                      <div className="mt-auto pt-4 flex flex-col gap-2">
                        <button 
                          onClick={() => handleUpdateProblemStatus(problem.id, 'Resolved')}
                          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <CheckCircle2 size={16} /> Mark Resolved
                        </button>
                        <button 
                          onClick={() => handleUpdateProblemStatus(problem.id, 'Rejected')}
                          className="w-full py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 font-semibold text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle size={16} /> Reject Ticket
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredProblems.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl text-center py-20 flex flex-col items-center justify-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <ShieldAlert size={28} className="text-slate-400" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-1">No Tickets Found</h4>
                <p className="text-slate-500 text-sm font-medium">Adjust your filters or search query to find records.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leave Application Modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center border border-blue-200">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Apply for Leave</h3>
                  <p className="text-xs font-semibold text-slate-500">New time off request</p>
                </div>
              </div>
              <button onClick={() => setShowLeaveForm(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-lg transition-all">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleLeaveSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Leave Type</label>
                <select 
                  value={leaveFormData.type}
                  onChange={(e) => setLeaveFormData({...leaveFormData, type: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-800 bg-slate-50 hover:bg-white focus:bg-white"
                >
                  <option>Sick Leave</option>
                  <option>Casual Leave</option>
                  <option>Paid Privilege Leave</option>
                  <option>Maternity/Paternity Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">From Date</label>
                  <input 
                    type="date" 
                    required 
                    value={leaveFormData.fromDate}
                    onChange={(e) => setLeaveFormData({...leaveFormData, fromDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-800 bg-slate-50 hover:bg-white focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">To Date</label>
                  <input 
                    type="date" 
                    required 
                    value={leaveFormData.toDate}
                    onChange={(e) => setLeaveFormData({...leaveFormData, toDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-800 bg-slate-50 hover:bg-white focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Reason for Leave</label>
                <textarea 
                  rows="3" 
                  required 
                  value={leaveFormData.reason}
                  onChange={(e) => setLeaveFormData({...leaveFormData, reason: e.target.value})}
                  placeholder="Please provide a valid reason..."
                  className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-800 bg-slate-50 hover:bg-white focus:bg-white resize-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Attach Document (Optional)</label>
                <input 
                  type="file" 
                  onChange={(e) => setLeaveFormData({...leaveFormData, document: e.target.files[0]})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-800 bg-slate-50 hover:bg-white focus:bg-white"
                  accept="image/*,application/pdf"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowLeaveForm(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Problem Report Modal */}
      {showProblemForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center border border-rose-200">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Raise an Issue</h3>
                  <p className="text-xs font-semibold text-slate-500">Create a new helpdesk ticket</p>
                </div>
              </div>
              <button onClick={() => setShowProblemForm(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-lg transition-all">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleProblemSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Category</label>
                  <select 
                    value={problemFormData.category}
                    onChange={(e) => setProblemFormData({...problemFormData, category: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm font-medium text-slate-800 bg-slate-50 hover:bg-white focus:bg-white"
                  >
                    <option>IT Support</option>
                    <option>HR Support</option>
                    <option>Hardware Issue</option>
                    <option>Software Bug</option>
                    <option>POSH / Grievance (Confidential)</option>
                    <option>General Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Priority Level</label>
                  <select 
                    value={problemFormData.priority}
                    onChange={(e) => setProblemFormData({...problemFormData, priority: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm font-medium text-slate-800 bg-slate-50 hover:bg-white focus:bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Subject / Title</label>
                <input 
                  type="text" 
                  required 
                  value={problemFormData.title}
                  onChange={(e) => setProblemFormData({...problemFormData, title: e.target.value})}
                  placeholder="Short description of the issue"
                  className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm font-medium text-slate-800 bg-slate-50 hover:bg-white focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Detailed Description</label>
                <textarea 
                  rows="4" 
                  required 
                  value={problemFormData.description}
                  onChange={(e) => setProblemFormData({...problemFormData, description: e.target.value})}
                  placeholder="Explain the problem in detail. Your privacy is guaranteed for confidential matters."
                  className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm font-medium text-slate-800 bg-slate-50 hover:bg-white focus:bg-white resize-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Attach Document (Optional)</label>
                <input 
                  type="file" 
                  onChange={(e) => setProblemFormData({...problemFormData, document: e.target.files[0]})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm font-medium text-slate-800 bg-slate-50 hover:bg-white focus:bg-white"
                  accept="image/*,application/pdf"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowProblemForm(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-lg hover:bg-rose-700 shadow-sm transition-all">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Leaves;
