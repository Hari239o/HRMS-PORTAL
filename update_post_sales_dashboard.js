const fs = require('fs');
const file = 'client/src/app/(protected)/performance/page.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Employee Wise Revenue
const oldEmployeeBlock = `<div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-xl border border-slate-700 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <h4 className="text-sm font-bold text-slate-400 mb-2 relative z-10">Pending by Employee</h4>
              <div className="flex flex-col gap-2 relative z-10 max-h-[80px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.keys(pendingByEmployee).length > 0 ? (
                  Object.entries(pendingByEmployee).map(([emp, amount]) => (
                    <div key={emp} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200 truncate pr-2">{emp}</span>
                      <span className="font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">₹{amount.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs font-semibold text-slate-500 italic">No pending revenue!</span>
                )}
              </div>
            </div>`;

const newEmployeeBlock = `<div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-700 col-span-1 md:col-span-3">
              <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-widest flex items-center gap-2">
                <Users size={16} className="text-blue-400" />
                Employee Wise Revenue Analytics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(
                  clearances.reduce((acc, sub) => {
                    const name = sub.employeeName || 'Unknown';
                    if (!acc[name]) acc[name] = { total: 0, received: 0, pending: 0 };
                    acc[name].total += (sub.totalAmount || 0);
                    acc[name].received += (sub.amountPaid || 0);
                    acc[name].pending += (sub.remainingAmount || 0);
                    return acc;
                  }, {})
                ).map(([emp, stats]) => (
                  <div key={emp} className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50">
                    <span className="text-sm font-bold text-white mb-3 block border-b border-slate-700 pb-2">{emp}</span>
                    <div className="flex justify-between text-xs mt-2">
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-widest text-[9px]">Total</span>
                        <span className="font-medium text-slate-200">₹{stats.total.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-widest text-[9px]">Received</span>
                        <span className="font-medium text-emerald-400">₹{stats.received.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-widest text-[9px]">Pending</span>
                        <span className="font-medium text-amber-400">₹{stats.pending.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>`;

if (content.includes('Pending by Employee')) {
  content = content.replace(oldEmployeeBlock, newEmployeeBlock);
}

// 2. Pending Clearances Delete Button
const oldPendingAction = `<td className="px-6 py-4 text-right space-x-2">
                          <button 
                            onClick={() => setSelectedClearance(sub)}
                            className="px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl transition-colors inline-flex items-center gap-2 font-bold text-xs"
                          >
                            <Wallet size={16} /> Update Payment
                          </button>
                        </td>`;

const newPendingAction = `<td className="px-6 py-4 text-right space-y-2">
                          <button 
                            onClick={() => setSelectedClearance(sub)}
                            className="w-full px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl transition-colors inline-flex justify-center items-center gap-2 font-bold text-xs"
                          >
                            <Wallet size={14} /> Update Payment
                          </button>
                          <button 
                            onClick={() => handleDeleteSubmission(sub.id, true)}
                            className="w-full px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-colors inline-flex justify-center items-center gap-2 font-bold text-xs"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>`;

content = content.replace(oldPendingAction, newPendingAction);

// 3. Completed Clearances Actions Header & Column
const oldCompletedHeader = `<th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Financials</th>
                    </tr>`;
const newCompletedHeader = `<th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Financials</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                    </tr>`;
content = content.replace(oldCompletedHeader, newCompletedHeader);

const oldCompletedRow = `<td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md w-max border border-emerald-100">
                              Fully Paid: ₹{sub.totalAmount?.toLocaleString()}
                            </span>
                          </div>
                        </td>
                      </tr>`;
const newCompletedRow = `<td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md w-max border border-emerald-100">
                              Fully Paid: ₹{sub.totalAmount?.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDeleteSubmission(sub.id, true)}
                            className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-colors inline-flex justify-center items-center gap-2 font-bold text-xs"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>`;
content = content.replaceAll(oldCompletedRow, newCompletedRow);

// Add Trash2 to imports
const lucideImport = `import { Calendar, Download, Users, Briefcase, FileText, UploadCloud, Link as LinkIcon, CheckCircle, XCircle, Clock, Wallet, AlertCircle } from 'lucide-react';`;
const newLucideImport = `import { Calendar, Download, Users, Briefcase, FileText, UploadCloud, Link as LinkIcon, CheckCircle, XCircle, Clock, Wallet, AlertCircle, Trash2 } from 'lucide-react';`;
if (!content.includes('Trash2')) {
  content = content.replace(lucideImport, newLucideImport);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated Post Sales UI!');
