"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { IndianRupee, Download, Mail, Plus, User, Trash2, Edit2 } from 'lucide-react';

export default function Salary() {
 const { user } = useAuth();
 const [salaries, setSalaries] = useState([]);
 const [employees, setEmployees] = useState([]);
 const [showModal, setShowModal] = useState(false);
 const [isReleasing, setIsReleasing] = useState(null);
 const [editSalaryId, setEditSalaryId] = useState(null);
 const defaultFormData = {
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
 bonus: '',
 pf: '',
 esi: '',
 professionalTax: '',
 tds: '',
 otherDeductions: ''
 };

 const [formData, setFormData] = useState(defaultFormData);

 useEffect(() => {
 if (!user) return;
 fetchSalaries();
 if (user?.role === 'admin') fetchEmployees();
 }, [user?.id, user?.role]);

 const fetchSalaries = async () => {
 try {
 const res = await api.get(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/salary`);
 setSalaries(res.data);
 } catch (err) {
 toast.error("Failed to load salaries");
 }
 };

 const fetchEmployees = async () => {
 try {
 const res = await api.get(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/employees`); // Corrected endpoint
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

 if (editSalaryId) {
 await api.put(`/api/salary/${editSalaryId}`, payload);
 toast.success("Salary updated successfully");
 } else {
 await api.post(`/api/salary`, payload);
 toast.success("Salary recorded successfully");
 }
 
 closeModal();
 fetchSalaries();
 } catch (err) {
 toast.error(err.response?.data?.error || "Failed to save salary");
 }
 };

 const downloadPayslip = async (salary) => {
 if (user.role !== 'admin' && salary.status !== 'Released') {
 return toast.error('Payslip is not yet released.');
 }
 try {
 const response = await api.get(`/api/salary/generate/${salary.id}`, {
 responseType: 'blob'
 });
 const url = window.URL.createObjectURL(new Blob([response.data]));
 const link = document.createElement('a');
 link.href = url;
 link.setAttribute('download', `payslip-${salary.month}.pdf`);
 document.body.appendChild(link);
 link.click();
 link.remove();
 } catch (err) {
 toast.error('Failed to download payslip');
 }
 };

 const releasePayslip = async (salaryId) => {
 try {
 setIsReleasing(salaryId);
 await api.patch(`/api/salary/release/${salaryId}`);
 toast.success('Payslip released and employee notified');
 fetchSalaries();
 } catch (err) {
 toast.error(err.response?.data?.error || 'Failed to release payslip');
 } finally {
 setIsReleasing(null);
 }
 };

 const sendEmail = async (salaryId) => {
 try {
 await api.post(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/salary/send-email`, { salaryId });
 toast.success('Payslip sent to employee email');
 fetchSalaries();
 } catch (err) {
 toast.error(err.response?.data?.error || 'Failed to send email');
 }
 };

 const handleDelete = async (salaryId) => {
 if (!window.confirm("Are you sure you want to delete this salary record?")) return;
 try {
 await api.delete(`/api/salary/${salaryId}`);
 toast.success("Salary record deleted successfully");
 fetchSalaries();
 } catch (err) {
 toast.error(err.response?.data?.error || "Failed to delete salary record");
 }
 };

 const openModalForNew = () => {
 setEditSalaryId(null);
 setFormData(defaultFormData);
 setShowModal(true);
 };

 const openModalForEdit = (salary) => {
 setEditSalaryId(salary.id);
 setFormData({
 employeeId: salary.employeeId || '',
 month: salary.month || new Date().toISOString().slice(0,7),
 empId: salary.empId || '',
 designation: salary.designation || '',
 pan: salary.pan || '',
 uan: salary.uan || '',
 bankName: salary.bankName || '',
 accountNumber: salary.accountNumber || '',
 basicSalary: salary.basicSalary || '',
 hra: salary.hra || '',
 specialAllowance: salary.specialAllowance || '',
 incentives: salary.incentives || '',
 otherAllowances: salary.otherAllowances || '',
 bonus: salary.bonus || '',
 pf: salary.pf || '',
 esi: salary.esi || '',
 professionalTax: salary.professionalTax || '',
 tds: salary.tds || '',
 otherDeductions: salary.otherDeductions || ''
 });
 setShowModal(true);
 };

 const closeModal = () => {
 setShowModal(false);
 setEditSalaryId(null);
 };

 return (
 <div className="space-y-6 ">
 <div className="flex justify-between items-center">
 <h1 className="text-2xl font-bold text-slate-800">Payroll Management</h1>
 {user.role === 'admin' && (
 <button onClick={openModalForNew} className="btn-primary">
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
 <button onClick={() => openModalForEdit(s)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit Record">
 <Edit2 size={18} />
 </button>
 )}
 {user.role === 'admin' && s.status !== 'Released' && (
 <button 
 onClick={() => releasePayslip(s.id)} 
 disabled={isReleasing === s.id}
 title="Release Payslip"
 className={`p-2 rounded-lg ${isReleasing === s.id ? 'text-slate-400 cursor-not-allowed' : 'text-amber-600 hover:bg-amber-50'}`}
 >
 <span className="text-sm font-semibold">{isReleasing === s.id ? 'Releasing...' : 'Release'}</span>
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

 {showModal && createPortal(
 <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
 <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
 {/* Background overlay */}
 <div className="fixed inset-0 bg-slate-900/60 transition-opacity" aria-hidden="true" onClick={closeModal}></div>
 
 {/* This element is to trick the browser into centering the modal contents. */}
 <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
 
 <div className="inline-block transform rounded-2xl bg-white text-left align-bottom shadow-2xl sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle ">
 <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 rounded-t-2xl border-b border-slate-100 flex justify-between items-center">
 <div className="flex items-center gap-3">
 <div className="bg-blue-50 p-2 rounded-lg">
 <IndianRupee className="w-6 h-6 text-blue-600" />
 </div>
 <h3 className="text-xl font-bold leading-6 text-slate-800" id="modal-title">
 {editSalaryId ? 'Edit Monthly Salary' : 'Record Monthly Salary'}
 </h3>
 </div>
 <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
 </button>
 </div>
 
 <div className="bg-slate-50/50 px-4 pt-5 pb-6 sm:px-6">
 <form id="salaryForm" onSubmit={handleSubmit} className="space-y-6">
 {/* Top Section: Employee and Month */}
 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
 <div>
 <label className="block text-sm font-semibold mb-1.5 text-slate-700">Select Employee *</label>
 <select 
 className="input-field w-full bg-slate-50 focus:bg-white text-sm" 
 required
 value={formData.employeeId}
 onChange={(e) => {
 const id = e.target.value;
 const emp = employees.find(x => x.id === id);
 
 // Find previous salary record to auto-fill
 const previousSalary = salaries.find(s => s.employeeId === id);
 
 setFormData({
 ...formData, 
 employeeId: id,
 empId: emp?.empId || '',
 designation: emp?.designation || '',
 pan: emp?.pan || '',
 uan: emp?.uan || '',
 bankName: emp?.bankName || '',
 accountNumber: emp?.accountNumber || '',
 
 // Auto-fill financial details if a previous record exists
 basicSalary: previousSalary ? previousSalary.basicSalary : formData.basicSalary,
 hra: previousSalary ? previousSalary.hra : formData.hra,
 specialAllowance: previousSalary ? previousSalary.specialAllowance : formData.specialAllowance,
 incentives: previousSalary ? previousSalary.incentives : formData.incentives,
 otherAllowances: previousSalary ? previousSalary.otherAllowances : formData.otherAllowances,
 pf: previousSalary ? previousSalary.pf : formData.pf,
 esi: previousSalary ? previousSalary.esi : formData.esi,
 professionalTax: previousSalary ? previousSalary.professionalTax : formData.professionalTax,
 tds: previousSalary ? previousSalary.tds : formData.tds,
 otherDeductions: previousSalary ? previousSalary.otherDeductions : formData.otherDeductions
 });
 }}
 >
 <option value="">-- Choose Employee --</option>
 {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>)}
 </select>
 </div>
 <div>
 <label className="block text-sm font-semibold mb-1.5 text-slate-700">Salary Month *</label>
 <div className="relative">
 <input
 type="month"
 value={formData.month}
 onChange={(e) => setFormData({...formData, month: e.target.value})}
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
 required
 />
 <div className="input-field w-full bg-slate-50 flex items-center justify-between pointer-events-none text-sm">
 <span className="text-slate-700 font-medium">
 {formData.month ? new Date(formData.month + '-01').toLocaleString('en-GB', { month: 'long', year: 'numeric' }) : 'Select month'}
 </span>
 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
 <path fillRule="evenodd" d="M6 2a1 1 0 011 1v1h6V3a1 1 0 112 0v1h1.5A1.5 1.5 0 0118 5.5v10A1.5 1.5 0 0116.5 17H3.5A1.5 1.5 0 012 15.5v-10A1.5 1.5 0 013.5 4H5V3a1 1 0 011-1zM3.5 6A.5.5 0 003 6.5V8h14V6.5a.5.5 0 00-.5-.5H15v1a1 1 0 11-2 0V6H7v1a1 1 0 11-2 0V6H3.5z" clipRule="evenodd" />
 </svg>
 </div>
 </div>
 </div>
 </div>

 <div className="relative">
 <div className="absolute inset-0 flex items-center" aria-hidden="true">
 <div className="w-full border-t border-slate-200"></div>
 </div>
 <div className="relative flex justify-start">
 <span className="bg-white pr-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Employee Details (Overrides)</span>
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5">
 <div>
 <label className="block text-xs font-semibold text-slate-600 mb-1">Employee ID</label>
 <input type="text" className="input-field py-1.5 px-3 text-sm w-full bg-slate-50 focus:bg-white" value={formData.empId} onChange={(e) => setFormData({...formData, empId: e.target.value})} placeholder="Optional" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-600 mb-1">Designation</label>
 <input type="text" className="input-field py-1.5 px-3 text-sm w-full bg-slate-50 focus:bg-white" value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} placeholder="Optional" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-600 mb-1">PAN</label>
 <input type="text" className="input-field py-1.5 px-3 text-sm w-full bg-slate-50 focus:bg-white" value={formData.pan} onChange={(e) => setFormData({...formData, pan: e.target.value})} placeholder="Optional" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-600 mb-1">UAN</label>
 <input type="text" className="input-field py-1.5 px-3 text-sm w-full bg-slate-50 focus:bg-white" value={formData.uan} onChange={(e) => setFormData({...formData, uan: e.target.value})} placeholder="Optional" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Name</label>
 <input type="text" className="input-field py-1.5 px-3 text-sm w-full bg-slate-50 focus:bg-white" value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} placeholder="Optional" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-600 mb-1">Account No</label>
 <input type="text" className="input-field py-1.5 px-3 text-sm w-full bg-slate-50 focus:bg-white" value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} placeholder="Optional" />
 </div>
 </div>
 </div>

 {/* Financials Section */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Earnings Column */}
 <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-[0_2px_10px_-3px_rgba(59,130,246,0.1)]">
 <div className="flex items-center gap-2 mb-5 pb-3 border-b border-blue-50">
 <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
 <h4 className="text-sm font-bold text-blue-700 uppercase tracking-wider">Earnings</h4>
 </div>
 <div className="grid grid-cols-2 gap-x-5 gap-y-4">
 <div className="col-span-2 sm:col-span-1">
 <label className="block text-xs font-semibold mb-1 text-slate-600">Basic Salary *</label>
 <input type="number" className="input-field py-2 text-sm w-full bg-slate-50 focus:bg-white border-blue-100 focus:border-blue-400" required placeholder="0.00" step="0.01" value={formData.basicSalary} onChange={(e) => setFormData({...formData, basicSalary: e.target.value})} />
 </div>
 <div className="col-span-2 sm:col-span-1">
 <label className="block text-xs font-semibold mb-1 text-slate-600">HRA</label>
 <input type="number" className="input-field py-2 text-sm w-full bg-slate-50 focus:bg-white" placeholder="0.00" step="0.01" value={formData.hra} onChange={(e) => setFormData({...formData, hra: e.target.value})} />
 </div>
 <div className="col-span-2 sm:col-span-1">
 <label className="block text-xs font-semibold mb-1 text-slate-600">Special Allowance</label>
 <input type="number" className="input-field py-2 text-sm w-full bg-slate-50 focus:bg-white" placeholder="0.00" step="0.01" value={formData.specialAllowance} onChange={(e) => setFormData({...formData, specialAllowance: e.target.value})} />
 </div>
 <div className="col-span-2 sm:col-span-1">
 <label className="block text-xs font-semibold mb-1 text-slate-600">Incentives</label>
 <input type="number" className="input-field py-2 text-sm w-full bg-slate-50 focus:bg-white" placeholder="0.00" step="0.01" value={formData.incentives} onChange={(e) => setFormData({...formData, incentives: e.target.value})} />
 </div>
 <div className="col-span-2 sm:col-span-1">
 <label className="block text-xs font-semibold mb-1 text-slate-600">Other Allowances</label>
 <input type="number" className="input-field py-2 text-sm w-full bg-slate-50 focus:bg-white" placeholder="0.00" step="0.01" value={formData.otherAllowances} onChange={(e) => setFormData({...formData, otherAllowances: e.target.value})} />
 </div>
 <div className="col-span-2 sm:col-span-1">
 <label className="block text-xs font-semibold mb-1 text-slate-600">Bonus</label>
 <input type="number" className="input-field py-2 text-sm w-full bg-slate-50 focus:bg-white" placeholder="0.00" step="0.01" value={formData.bonus} onChange={(e) => setFormData({...formData, bonus: e.target.value})} />
 </div>
 </div>
 </div>
 
 {/* Deductions Column */}
 <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-[0_2px_10px_-3px_rgba(225,29,72,0.1)]">
 <div className="flex items-center gap-2 mb-5 pb-3 border-b border-rose-50">
 <div className="w-1.5 h-4 bg-rose-500 rounded-full"></div>
 <h4 className="text-sm font-bold text-rose-700 uppercase tracking-wider">Deductions</h4>
 </div>
 <div className="grid grid-cols-2 gap-x-5 gap-y-4">
 <div className="col-span-2 sm:col-span-1">
 <label className="block text-xs font-semibold mb-1 text-slate-600">Provident Fund (PF)</label>
 <input type="number" className="input-field py-2 text-sm w-full bg-slate-50 focus:bg-white border-rose-100 focus:border-rose-400" placeholder="0.00" step="0.01" value={formData.pf} onChange={(e) => setFormData({...formData, pf: e.target.value})} />
 </div>
 <div className="col-span-2 sm:col-span-1">
 <label className="block text-xs font-semibold mb-1 text-slate-600">ESI</label>
 <input type="number" className="input-field py-2 text-sm w-full bg-slate-50 focus:bg-white border-rose-100 focus:border-rose-400" placeholder="0.00" step="0.01" value={formData.esi} onChange={(e) => setFormData({...formData, esi: e.target.value})} />
 </div>
 <div className="col-span-2 sm:col-span-1">
 <label className="block text-xs font-semibold mb-1 text-slate-600">Professional Tax</label>
 <input type="number" className="input-field py-2 text-sm w-full bg-slate-50 focus:bg-white border-rose-100 focus:border-rose-400" placeholder="0.00" step="0.01" value={formData.professionalTax} onChange={(e) => setFormData({...formData, professionalTax: e.target.value})} />
 </div>
 <div className="col-span-2 sm:col-span-1">
 <label className="block text-xs font-semibold mb-1 text-slate-600">TDS</label>
 <input type="number" className="input-field py-2 text-sm w-full bg-slate-50 focus:bg-white border-rose-100 focus:border-rose-400" placeholder="0.00" step="0.01" value={formData.tds} onChange={(e) => setFormData({...formData, tds: e.target.value})} />
 </div>
 <div className="col-span-2">
 <label className="block text-xs font-semibold mb-1 text-slate-600">Other Deductions</label>
 <input type="number" className="input-field py-2 text-sm w-full bg-slate-50 focus:bg-white border-rose-100 focus:border-rose-400" placeholder="0.00" step="0.01" value={formData.otherDeductions} onChange={(e) => setFormData({...formData, otherDeductions: e.target.value})} />
 </div>
 </div>
 </div>
 </div>
 </form>
 </div>
 
 <div className="bg-slate-50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-2xl border-t border-slate-200">
 <button
 type="submit"
 form="salaryForm"
 className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-2.5 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 disabled={!formData.employeeId || !formData.month || !formData.basicSalary}
 title={!formData.employeeId || !formData.month || !formData.basicSalary ? 'Select employee, month and basic salary' : 'Save Record'}
 >
 Generate & Send Payslip
 </button>
 <button
 type="button"
 onClick={closeModal}
 className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-300 shadow-sm px-6 py-2.5 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
 >
 Cancel
 </button>
 </div>
 </div>
 </div>
 </div>
 , document.body)}
 </div>
 );
}
