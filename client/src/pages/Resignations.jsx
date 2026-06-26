import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  UserMinus, Calendar, Clock, CheckCircle2, XCircle, Info, MessageSquare, AlertTriangle, 
  Search, Filter, Activity, ArrowRight, Briefcase
} from 'lucide-react';

const Resignations = () => {
  const { user } = useAuth();
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Resignations State
  const [resignations, setResignations] = useState([]);
  const [showResignationForm, setShowResignationForm] = useState(false);
  const [formData, setFormData] = useState({
    primaryReason: '',
    reason: '',
    requestedLWD: '',
    personalEmail: ''
  });

  const [selectedResignation, setSelectedResignation] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionData, setActionData] = useState({
    status: '',
    officialLWD: '',
    adminRemarks: '',
    eligibleForRehire: true,
    noticeWaived: false
  });

  const fetchResignations = async () => {
    try {
      const { data } = await api.get(`${import.meta.env.VITE_API_URL || ``}/api/resignations`);
      if (Array.isArray(data)) {
        setResignations(data);
      } else {
        console.error('Invalid data format received:', data);
        setResignations([]);
        toast.error('Received invalid data from server');
      }
    } catch (error) {
      console.error(error);
      setResignations([]);
      toast.error(error.response?.data?.error || 'Failed to fetch resignations');
    }
  };

  useEffect(() => {
    fetchResignations();
  }, []);

  const handleSubmitResignation = async (e) => {
    e.preventDefault();
    if (!formData.reason) return toast.error('Please provide a reason for resignation');
    
    try {
      await api.post(`${import.meta.env.VITE_API_URL || ``}/api/resignations`, formData);
      toast.success('Resignation request submitted successfully');
      setShowResignationForm(false);
      setFormData({ primaryReason: '', reason: '', requestedLWD: '', personalEmail: '' });
      fetchResignations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit request');
    }
  };

  const handleAdminAction = async (e) => {
    e.preventDefault();
    if (!actionData.status) return toast.error('Please select an action');
    
    try {
      await api.patch(`/api/resignations/${selectedResignation.id}`, actionData);
      toast.success('Resignation updated successfully');
      setShowActionModal(false);
      setSelectedResignation(null);
      setActionData({ status: '', officialLWD: '', adminRemarks: '', eligibleForRehire: true, noticeWaived: false });
      fetchResignations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update resignation');
    }
  };

  const handleEmployeeAction = async (id, action) => {
    try {
      if (action === 'withdraw') {
        if (!window.confirm('Are you sure you want to withdraw your resignation request?')) return;
        await api.patch(`/api/resignations/${id}/withdraw`);
        toast.success('Resignation request withdrawn');
      } else if (action === 'delete') {
        if (!window.confirm('Are you sure you want to delete this record permanently?')) return;
        await api.delete(`/api/resignations/${id}`);
        toast.success('Record deleted successfully');
      }
      fetchResignations();
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${action} resignation`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-200">Pending Review</span>;
      case 'Serving Notice':
        return <span className="px-3 py-1 bg-sky-50 text-sky-600 rounded-full text-xs font-bold border border-sky-200">Serving Notice Period</span>;
      case 'Approved':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-200">Approved</span>;
      case 'Offboarded':
        return <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-300">Offboarded</span>;
      case 'Withdrawn':
        return <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-bold border border-slate-200">Withdrawn</span>;
      case 'Rejected':
        return <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-bold border border-rose-200">Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-bold border border-slate-200">{status}</span>;
    }
  };

  const filteredResignations = resignations.filter(r => {
    const matchesSearch = 
      (r.reason && r.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.employeeName && r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalResigned = resignations.filter(r => r.status === 'Offboarded').length;
  const servingNotice = resignations.filter(r => r.status === 'Serving Notice').length;
  const pendingRequests = resignations.filter(r => r.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Modern Header Banner */}
        <div className="bg-[#0f172a] rounded-[24px] p-8 md:p-10 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent"></div>
          <div className="absolute -right-24 -top-24 w-96 h-96 bg-blue-500/20 blur-3xl rounded-full"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs font-bold text-white tracking-widest uppercase">Offboarding Center</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
                Employee Separation
              </h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">
                {user.role === 'admin' 
                  ? 'Manage organizational exits, review resignation requests, and track notice periods to ensure smooth transitions.' 
                  : 'Initiate your separation process formally. Track your notice period and official offboarding status.'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => fetchResignations()} className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all border border-white/10 flex items-center gap-2">
                <Activity size={16} /> Refresh
              </button>
              {user.role !== 'admin' && (
                <button 
                  onClick={() => setShowResignationForm(true)} 
                  className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
                >
                  <UserMinus size={18} /> Initiate Separation
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Admin Metrics Dashboard */}
        {user.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Requests</p>
                <h3 className="text-3xl font-black text-slate-800">{pendingRequests}</h3>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center text-sky-500">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Serving Notice</p>
                <h3 className="text-3xl font-black text-slate-800">{servingNotice}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Briefcase size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Offboarded</p>
                <h3 className="text-3xl font-black text-slate-800">{totalResigned}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search resignations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter size={18} className="text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 font-medium outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Serving Notice">Serving Notice</option>
              <option value="Approved">Approved</option>
              <option value="Offboarded">Offboarded</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>

        {/* Data List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredResignations.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Briefcase size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No Records Found</h3>
              <p className="text-slate-500 text-sm max-w-sm">There are currently no resignation records matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-bold tracking-wider">
                  <tr>
                    {user.role === 'admin' && <th className="px-6 py-4">Employee Details</th>}
                    {user.role === 'admin' && <th className="px-6 py-4">Primary Reason</th>}
                    <th className="px-6 py-4">Submitted Date</th>
                    <th className="px-6 py-4">Requested LWD</th>
                    <th className="px-6 py-4">Official LWD</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResignations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      {user.role === 'admin' && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                              {item.employeeName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{item.employeeName}</p>
                              <p className="text-xs text-slate-500">{item.department} &bull; {item.employeeEmail}</p>
                            </div>
                          </div>
                        </td>
                      )}
                      {user.role === 'admin' && (
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {item.primaryReason || 'Other'}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{new Date(item.createdAt).toLocaleDateString('en-GB')}</p>
                        <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {item.requestedLWD ? new Date(item.requestedLWD).toLocaleDateString('en-GB') : 'Not Specified'}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {item.officialLWD ? new Date(item.officialLWD).toLocaleDateString('en-GB') : <span className="text-slate-400 italic">Pending HR</span>}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.role === 'admin' ? (
                          <button
                            onClick={() => {
                              setSelectedResignation(item);
                              setActionData({
                                status: item.status,
                                officialLWD: item.officialLWD || '',
                                adminRemarks: item.adminRemarks || '',
                                eligibleForRehire: item.eligibleForRehire !== false,
                                noticeWaived: item.noticeWaived === true
                              });
                              setShowActionModal(true);
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg text-xs font-bold transition-all border border-slate-200 hover:border-blue-200"
                          >
                            Manage
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {item.status === 'Pending' && (
                              <button
                                onClick={() => handleEmployeeAction(item.id, 'withdraw')}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-bold transition-all border border-amber-200"
                              >
                                Withdraw
                              </button>
                            )}
                            {(item.status === 'Pending' || item.status === 'Withdrawn') && (
                              <button
                                onClick={() => handleEmployeeAction(item.id, 'delete')}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all border border-rose-200"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Employee Request Modal */}
      {showResignationForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent"></div>
              <div className="relative z-10 flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-4 backdrop-blur-md">
                  <UserMinus size={24} />
                </div>
                <button onClick={() => setShowResignationForm(false)} className="p-2 text-white/50 hover:bg-white/10 rounded-full transition-colors">
                  <XCircle size={24} />
                </button>
              </div>
              <h2 className="text-3xl font-black text-white relative z-10">Initiate Separation Workflow</h2>
              <p className="text-sm text-slate-300 mt-2 relative z-10">Complete the mandatory exit request form. Please ensure all details are accurate to avoid delays in final settlement.</p>
            </div>
            
            <form onSubmit={handleSubmitResignation} className="p-8 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Primary Reason for Exit *</label>
                    <select 
                      required
                      value={formData.primaryReason}
                      onChange={(e) => setFormData({...formData, primaryReason: e.target.value})}
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    >
                      <option value="">Select a reason...</option>
                      <option value="Better Opportunity">Better Career Opportunity</option>
                      <option value="Higher Education">Higher Education</option>
                      <option value="Relocation">Relocation</option>
                      <option value="Health Reasons">Health Reasons</option>
                      <option value="Personal Reasons">Personal / Family Reasons</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Personal Email (Post-Exit Contact) *</label>
                    <input 
                      type="email" 
                      required
                      value={formData.personalEmail}
                      onChange={(e) => setFormData({...formData, personalEmail: e.target.value})}
                      placeholder="john.doe@gmail.com"
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Requested Last Working Day *</label>
                    <input 
                      type="date" 
                      required
                      value={formData.requestedLWD}
                      onChange={(e) => setFormData({...formData, requestedLWD: e.target.value})}
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><Info size={12}/> Based on your {user?.noticePeriod || 30}-day notice period. Official LWD is determined by HR.</p>
                  </div>
                </div>

                <div className="space-y-6 flex flex-col">
                  <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Detailed Reason & Exit Notes *</label>
                    <textarea 
                      required
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      placeholder="Please provide a detailed explanation. If joining another company, mentioning the name is optional but helpful..."
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none flex-1"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowResignationForm(false)}
                  className="flex-1 px-6 py-4 rounded-xl text-slate-600 font-bold bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Action Modal */}
      {showActionModal && selectedResignation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 bg-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Manage Offboarding Workflow</h2>
                <p className="text-sm text-slate-500 mt-1">Review and process separation requests in accordance with company policy.</p>
              </div>
              <button onClick={() => setShowActionModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAdminAction} className="flex flex-col md:flex-row h-full max-h-[70vh] overflow-hidden">
              
              {/* Left Panel - Details */}
              <div className="w-full md:w-1/2 bg-slate-50 p-8 overflow-y-auto border-r border-slate-100">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xl">
                    {selectedResignation.employeeName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Employee Profile</p>
                    <p className="font-black text-xl text-slate-900">{selectedResignation.employeeName}</p>
                    <p className="text-sm text-slate-500 font-medium">{selectedResignation.department} • {selectedResignation.employeeEmail}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Reason Category</p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
                      <AlertTriangle size={14} className="text-amber-500"/>
                      {selectedResignation.primaryReason || 'Other'}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Personal Email (Post-Exit)</p>
                    <p className="text-sm font-medium text-slate-700">{selectedResignation.personalEmail || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detailed Reason / Notes</p>
                    <p className="text-sm leading-relaxed text-slate-700 bg-white p-4 rounded-xl border border-slate-200">{selectedResignation.reason}</p>
                  </div>

                  {selectedResignation.requestedLWD && (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Requested Last Working Day</p>
                      <p className="text-lg font-black text-slate-800">{new Date(selectedResignation.requestedLWD).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Actions */}
              <div className="w-full md:w-1/2 p-8 overflow-y-auto bg-white flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Current Lifecycle Status</label>
                    <select 
                      required
                      value={actionData.status}
                      onChange={(e) => setActionData({...actionData, status: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-800"
                    >
                      <option value="Pending">Pending HR Review</option>
                      <option value="Approved">Approved (Awaiting Notice Period)</option>
                      <option value="Serving Notice">Currently Serving Notice Period</option>
                      <option value="Offboarded">Completed / Offboarded</option>
                      <option value="Withdrawn">Withdrawn</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Set / Extend Official Last Working Day</label>
                    <input 
                      type="date" 
                      value={actionData.officialLWD}
                      onChange={(e) => setActionData({...actionData, officialLWD: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    />
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><Info size={12}/> Update this field to extend or adjust the notice period officially.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 transition-colors bg-slate-50"
                         onClick={() => setActionData({...actionData, eligibleForRehire: !actionData.eligibleForRehire})}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase">Eligible for Rehire</span>
                        <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${actionData.eligibleForRehire ? 'bg-blue-500' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${actionData.eligibleForRehire ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500">Can be considered for future openings.</p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 transition-colors bg-slate-50"
                         onClick={() => setActionData({...actionData, noticeWaived: !actionData.noticeWaived})}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase">Notice Period Waived</span>
                        <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${actionData.noticeWaived ? 'bg-rose-500' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${actionData.noticeWaived ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500">Waive the remaining notice period.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">HR Private Remarks</label>
                    <textarea 
                      value={actionData.adminRemarks}
                      onChange={(e) => setActionData({...actionData, adminRemarks: e.target.value})}
                      placeholder="Internal HR notes regarding settlement, behavior, or handover..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none h-24"
                    ></textarea>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowActionModal(false)}
                    className="flex-1 px-6 py-4 rounded-xl text-slate-600 font-bold bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 rounded-xl text-white font-bold bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
                  >
                    Save & Process
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resignations;
