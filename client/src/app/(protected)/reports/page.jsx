"use client";

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import toast from 'react-hot-toast';

import { Download, Filter, Calendar, Users, FileSpreadsheet, Search, ChevronRight, X } from 'lucide-react';

const Reports = () => {
 const [reportData, setReportData] = useState([]);
 const [loading, setLoading] = useState(false);
 const [selectedEmp, setSelectedEmp] = useState(null);
 const [empPerformance, setEmpPerformance] = useState(null);
 const [modalLoading, setModalLoading] = useState(false);
 const [filters, setFilters] = useState({
 month: new Date().getMonth() + 1,
 year: new Date().getFullYear(),
 department: 'All'
 });

 const departments = ['All', 'Engineering', 'Marketing', 'HR', 'Sales', 'Design'];
 const months = [
 { name: 'January', value: 1 }, { name: 'February', value: 2 }, { name: 'March', value: 3 },
 { name: 'April', value: 4 }, { name: 'May', value: 5 }, { name: 'June', value: 6 },
 { name: 'July', value: 7 }, { name: 'August', value: 8 }, { name: 'September', value: 9 },
 { name: 'October', value: 10 }, { name: 'November', value: 11 }, { name: 'December', value: 12 }
 ];

 useEffect(() => {
 fetchReport();
 }, [filters.month, filters.year, filters.department]); // Re-fetch on filter change

 const fetchReport = async () => {
 setLoading(true);
 try {
 const res = await api.get(`/api/reports/monthly`, { params: filters });
 setReportData(res.data);
 } catch (err) {
 toast.error('Failed to generate workforce analytics');
 } finally {
 setLoading(false);
 }
 };

 const handleEmployeeClick = async (emp) => {
 setSelectedEmp(emp);
 setModalLoading(true);
 try {
 const res = await api.get(`/api/tasks/performance`, {
 params: { 
 employeeId: emp.id, 
 month: `${filters.year}-${String(filters.month).padStart(2, '0')}` 
 }
 });
 setEmpPerformance(res.data);
 } catch (err) {
 toast.error('Failed to load performance data');
 } finally {
 setModalLoading(false);
 }
 };

 const handleExport = async () => {
 try {
 toast.loading('Generating Enterprise Report...');
 const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/reports/export`, {
 responseType: 'blob'
 });
 const url = window.URL.createObjectURL(new Blob([response.data]));
 const link = document.createElement('a');
 link.href = url;
 link.setAttribute('download', `Attendance_Report_${filters.month}_${filters.year}.csv`);
 document.body.appendChild(link);
 link.click();
 toast.dismiss();
 toast.success('Report successfully exported');
 } catch (err) {
 toast.dismiss();
 toast.error('Export protocols failed');
 }
 };

 return (
 <div className="space-y-8 ">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h2 className="text-4xl font-black text-slate-900 tracking-tight">Workforce <span className="text-blue-600">Intelligence</span></h2>
 <p className="text-slate-500 font-medium">Advanced attendance analytics and export tools</p>
 </div>
 <button 
 onClick={handleExport}
 className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-2"
 >
 <FileSpreadsheet size={20} /> EXPORT MASTER LOG
 </button>
 </div>

 {/* Modern Filter Bar */}
 <div className="card border-none shadow-xl shadow-slate-100 flex flex-col md:flex-row flex-wrap gap-4 md:gap-8 items-stretch md:items-end bg-white">
 <div className="flex-1 min-w-[240px]">
 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 flex items-center gap-2">
 <Calendar size={14} className="text-blue-600" /> Reporting Period
 </label>
 <div className="grid grid-cols-2 gap-3">
 <select 
 className="input-field py-3 font-bold text-slate-700"
 value={filters.month}
 onChange={(e) => setFilters({...filters, month: e.target.value})}
 >
 {months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
 </select>
 <select 
 className="input-field py-3 font-bold text-slate-700"
 value={filters.year}
 onChange={(e) => setFilters({...filters, year: e.target.value})}
 >
 <option>2024</option>
 <option>2025</option>
 <option>2026</option>
 </select>
 </div>
 </div>
 
 <div className="flex-1 min-w-[240px]">
 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 flex items-center gap-2">
 <Users size={14} className="text-blue-600" /> Department Focus
 </label>
 <select 
 className="input-field py-3 font-bold text-slate-700"
 value={filters.department}
 onChange={(e) => setFilters({...filters, department: e.target.value})}
 >
 {departments.map(d => <option key={d} value={d}>{d}</option>)}
 </select>
 </div>

 <button 
 onClick={fetchReport}
 className="w-full md:w-auto px-8 py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-sm hover:bg-blue-100 flex items-center justify-center gap-2 border border-blue-100 mt-2 md:mt-0"
 >
 <Search size={18} /> QUERY DATA
 </button>
 </div>

 {/* Intelligence Table */}
 <div className="card overflow-hidden p-0 border-none shadow-2xl shadow-slate-100">
 <div className="overflow-x-auto">
 <table className="w-full text-left whitespace-nowrap">
 <thead>
 <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
 <th className="px-8 py-6">Employee Profile</th>
 <th className="px-8 py-6">Department</th>
 <th className="px-8 py-6 text-center">Engagement</th>
 <th className="px-8 py-6 text-right">Reliability Rate</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {loading ? (
 <tr>
 <td colSpan="4" className="px-8 py-20 text-center">
 <div className="flex flex-col items-center">
 <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aggregating Statistics...</p>
 </div>
 </td>
 </tr>
 ) : (
 reportData.map((emp) => {
 const present = emp.attendance.filter(a => a.status === 'Present').length;
 const halfDay = emp.attendance.filter(a => a.status === 'Half Day').length;
 const leaves = emp.leaves.length;
 const total = present + (halfDay * 0.5);
 const rate = ((total / 22) * 100).toFixed(1);

 return (
 <tr key={emp.id} onClick={() => handleEmployeeClick(emp)} className="group hover:bg-slate-50/80 cursor-pointer">
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-sm shadow-sm group- transition-transform">
 {emp.name.charAt(0)}
 </div>
 <div>
 <div className="font-black text-slate-800 tracking-tight">{emp.name}</div>
 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{emp.email}</div>
 </div>
 </div>
 </td>
 <td className="px-8 py-6">
 <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{emp.department}</span>
 </td>
 <td className="px-8 py-6">
 <div className="flex items-center justify-center gap-6">
 <div className="text-center">
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Present</p>
 <p className="text-lg font-black text-emerald-600">{present}</p>
 </div>
 <div className="text-center">
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Half Day</p>
 <p className="text-lg font-black text-amber-600">{halfDay}</p>
 </div>
 <div className="text-center">
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Absent</p>
 <p className="text-lg font-black text-rose-600">{emp.attendance.filter(a => a.status === 'Absent').length}</p>
 </div>
 <div className="text-center">
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leave</p>
 <p className="text-lg font-black text-blue-600">{leaves}</p>
 </div>
 </div>
 </td>
 <td className="px-8 py-6 text-right">
 <div className="inline-flex flex-col items-end">
 <div className="flex items-center gap-3 mb-2">
 <span className="font-black text-slate-800 text-xl">{rate}%</span>
 <ChevronRight size={16} className="text-slate-300" />
 </div>
 <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden">
 <div 
 className={`h-full ${parseFloat(rate) > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
 style={{ width: `${Math.min(rate, 100)}%` }}
 ></div>
 </div>
 </div>
 </td>
 </tr>
 );
 })
 )}
 {!loading && reportData.length === 0 && (
 <tr>
 <td colSpan="4" className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
 No workforce data available for selected period
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Glassmorphic Employee Activity Modal */}
 {selectedEmp && (
 <div className="fixed inset-0 z-50 flex justify-center p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
 {/* Backdrop */}
 <div className="fixed inset-0 bg-slate-900/40 " onClick={() => setSelectedEmp(null)}></div>
 
 {/* Modal Container */}
 <div className="relative w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col bg-white/70 border border-white/60 my-auto h-fit max-h-[95vh]">
 {/* Glowing Orbs for Glassmorphism Effect */}
 <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
 <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px]"></div>
 <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[100px]"></div>
 </div>

 <div className="p-4 md:p-8 border-b border-white/40 flex justify-between items-start bg-white/30 shrink-0">
 <div className="flex items-center gap-4 md:gap-5">
 <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-200 border border-white/20">
 {selectedEmp.name.charAt(0)}
 </div>
 <div>
 <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{selectedEmp.name}</h3>
 <div className="flex items-center gap-3 mt-2">
 <span className="px-3 py-1 bg-white/60 text-slate-700 border border-white/50 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">{selectedEmp.department}</span>
 <span className="text-xs font-bold text-slate-500">{selectedEmp.email}</span>
 </div>
 </div>
 </div>
 <button 
 onClick={() => setSelectedEmp(null)}
 className="p-3 bg-white/50 border border-white/50 text-slate-500 hover:text-slate-800 rounded-xl shadow-sm hover:shadow-md "
 >
 <X size={20} />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/10">
 {modalLoading ? (
 <div className="flex justify-center items-center h-40">
 <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
 </div>
 ) : (
 <div className="space-y-8">
 {/* Stats Grid */}
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 {(() => {
 const present = selectedEmp.attendance.filter(a => a.status === 'Present').length;
 const halfDay = selectedEmp.attendance.filter(a => a.status === 'Half Day').length;
 const absent = selectedEmp.attendance.filter(a => a.status === 'Absent').length;
 const leaves = selectedEmp.leaves.length;
 const targetCleared = empPerformance?.target?.achievedCount || 0;
 const targetTotal = empPerformance?.target?.targetCount || 30;

 return (
 <>
 <div className="bg-white/60 p-6 rounded-2xl shadow-sm border border-white/60 text-center transition-transform ">
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Present</p>
 <p className="text-3xl font-black text-emerald-600 drop-shadow-sm">{present}</p>
 </div>
 <div className="bg-white/60 p-6 rounded-2xl shadow-sm border border-white/60 text-center transition-transform ">
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Half Day</p>
 <p className="text-3xl font-black text-amber-600 drop-shadow-sm">{halfDay}</p>
 </div>
 <div className="bg-white/60 p-6 rounded-2xl shadow-sm border border-white/60 text-center transition-transform ">
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Absent</p>
 <p className="text-3xl font-black text-rose-600 drop-shadow-sm">{absent}</p>
 </div>
 <div className="bg-white/60 p-6 rounded-2xl shadow-sm border border-white/60 text-center transition-transform ">
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Leave</p>
 <p className="text-3xl font-black text-blue-600 drop-shadow-sm">{leaves}</p>
 </div>
 <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-xl shadow-slate-300/50 border border-slate-700 text-center relative overflow-hidden transition-transform ">
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Target Cleared</p>
 <p className="text-3xl font-black text-white relative z-10">{targetCleared} <span className="text-sm text-slate-500">/ {targetTotal}</span></p>
 </div>
 </>
 );
 })()}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Left Column: Timeline */}
 <div>
 <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-emerald-500 "></div>
 Attendance & Leaves
 </h4>
 
 <div className="bg-white/50 rounded-3xl p-6 shadow-sm border border-white/60 h-[400px] overflow-y-auto custom-scrollbar">
 {(() => {
 const activities = [];
 
 // Add attendance records
 selectedEmp.attendance.forEach(a => {
 activities.push({
 type: 'attendance',
 date: new Date(a.date),
 status: a.status,
 checkIn: a.checkIn,
 checkOut: a.checkOut
 });
 });
 
 // Add leaves
 selectedEmp.leaves.forEach(l => {
 activities.push({
 type: 'leave',
 date: new Date(l.fromDate),
 status: 'Leave Approved',
 reason: l.reason,
 toDate: l.toDate
 });
 });
 
 activities.sort((a, b) => b.date - a.date);

 if (activities.length === 0) {
 return <div className="text-center py-8 text-slate-500 font-bold text-sm">No recent attendance found.</div>;
 }

 return (
 <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500/20 before:via-slate-200 before:to-transparent">
 {activities.map((act, i) => (
 <div key={i} className="relative flex items-start gap-4 group">
 <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-50 text-blue-600 shrink-0 shadow-sm z-10 group- transition-transform">
 <Calendar size={16} />
 </div>
 <div className="flex-1 bg-white/70 p-4 rounded-2xl shadow-sm border border-white/60 group-hover:shadow-md ">
 <div className="flex items-center justify-between mb-1">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{act.date.toLocaleDateString()}</span>
 <span className={`text-[10px] font-black uppercase tracking-widest ${act.status === 'Present' ? 'text-emerald-600' : act.status === 'Absent' ? 'text-rose-600' : 'text-amber-600'}`}>
 {act.status}
 </span>
 </div>
 
 {act.type === 'attendance' && act.status !== 'Absent' && (
 <p className="text-sm font-bold text-slate-600 mt-1">Punched in at <span className="text-slate-900">{act.checkIn || 'N/A'}</span></p>
 )}
 {act.type === 'leave' && (
 <p className="text-sm font-bold text-slate-600 mt-1">Leave till <span className="text-slate-900">{new Date(act.toDate).toLocaleDateString()}</span> - {act.reason}</p>
 )}
 </div>
 </div>
 ))}
 </div>
 );
 })()}
 </div>
 </div>

 {/* Right Column: Targets Details */}
 <div>
 <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-blue-500 "></div>
 Targets Details
 </h4>
 
 <div className="bg-white/50 rounded-3xl p-6 shadow-sm border border-white/60 h-[400px] overflow-y-auto custom-scrollbar">
 {empPerformance?.submissions?.length > 0 ? (
 <div className="space-y-4">
 {empPerformance.submissions.sort((a,b) => new Date(b.date) - new Date(a.date)).map((sub, idx) => (
 <div key={idx} className="bg-white/70 p-4 rounded-2xl shadow-sm border border-white/60 transition-transform group">
 <div className="flex justify-between items-start mb-2">
 <div>
 <h5 className="font-black text-slate-800 text-sm">{sub.studentName}</h5>
 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{sub.domain || 'Target'}</p>
 </div>
 <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
 {new Date(sub.date).toLocaleDateString()}
 </span>
 </div>
 <div className="grid grid-cols-2 gap-2 mt-3">
 {sub.collegeName && (
 <div className="text-xs">
 <span className="block text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">College/Org</span>
 <span className="font-medium text-slate-700 truncate block">{sub.collegeName}</span>
 </div>
 )}
 {sub.amountPaid > 0 && (
 <div className="text-xs">
 <span className="block text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Amount</span>
 <span className="font-black text-emerald-600">₹{sub.amountPaid}</span>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
 <Search size={32} className="opacity-20" />
 <p className="font-bold text-sm uppercase tracking-widest text-center">No targets completed<br/>this month</p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default Reports;
