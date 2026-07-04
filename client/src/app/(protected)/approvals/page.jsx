"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasApproverAccess } from '@/utils/rbac';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { ClipboardList, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const isPostSales = user?.role === 'post_sales' || user?.role === 'post sales';
  
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasApproverAccess(user)) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await fetchPending();
    setLoading(false);
  };

  const fetchPending = async () => {
    try {
      const res = await api.get('/api/tasks/submit/pending');
      setSubmissions(res.data);
    } catch (error) {
      toast.error('Failed to load pending approvals');
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Approve this transaction? This will add to the employee and team target.')) return;
    try {
      await api.patch(`/api/tasks/submit/${id}/approve`);
      toast.success('Transaction Approved');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Reject this transaction?')) return;
    try {
      await api.patch(`/api/tasks/submit/${id}/reject`);
      toast.success('Transaction Rejected');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject');
    }
  };

  if (!hasApproverAccess(user)) {
    return <div className="p-8 text-center text-slate-500 font-bold">Access Denied</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
              <ClipboardList size={24} />
            </div>
            Post Sales Task Box
          </h1>
          <p className="text-slate-500 font-medium mt-1">Review and approve employee transactions</p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-3xl" />)}
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-slate-100">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">All caught up!</h3>
          <p className="text-slate-500 font-medium">There are no pending transactions to approve at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map(sub => (
            <div key={sub.id} className="bg-white rounded-[2rem] p-6 shadow-lg shadow-slate-200/40 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              {/* Decorative gradient blur */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors -z-10 -mr-10 -mt-10"></div>
              
              {/* Header: Employee & Dates */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-lg shadow-inner shadow-blue-400/50">
                    {sub.employeeName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">{sub.employeeName}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Employee</p>
                  </div>
                </div>
                <div className="text-right flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment:</span>
                    <span className="text-xs font-black text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/50">{sub.paymentDate || format(new Date(sub.date), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Uploaded:</span>
                    <span className="text-[10px] font-bold text-slate-500">{format(new Date(sub.createdAt), 'dd MMM yyyy, HH:mm')}</span>
                  </div>
                </div>
              </div>

              {/* Body: Student Info */}
              <div className="bg-slate-50/50 rounded-3xl p-5 mb-6 border border-slate-100/60 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h3 className="text-lg font-black text-slate-800 mb-1 leading-tight">{sub.studentName}</h3>
                <p className="text-xs font-bold text-slate-500 mb-4">{sub.domain} • {sub.collegeName}</p>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm">
                    <span className="opacity-50">📞</span> {sub.phoneNumber}
                  </span>
                  <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1.5 rounded-xl font-black flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                    {sub.courseType} • {sub.courseDuration} Mon
                  </span>
                </div>
              </div>

              {/* Financials & Document */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex gap-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Paid</span>
                    <span className="text-xs font-black bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded border border-emerald-200/60 shadow-sm">
                      ₹{sub.amountPaid?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total</span>
                    <span className="text-xs font-black bg-amber-50 text-amber-700 px-2.5 py-1 rounded border border-amber-200/60 shadow-sm">
                      ₹{sub.totalAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {sub.fileUrl ? (
                  <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-4 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm group/btn hover:shadow-blue-500/20">
                    <span>📄</span> View Receipt
                  </a>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">No Receipt</span>
                )}
              </div>

              {/* Actions */}
              {isPostSales && (
                <div className="grid grid-cols-2 gap-3 pt-5 border-t border-slate-100">
                  <button 
                    onClick={() => handleApprove(sub.id)}
                    className="flex items-center justify-center gap-2 px-4 py-3.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all font-black text-xs shadow-sm hover:shadow-emerald-500/30 hover:-translate-y-0.5 border border-emerald-100/50 hover:border-transparent"
                  >
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button 
                    onClick={() => handleReject(sub.id)}
                    className="flex flex-col items-center justify-center px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-rose-500/30 hover:-translate-y-0.5 border border-rose-100/50 hover:border-transparent"
                  >
                    <span className="flex items-center gap-1.5 font-black text-xs leading-none">
                      <XCircle size={14} /> Reject
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-80 mt-1">Invalid Date</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
