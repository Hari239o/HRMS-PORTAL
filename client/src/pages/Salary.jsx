import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { IndianRupee, Download, Mail, Plus, User, Trash2 } from 'lucide-react';

export default function Salary() {
  const { user } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    month: new Date().toISOString().slice(0,7),
    baseSalary: '',
    bonus: 0,
    deductions: 0
  });

  useEffect(() => {
    if (!user) return;
    fetchSalaries();
    if (user?.role === 'admin') fetchEmployees();
  }, [user?.id, user?.role]);

  const fetchSalaries = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5002"}`}/api/salary`);
      setSalaries(res.data);
    } catch (err) {
      toast.error("Failed to load salaries");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5002"}`}/api/employees`); // Corrected endpoint
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        employeeId: formData.employeeId,
        month: formData.month,
        baseSalary: Number(formData.baseSalary) || 0,
        bonus: Number(formData.bonus) || 0,
        deductions: Number(formData.deductions) || 0
      };
      if (!payload.employeeId || !payload.month || payload.baseSalary <= 0) {
        return toast.error('Please select employee, month and a valid base salary');
      }
      await axios.post(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5002"}`}/api/salary`, payload);
      toast.success("Salary recorded successfully");
      setShowModal(false);
      fetchSalaries();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to record salary");
    }
  };

  const downloadPayslip = (salary) => {
    if (user.role !== 'admin' && salary.status !== 'Released') {
      return toast.error('Payslip is not yet released.');
    }
    window.open(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/salary/generate/${salary.id}`, '_blank');
  };

  const releasePayslip = async (salaryId) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/salary/release/${salaryId}`);
      toast.success('Payslip released and employee notified');
      fetchSalaries();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to release payslip');
    }
  };

  const sendEmail = async (salaryId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5002"}`}/api/salary/send-email`, { salaryId });
      toast.success('Payslip sent to employee email');
      fetchSalaries();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send email');
    }
  };

  const handleDelete = async (salaryId) => {
    if (!window.confirm("Are you sure you want to delete this salary record?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/salary/${salaryId}`);
      toast.success("Salary record deleted successfully");
      fetchSalaries();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete salary record");
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Payroll Management</h1>
        {user.role === 'admin' && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={20} /> Record Salary
          </button>
        )}
      </div>

      <div className="card overflow-x-auto border-none shadow-md w-full">
        <table className="w-full text-left min-w-[600px] whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Month</th>
              <th className="px-6 py-4">Net Salary</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {salaries.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-700">{s.employee?.name || user.name}</td>
                <td className="px-6 py-4 text-slate-500">{s.month}</td>
                <td className="px-6 py-4">
                   <span className="font-bold text-slate-800">₹{Number(s.netSalary ?? 0).toLocaleString()}</span>
                </td>
                <td className="px-6 py-4">
                  {s.status === 'Released' ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase">Released</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => downloadPayslip(s)}
                    className={`p-2 rounded-lg ${s.status === 'Released' || user.role === 'admin' ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-400 cursor-not-allowed'}`}
                    title={s.status === 'Released' ? 'Download Payslip' : 'Payslip not released yet'}
                    disabled={s.status !== 'Released' && user.role !== 'admin'}
                  >
                    <Download size={18} />
                  </button>
                  {user.role === 'admin' && s.status !== 'Released' && (
                    <button onClick={() => releasePayslip(s.id)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Release Payslip">
                      <span className="text-sm font-semibold">Release</span>
                    </button>
                  )}
                  {user.role === 'admin' && (
                    <button onClick={() => sendEmail(s.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Email Payslip">
                      <Mail size={18} />
                    </button>
                  )}
                  {user.role === 'admin' && (
                    <button onClick={() => handleDelete(s.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete Record">
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4 shrink-0">Record Monthly Salary</h2>
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium mb-1">Employee</label>
                <select 
                  className="input-field" 
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Month</label>
                <div className="relative">
                  <input
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Select month"
                  />
                  <div className="input-field flex items-center justify-between">
                    <span className="text-slate-600">
                      {formData.month ? new Date(formData.month + '-01').toLocaleString('en-GB', { month: 'long', year: 'numeric' }) : 'Select month'}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 011 1v1h6V3a1 1 0 112 0v1h1.5A1.5 1.5 0 0118 5.5v10A1.5 1.5 0 0116.5 17H3.5A1.5 1.5 0 012 15.5v-10A1.5 1.5 0 013.5 4H5V3a1 1 0 011-1zM3.5 6A.5.5 0 003 6.5V8h14V6.5a.5.5 0 00-.5-.5H15v1a1 1 0 11-2 0V6H7v1a1 1 0 11-2 0V6H3.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Base Salary</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    required
                    placeholder="e.g. 50000"
                    step="0.01"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({...formData, baseSalary: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bonus</label>
                  <input 
                    type="number" 
                    className="input-field"
                    step="0.01"
                    value={formData.bonus}
                    onChange={(e) => setFormData({...formData, bonus: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deductions</label>
                <input 
                  type="number" 
                  className="input-field"
                  step="0.01"
                  value={formData.deductions}
                  onChange={(e) => setFormData({...formData, deductions: e.target.value})}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={!formData.employeeId || !formData.month || !formData.baseSalary}
                  title={!formData.employeeId || !formData.month || !formData.baseSalary ? 'Select employee, month and base salary' : 'Save Record'}
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
