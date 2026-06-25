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
    empId: '',
    designation: '',
    pan: '',
    uan: '',
    bankName: '',
    accountNumber: '',
    basicSalary: '',
    hra: '',
    specialAllowance: '',
    incentives: '',
    otherAllowances: '',
    bonus: 0,
    pf: '',
    esi: '',
    professionalTax: '',
    tds: '',
    otherDeductions: ''
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
        basicSalary: Number(formData.basicSalary) || 0,
        hra: Number(formData.hra) || 0,
        specialAllowance: Number(formData.specialAllowance) || 0,
        incentives: Number(formData.incentives) || 0,
        otherAllowances: Number(formData.otherAllowances) || 0,
        bonus: Number(formData.bonus) || 0,
        pf: Number(formData.pf) || 0,
        esi: Number(formData.esi) || 0,
        professionalTax: Number(formData.professionalTax) || 0,
        tds: Number(formData.tds) || 0,
        otherDeductions: Number(formData.otherDeductions) || 0,
        empId: formData.empId || undefined,
        designation: formData.designation || undefined,
        pan: formData.pan || undefined,
        uan: formData.uan || undefined,
        bankName: formData.bankName || undefined,
        accountNumber: formData.accountNumber || undefined
      };
      if (!payload.employeeId || !payload.month || payload.basicSalary <= 0) {
        return toast.error('Please select employee, month and a valid basic salary');
      }
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/salary`, payload);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center rounded-t-xl">
              <h2 className="text-lg font-bold text-slate-800">Record Monthly Salary</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-4 bg-slate-50/30">
              <form id="salaryForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700">Employee *</label>
                    <select 
                      className="input-field w-full bg-white py-1.5 text-sm" 
                      required
                      value={formData.employeeId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const emp = employees.find(x => x.id === id);
                        setFormData({
                          ...formData, 
                          employeeId: id,
                          empId: emp?.empId || '',
                          designation: emp?.designation || '',
                          pan: emp?.pan || '',
                          uan: emp?.uan || '',
                          bankName: emp?.bankName || '',
                          accountNumber: emp?.accountNumber || ''
                        });
                      }}
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700">Month *</label>
                    <div className="relative">
                      <input
                        type="month"
                        value={formData.month}
                        onChange={(e) => setFormData({...formData, month: e.target.value})}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        required
                      />
                      <div className="input-field w-full bg-white py-1.5 text-sm flex items-center justify-between pointer-events-none">
                        <span className="text-slate-700">
                          {formData.month ? new Date(formData.month + '-01').toLocaleString('en-GB', { month: 'long', year: 'numeric' }) : 'Select month'}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 011 1v1h6V3a1 1 0 112 0v1h1.5A1.5 1.5 0 0118 5.5v10A1.5 1.5 0 0116.5 17H3.5A1.5 1.5 0 012 15.5v-10A1.5 1.5 0 013.5 4H5V3a1 1 0 011-1zM3.5 6A.5.5 0 003 6.5V8h14V6.5a.5.5 0 00-.5-.5H15v1a1 1 0 11-2 0V6H7v1a1 1 0 11-2 0V6H3.5z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 border border-slate-100 rounded-lg p-2 bg-white">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Employee ID</label>
                    <input type="text" className="input-field py-1 px-2 text-xs w-full bg-slate-50 focus:bg-white" value={formData.empId} onChange={(e) => setFormData({...formData, empId: e.target.value})} placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Designation</label>
                    <input type="text" className="input-field py-1 px-2 text-xs w-full bg-slate-50 focus:bg-white" value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">PAN</label>
                    <input type="text" className="input-field py-1 px-2 text-xs w-full bg-slate-50 focus:bg-white" value={formData.pan} onChange={(e) => setFormData({...formData, pan: e.target.value})} placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">UAN</label>
                    <input type="text" className="input-field py-1 px-2 text-xs w-full bg-slate-50 focus:bg-white" value={formData.uan} onChange={(e) => setFormData({...formData, uan: e.target.value})} placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Bank Name</label>
                    <input type="text" className="input-field py-1 px-2 text-xs w-full bg-slate-50 focus:bg-white" value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Account No</label>
                    <input type="text" className="input-field py-1 px-2 text-xs w-full bg-slate-50 focus:bg-white" value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} placeholder="Optional" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Earnings Column */}
                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-3 flex items-center gap-2">
                       Earnings
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <label className="block text-[10px] font-bold mb-0.5 text-slate-500 uppercase">Basic Salary *</label>
                        <input type="number" className="input-field py-1 text-sm w-full bg-slate-50 focus:bg-white" required placeholder="50000" step="0.01" value={formData.basicSalary} onChange={(e) => setFormData({...formData, basicSalary: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold mb-0.5 text-slate-500 uppercase">HRA</label>
                        <input type="number" className="input-field py-1 text-sm w-full bg-slate-50 focus:bg-white" step="0.01" value={formData.hra} onChange={(e) => setFormData({...formData, hra: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold mb-0.5 text-slate-500 uppercase">Special Allowance</label>
                        <input type="number" className="input-field py-1 text-sm w-full bg-slate-50 focus:bg-white" step="0.01" value={formData.specialAllowance} onChange={(e) => setFormData({...formData, specialAllowance: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold mb-0.5 text-slate-500 uppercase">Incentives</label>
                        <input type="number" className="input-field py-1 text-sm w-full bg-slate-50 focus:bg-white" step="0.01" value={formData.incentives} onChange={(e) => setFormData({...formData, incentives: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold mb-0.5 text-slate-500 uppercase">Other Allowances</label>
                        <input type="number" className="input-field py-1 text-sm w-full bg-slate-50 focus:bg-white" step="0.01" value={formData.otherAllowances} onChange={(e) => setFormData({...formData, otherAllowances: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold mb-0.5 text-slate-500 uppercase">Bonus</label>
                        <input type="number" className="input-field py-1 text-sm w-full bg-slate-50 focus:bg-white" step="0.01" value={formData.bonus} onChange={(e) => setFormData({...formData, bonus: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Deductions Column */}
                  <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-rose-600 mb-3 flex items-center gap-2">
                       Deductions
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <label className="block text-[10px] font-bold mb-0.5 text-slate-500 uppercase">Provident Fund (PF)</label>
                        <input type="number" className="input-field py-1 text-sm w-full bg-slate-50 focus:bg-white" step="0.01" value={formData.pf} onChange={(e) => setFormData({...formData, pf: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold mb-0.5 text-slate-500 uppercase">ESI</label>
                        <input type="number" className="input-field py-1 text-sm w-full bg-slate-50 focus:bg-white" step="0.01" value={formData.esi} onChange={(e) => setFormData({...formData, esi: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold mb-0.5 text-slate-500 uppercase">Professional Tax</label>
                        <input type="number" className="input-field py-1 text-sm w-full bg-slate-50 focus:bg-white" step="0.01" value={formData.professionalTax} onChange={(e) => setFormData({...formData, professionalTax: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold mb-0.5 text-slate-500 uppercase">TDS</label>
                        <input type="number" className="input-field py-1 text-sm w-full bg-slate-50 focus:bg-white" step="0.01" value={formData.tds} onChange={(e) => setFormData({...formData, tds: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold mb-0.5 text-slate-500 uppercase">Other Deductions</label>
                        <input type="number" className="input-field py-1 text-sm w-full bg-slate-50 focus:bg-white" step="0.01" value={formData.otherDeductions} onChange={(e) => setFormData({...formData, otherDeductions: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3 rounded-b-xl">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-sm text-slate-600 hover:bg-slate-100 font-semibold rounded-lg transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                form="salaryForm"
                className="btn-primary px-6 py-2 text-sm shadow-md shadow-blue-500/20"
                disabled={!formData.employeeId || !formData.month || !formData.basicSalary}
                title={!formData.employeeId || !formData.month || !formData.basicSalary ? 'Select employee, month and basic salary' : 'Save Record'}
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
