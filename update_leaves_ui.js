const fs = require('fs');
const path = require('path');

const fileContent = `"use client";

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { hasAdminAccess, isSuperAdmin } from '@/utils/rbac';
import { 
  Plus, Calendar, Clock, CheckCircle2, XCircle, Info, MessageSquare, AlertTriangle, 
  ShieldAlert, Search, Filter, Activity, Download, ArrowRight, Paperclip, Users
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
    category: 'HR Support',
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
      const res = await api.get(\`\${process.env.NEXT_PUBLIC_API_URL || ''}/api/leaves\`);
      setLeaves(res.data);
    } catch (err) {
      toast.error('Failed to fetch leaves');
    }
  };

  const fetchProblems = async () => {
    try {
      const res = await api.get(\`\${process.env.NEXT_PUBLIC_API_URL || ''}/api/problems\`);
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
      
      await api.post(\`\${process.env.NEXT_PUBLIC_API_URL || ''}/api/leaves\`, formData, {
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

      await api.post('/api/problems', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Issue raised successfully. Our team will review it.');
      setShowProblemForm(false);
      setProblemFormData({ category: 'HR Support', title: '', description: '', priority: 'Medium', document: null });
      fetchProblems();
    } catch (err) {
      toast.error('Failed to raise problem');
    }
  };

  const handleUpdateLeaveStatus = async (id, status) => {
    try {
      await api.put(\`/api/leaves/\${id}/status\`, { status });
      toast.success(\`Leave \${status}\`);
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to update leave status');
    }
  };

  const handleUpdateProblemStatus = async (id, status) => {
    try {
      await api.put(\`/api/problems/\${id}/status\`, { status });
      toast.success(\`Problem marked as \${status}\`);
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
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'High': return 'bg-orange-100 text-[#eb4917] border-orange-200';
      case 'Low': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200'; // Medium
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12 relative">
      
      {/* Animated Background Elements for Professional Look */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#eb4917]/10 rounded-full blur-[100px] animate-pulse pointer-events-none z-0" style={{ animationDuration: '4s' }}></div>
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-orange-400/10 rounded-full blur-[80px] animate-pulse pointer-events-none z-0" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10 px-2">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-3">
            Requests <span className="text-[#eb4917]">Center</span>
          </h2>
          <p className="text-gray-500 font-bold text-sm md:text-base mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#eb4917]"></span> 
            Enterprise portal for time-off and grievance management
          </p>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl self-stretch sm:self-auto border border-gray-200 shadow-sm overflow-hidden">
          <button 
            onClick={() => { setActiveTab('leaves'); setSearchQuery(''); setStatusFilter('All'); }}
            className={\`flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 \${
              activeTab === 'leaves' 
                ? 'bg-[#eb4917] text-white shadow-lg shadow-[#eb4917]/30 transform scale-100' 
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }\`}
          >
            <Calendar size={18} /> Leave Requests
          </button>
          <button 
            onClick={() => { setActiveTab('problems'); setSearchQuery(''); setStatusFilter('All'); }}
            className={\`flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 \${
              activeTab === 'problems' 
                ? 'bg-[#eb4917] text-white shadow-lg shadow-[#eb4917]/30 transform scale-100' 
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }\`}
          >
            <ShieldAlert size={18} /> Helpdesk & Grievance
          </button>
        </div>
      </div>

      {/* Admin Quick Stats & Export */}
      {hasAdminAccess(user) && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full sm:w-auto">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-150 duration-500"></div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-white text-[#eb4917] flex items-center justify-center border border-orange-200 shadow-sm z-10">
                <Clock size={28} />
              </div>
              <div className="z-10">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Pending Leaves</p>
                <p className="text-3xl font-black text-gray-900">{pendingLeavesCount}</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-150 duration-500"></div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-100 to-white text-red-500 flex items-center justify-center border border-red-200 shadow-sm z-10">
                <Activity size={28} />
              </div>
              <div className="z-10">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Open Tickets</p>
                <p className="text-3xl font-black text-gray-900">{openProblemsCount}</p>
              </div>
            </div>
          </div>
          
          <button className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#eb4917] hover:border-[#eb4917] px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-lg transition-all duration-300 hover:shadow-xl">
            <Download size={18} /> Export Records
          </button>
        </div>
      )}

      {/* Toolbar (Search & Filter) */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xl flex flex-col md:flex-row gap-5 justify-between relative z-10 items-center group">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at center, #eaeaea 2px, transparent 0)", backgroundSize: "22px 22px", opacity: 0.3 }}></div>
        <div className="flex-1 relative w-full z-10">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder={activeTab === 'leaves' ? "Search by employee, leave type, or reason..." : "Search tickets, descriptions, or categories..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#eb4917]/20 focus:border-[#eb4917] focus:bg-white transition-all text-sm font-bold text-gray-800 placeholder:text-gray-400 outline-none shadow-sm"
          />
        </div>
        <div className="flex w-full md:w-auto items-center gap-4 z-10">
          <div className="relative flex-1 md:flex-none">
            <Filter className="absolute left-4 top-3.5 text-[#eb4917]" size={18} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-orange-50/50 border border-orange-100 rounded-2xl focus:ring-2 focus:ring-[#eb4917]/20 focus:border-[#eb4917] text-sm font-black text-[#eb4917] appearance-none outline-none cursor-pointer shadow-sm"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved/Resolved">{activeTab === 'leaves' ? 'Approved' : 'Resolved'}</option>
              <option value="Rejected">Rejected</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#eb4917] font-bold text-xs">▼</div>
          </div>
          {activeTab === 'leaves' ? (
            user.role !== 'admin' && (
              <button 
                onClick={() => setShowLeaveForm(true)}
                className="bg-[#eb4917] hover:bg-[#d43f10] text-white px-6 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-[#eb4917]/30 transition-all duration-300 transform hover:-translate-y-1 shrink-0 w-full md:w-auto"
              >
                <Plus size={20} /> Apply Leave
              </button>
            )
          ) : (
            user.role !== 'admin' && (
              <button 
                onClick={() => setShowProblemForm(true)}
                className="bg-[#eb4917] hover:bg-[#d43f10] text-white px-6 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-[#eb4917]/30 transition-all duration-300 transform hover:-translate-y-1 shrink-0 w-full md:w-auto"
              >
                <MessageSquare size={20} /> Raise Issue
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 space-y-6">
        {activeTab === 'leaves' && (
          <div className="grid grid-cols-1 gap-6">
            {filteredLeaves.map((leave) => (
              <div key={leave.id} className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 p-0 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#eb4917] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top"></div>
                
                <div className="p-6 md:p-8 border-b border-gray-50 bg-gradient-to-r from-orange-50/40 to-white flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-sm overflow-hidden border shrink-0 ${
                        leave.status === 'Approved' ? 'bg-green-100 text-green-600 border-green-200' :
                        leave.status === 'Rejected' ? 'bg-red-100 text-red-600 border-red-200' :
                        'bg-orange-100 text-[#eb4917] border-orange-200'
                      }`}>
                        {leave.employee?.avatar ? (
                          <img src={leave.employee.avatar} alt={leave.employee?.name} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(leave.employee?.name || 'Unknown')
                        )}
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Employee ID</span>
                      <span className="text-lg font-black text-gray-800">{leave.employee?.empId || leave.employeeId?.slice(-5).toUpperCase() || 'UNKN'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border shadow-sm ${
                        leave.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                        leave.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-orange-50 text-[#eb4917] border-orange-200'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          leave.status === 'Approved' ? 'bg-green-500' :
                          leave.status === 'Rejected' ? 'bg-red-500' :
                          'bg-[#eb4917] animate-ping'
                        }`}></span>
                        {leave.status}
                    </span>
                    <span className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200 shadow-sm">
                      {leave.type}
                    </span>
                  </div>
                </div>

                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 md:gap-12 relative">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 md:gap-8 mb-8 bg-gray-50 p-5 md:p-6 rounded-2xl border border-gray-100 shadow-inner">
                      <div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Duration From</span>
                        <span className="text-base font-black text-gray-800 flex items-center gap-2">
                          <Calendar size={16} className="text-[#eb4917]" /> 
                          {new Date(leave.fromDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-gray-300 hidden md:block">
                        <ArrowRight size={24} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Duration To</span>
                        <span className="text-base font-black text-gray-800 flex items-center gap-2">
                          <Calendar size={16} className="text-[#eb4917]" /> 
                          {new Date(leave.toDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs font-black text-[#eb4917] uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={16} /> Reason for Leave</span>
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed font-semibold bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                        {leave.reason}
                      </p>
                      {leave.documentUrl && (
                        <a href={leave.documentUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[#eb4917] hover:text-white bg-orange-50 hover:bg-[#eb4917] px-5 py-2.5 rounded-xl border border-orange-200 hover:border-[#eb4917] transition-all duration-300 w-max shadow-sm transform hover:-translate-y-0.5">
                          <Paperclip size={16} /> View Attached Document
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-80 shrink-0 flex flex-col gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0 md:pl-10">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Requested By</span>
                      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-full bg-orange-100 text-[#eb4917] font-black flex items-center justify-center text-xl border border-orange-200 shadow-sm shrink-0 overflow-hidden">
                          {leave.employee?.avatar ? (
                            <img src={leave.employee.avatar} alt={leave.employee?.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(leave.employee?.name || 'Unknown')
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-black text-gray-900 truncate">{leave.employee?.name || 'Unknown Employee'}</p>
                          <p className="text-xs text-gray-500 font-bold mt-1">ID: {leave.employee?.empId || leave.employeeId?.slice(-5).toUpperCase() || 'UNKN'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {hasAdminAccess(user) && leave.status === 'Pending' && (
                      <div className="mt-auto pt-2 flex flex-col gap-3 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block text-center mb-1">Admin Actions</span>
                        <button 
                          onClick={() => handleUpdateLeaveStatus(leave.id, 'Approved')}
                          className="w-full py-3.5 bg-green-500 text-white rounded-xl hover:bg-green-600 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 hover:-translate-y-0.5"
                        >
                          <CheckCircle2 size={18} /> Approve
                        </button>
                        <button 
                          onClick={() => handleUpdateLeaveStatus(leave.id, 'Rejected')}
                          className="w-full py-3.5 bg-white text-red-500 border-2 border-red-100 rounded-xl hover:bg-red-50 hover:border-red-200 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle size={18} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredLeaves.length === 0 && (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl text-center py-24 flex flex-col items-center justify-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-100">
                  <Calendar size={36} className="text-gray-300" />
                </div>
                <h4 className="text-xl font-black text-gray-800 mb-2">No Leave Requests Found</h4>
                <p className="text-gray-500 text-sm font-semibold max-w-sm">Adjust your filters or search query to find records.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="grid grid-cols-1 gap-6">
            {filteredProblems.map((problem) => (
              <div key={problem.id} className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 p-0 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#eb4917] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top"></div>
                
                <div className="p-6 md:p-8 border-b border-gray-50 bg-gradient-to-r from-orange-50/40 to-white flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-sm overflow-hidden border shrink-0 ${
                        problem.status === 'Resolved' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                        problem.status === 'Rejected' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                        'bg-red-100 text-red-600 border-red-200'
                      }`}>
                        {problem.employee?.avatar ? (
                          <img src={problem.employee.avatar} alt={problem.employee?.name} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(problem.employee?.name || 'Unknown')
                        )}
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Employee ID</span>
                      <span className="text-lg font-black text-gray-800">{problem.employee?.empId || problem.employeeId?.slice(-5).toUpperCase() || 'UNKN'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={\`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border shadow-sm \${
                        problem.status === 'Resolved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        problem.status === 'Rejected' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }\`}>
                        <span className={\`w-2 h-2 rounded-full \${
                          problem.status === 'Resolved' ? 'bg-blue-500' :
                          problem.status === 'Rejected' ? 'bg-gray-500' :
                          'bg-red-500 animate-ping'
                        }\`}></span>
                        {problem.status}
                    </span>
                    <span className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gray-900 text-white shadow-sm border border-gray-800">
                      {problem.category}
                    </span>
                    {problem.priority && (
                      <span className={\`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border shadow-sm \${getPriorityColor(problem.priority)}\`}>
                        {problem.priority}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 md:gap-12 relative">
                  <div className="flex-1">
                    <h4 className="font-black text-xl text-gray-900 mb-4">{problem.title}</h4>
                    <div className="text-base text-gray-600 bg-white shadow-inner rounded-2xl p-6 border border-gray-100 whitespace-pre-wrap leading-relaxed font-semibold">
                      {problem.description}
                    </div>
                    {problem.documentUrl && (
                      <a href={problem.documentUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[#eb4917] hover:text-white bg-orange-50 hover:bg-[#eb4917] px-5 py-2.5 rounded-xl border border-orange-200 hover:border-[#eb4917] transition-all duration-300 w-max shadow-sm transform hover:-translate-y-0.5">
                        <Paperclip size={16} /> View Attached Evidence
                      </a>
                    )}
                  </div>
                  
                  <div className="w-full md:w-80 shrink-0 flex flex-col gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0 md:pl-10">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Reported By</span>
                      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-full bg-orange-100 text-[#eb4917] font-black flex items-center justify-center text-xl border border-orange-200 shadow-sm shrink-0 overflow-hidden">
                          {problem.employee?.avatar ? (
                            <img src={problem.employee.avatar} alt={problem.employee?.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(problem.employee?.name || 'Unknown')
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-black text-gray-900 truncate">{problem.employee?.name || 'Unknown User'}</p>
                          <p className="text-xs text-gray-500 font-bold mt-1">
                            {new Date(problem.createdAt || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {hasAdminAccess(user) && problem.status === 'Pending' && (
                      <div className="mt-auto pt-2 flex flex-col gap-3 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block text-center mb-1">Admin Actions</span>
                        <button 
                          onClick={() => handleUpdateProblemStatus(problem.id, 'Resolved')}
                          className="w-full py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:-translate-y-0.5"
                        >
                          <CheckCircle2 size={18} /> Mark Resolved
                        </button>
                        <button 
                          onClick={() => handleUpdateProblemStatus(problem.id, 'Rejected')}
                          className="w-full py-3.5 bg-white text-red-500 border-2 border-red-100 rounded-xl hover:bg-red-50 hover:border-red-200 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle size={18} /> Reject Ticket
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredProblems.length === 0 && (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl text-center py-24 flex flex-col items-center justify-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-100">
                  <ShieldAlert size={36} className="text-gray-300" />
                </div>
                <h4 className="text-xl font-black text-gray-800 mb-2">No Tickets Found</h4>
                <p className="text-gray-500 text-sm font-semibold max-w-sm">Adjust your filters or search query to find records.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leave Application Modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-100">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 text-[#eb4917] rounded-2xl flex items-center justify-center border border-orange-200 shadow-sm">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Apply for Leave</h3>
                  <p className="text-xs font-bold text-gray-500 mt-1">New time off request</p>
                </div>
              </div>
              <button onClick={() => setShowLeaveForm(false)} className="text-gray-400 hover:text-[#eb4917] hover:bg-orange-50 p-2.5 rounded-xl transition-all">
                <XCircle size={26} />
              </button>
            </div>
            <form onSubmit={handleLeaveSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Leave Type</label>
                <select 
                  value={leaveFormData.type}
                  onChange={(e) => setLeaveFormData({...leaveFormData, type: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-[#eb4917]/10 focus:border-[#eb4917] transition-all text-sm font-bold text-gray-800 bg-white outline-none"
                >
                  <option>Sick Leave</option>
                  <option>Casual Leave</option>
                  <option>Paid Privilege Leave</option>
                  <option>Maternity/Paternity Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">From Date</label>
                  <input 
                    type="date" 
                    required 
                    value={leaveFormData.fromDate}
                    onChange={(e) => setLeaveFormData({...leaveFormData, fromDate: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-[#eb4917]/10 focus:border-[#eb4917] transition-all text-sm font-bold text-gray-800 bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">To Date</label>
                  <input 
                    type="date" 
                    required 
                    value={leaveFormData.toDate}
                    onChange={(e) => setLeaveFormData({...leaveFormData, toDate: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-[#eb4917]/10 focus:border-[#eb4917] transition-all text-sm font-bold text-gray-800 bg-white outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Reason for Leave</label>
                <textarea 
                  rows="3" 
                  required 
                  value={leaveFormData.reason}
                  onChange={(e) => setLeaveFormData({...leaveFormData, reason: e.target.value})}
                  placeholder="Please provide a valid reason..."
                  className="w-full border-2 border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-[#eb4917]/10 focus:border-[#eb4917] transition-all text-sm font-bold text-gray-800 bg-white outline-none resize-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Attach Document (Optional)</label>
                <input 
                  type="file" 
                  onChange={(e) => setLeaveFormData({...leaveFormData, document: e.target.files[0]})}
                  className="w-full border-2 border-gray-200 rounded-2xl p-3 focus:ring-4 focus:ring-[#eb4917]/10 focus:border-[#eb4917] transition-all text-sm font-bold text-gray-600 bg-white outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-[#eb4917] hover:file:bg-orange-100"
                  accept="image/*,application/pdf"
                />
              </div>
              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowLeaveForm(false)} className="flex-1 px-5 py-4 bg-gray-100 border-2 border-transparent text-gray-700 text-sm font-black rounded-2xl hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-5 py-4 bg-[#eb4917] text-white text-sm font-black rounded-2xl hover:bg-[#d43f10] shadow-lg shadow-[#eb4917]/30 transition-all hover:-translate-y-1">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Problem Report Modal */}
      {showProblemForm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-100">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center border border-red-200 shadow-sm">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Raise an Issue</h3>
                  <p className="text-xs font-bold text-gray-500 mt-1">Create a new helpdesk ticket</p>
                </div>
              </div>
              <button onClick={() => setShowProblemForm(false)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all">
                <XCircle size={26} />
              </button>
            </div>
            <form onSubmit={handleProblemSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <select 
                    value={problemFormData.category}
                    onChange={(e) => setProblemFormData({...problemFormData, category: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all text-sm font-bold text-gray-800 bg-white outline-none"
                  >
                    <option>HR Support</option>
                    <option>POSH / Grievance (Confidential)</option>
                    <option>Operations Support</option>
                    <option>Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Priority Level</label>
                  <select 
                    value={problemFormData.priority}
                    onChange={(e) => setProblemFormData({...problemFormData, priority: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all text-sm font-bold text-gray-800 bg-white outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Subject / Title</label>
                <input 
                  type="text" 
                  required 
                  value={problemFormData.title}
                  onChange={(e) => setProblemFormData({...problemFormData, title: e.target.value})}
                  placeholder="Short description of the issue"
                  className="w-full border-2 border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all text-sm font-bold text-gray-800 bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Detailed Description</label>
                <textarea 
                  rows="4" 
                  required 
                  value={problemFormData.description}
                  onChange={(e) => setProblemFormData({...problemFormData, description: e.target.value})}
                  placeholder="Explain the problem in detail. Your privacy is guaranteed for confidential matters."
                  className="w-full border-2 border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all text-sm font-bold text-gray-800 bg-white outline-none resize-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Attach Document (Optional)</label>
                <input 
                  type="file" 
                  onChange={(e) => setProblemFormData({...problemFormData, document: e.target.files[0]})}
                  className="w-full border-2 border-gray-200 rounded-2xl p-3 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all text-sm font-bold text-gray-600 bg-white outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-600 hover:file:bg-red-100"
                  accept="image/*,application/pdf"
                />
              </div>
              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowProblemForm(false)} className="flex-1 px-5 py-4 bg-gray-100 border-2 border-transparent text-gray-700 text-sm font-black rounded-2xl hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-5 py-4 bg-red-600 text-white text-sm font-black rounded-2xl hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all hover:-translate-y-1">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Leaves;
`;

fs.writeFileSync(path.join(__dirname, 'client/src/app/(protected)/leaves/page.jsx'), fileContent, 'utf-8');
console.log('UI updated successfully!');
