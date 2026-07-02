const fs = require('fs');
const path = require('path');

const approvalsContent = `"use client";

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
      await api.patch(\`/api/tasks/submit/\${id}/approve\`);
      toast.success('Transaction Approved');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Reject this transaction?')) return;
    try {
      await api.patch(\`/api/tasks/submit/\${id}/reject\`);
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
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Employee</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Student Info</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Financials</th>
                  {isPostSales && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map(sub => (
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
                      </div>
                    </td>
                    {isPostSales && (
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleApprove(sub.id)}
                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-xs"
                      >
                        <CheckCircle2 size={16} /> Approve
                      </button>
                      <button 
                        onClick={() => handleReject(sub.id)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-xs"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'client/src/app/(protected)/approvals/page.jsx'), approvalsContent, 'utf8');
console.log('Approvals page reverted.');
