"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasApproverAccess } from '@/utils/rbac';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { ClipboardList, CheckCircle2, XCircle, Clock, Wallet } from 'lucide-react';
import { format } from 'date-fns';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const isPostSales = user?.role === 'post_sales' || user?.role === 'post sales';
  
  const [activeTab, setActiveTab] = useState('pending');
  const [submissions, setSubmissions] = useState([]);
  const [clearances, setClearances] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedClearance, setSelectedClearance] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    if (!hasApproverAccess(user)) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchPending(), fetchClearances()]);
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

  const fetchClearances = async () => {
    try {
      const res = await api.get('/api/tasks/submit/clearances');
      setClearances(res.data);
    } catch (error) {
      console.error(error);
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

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!selectedClearance || !paymentAmount) return;
    
    try {
      await api.patch(`/api/tasks/submit/${selectedClearance.id}/update-payment`, {
        additionalPayment: paymentAmount
      });
      toast.success('Payment updated successfully');
      setSelectedClearance(null);
      setPaymentAmount('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update payment');
    }
  };

  if (!hasApproverAccess(user)) {
    return <div className="p-8 text-center text-slate-500 font-bold">Access Denied</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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

      {isPostSales && (
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-bold text-sm transition-colors relative ${activeTab === 'pending' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Pending Approvals
            {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('clearances')}
            className={`px-6 py-3 font-bold text-sm transition-colors relative ${activeTab === 'clearances' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Pending Clearances
            {activeTab === 'clearances' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
          </button>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-3xl" />)}
        </div>
      ) : activeTab === 'pending' ? (
        submissions.length === 0 ? (
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
        )
      ) : (
        clearances.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-slate-100">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">No pending clearances!</h3>
            <p className="text-slate-500 font-medium">All approved transactions have been fully paid.</p>
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
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clearances.map(sub => (
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
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => setSelectedClearance(sub)}
                          className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors inline-flex items-center gap-2 font-bold text-xs"
                        >
                          <Wallet size={16} /> Update Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {selectedClearance && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Update Payment</h3>
              <button 
                onClick={() => { setSelectedClearance(null); setPaymentAmount(''); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdatePayment} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-sm font-bold text-slate-700 mb-1">Student: {selectedClearance.studentName}</p>
                <p className="text-sm font-bold text-red-600">Remaining Balance: ₹{selectedClearance.remainingAmount?.toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">New Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedClearance.remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-4 font-medium transition-all"
                  placeholder="Enter amount paid"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-lg shadow-blue-500/30"
              >
                Confirm Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
