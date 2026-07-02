const fs = require('fs');
const file = 'client/src/app/(protected)/performance/page.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Form state init
content = content.replace(
  `remainingAmountDate: ''`,
  `remainingAmountDate: '',\n    courseType: 'Live',\n    courseDuration: '1',\n    file: null`
);

// 2. Form submission
const oldSubmitBlock = `await api.post(\`\${process.env.NEXT_PUBLIC_API_URL || ''}/api/tasks/submit\`, form);
      toast.success('Sale registered successfully!');
      setForm({ studentName: '', domain: '', collegeName: '', mailId: '', phoneNumber: '', totalAmount: '', amountPaid: '', remainingAmount: '', remainingAmountDate: '' });`;

const newSubmitBlock = `const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });
      await api.post(\`\${process.env.NEXT_PUBLIC_API_URL || ''}/api/tasks/submit\`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      toast.success('Sale registered successfully!');
      setForm({ studentName: '', domain: '', collegeName: '', mailId: '', phoneNumber: '', totalAmount: '', amountPaid: '', remainingAmount: '', remainingAmountDate: '', courseType: 'Live', courseDuration: '1', file: null });
      if (document.querySelector('input[type="file"]')) {
        document.querySelector('input[type="file"]').value = '';
      }`;

content = content.replace(oldSubmitBlock, newSubmitBlock);

// 3. Form UI inputs
const oldEmailInputEnd = `placeholder="student@example.com"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Total Invoice Amount (₹)</label>`;

const newFormFields = `placeholder="student@example.com"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Course Type</label>
                    <select 
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 outline-none"
                      value={form.courseType || 'Live'}
                      onChange={(e) => setForm({...form, courseType: e.target.value})}
                    >
                      <option value="Live">Live</option>
                      <option value="Recorded">Recorded</option>
                    </select>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Duration (Months)</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 outline-none"
                      value={form.courseDuration || '1'}
                      onChange={(e) => setForm({...form, courseDuration: e.target.value})}
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Upload Receipt / Document</label>
                  <input 
                    type="file" 
                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    onChange={(e) => setForm({...form, file: e.target.files[0]})}
                  />
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Total Invoice Amount (₹)</label>`;

content = content.replace(oldEmailInputEnd, newFormFields);

// 4. Update Recent Intakes Theme and Process Check
const oldRecentIntakesBlock = `              <div className="overflow-x-auto flex-1 p-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-5">Student / Contact</th>
                      <th className="px-6 py-5">Domain / College</th>
                      <th className="px-6 py-5">Payment Status</th>
                      <th className="px-6 py-5 text-center">Process Check</th>
                      <th className="px-6 py-5 text-right">Date / Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-medium text-slate-700">
                    {submissions.length > 0 ? submissions.map((sub) => (
                      <tr key={sub.id} className={\`transition-all border-b border-slate-50 last:border-0 group \${sub.approvalStatus === 'Defaulted' ? 'bg-red-200 hover:bg-red-300' : sub.approvalStatus === 'Approved' && sub.remainingAmount === 0 ? 'bg-green-200 hover:bg-green-300' : 'hover:bg-blue-50/30'}\`}>
                        <td className="px-6 py-5">
                          <p className="font-black text-sm text-slate-800 mb-1">{sub.studentName}</p>
                          <div className="mb-2">
                            {sub.approvalStatus === 'Defaulted' && (
                              <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider rounded border border-rose-700 block w-max mb-1">Defaulted / Withdrawn</span>
                            )}
                            {sub.approvalStatus === 'Defaulted' && sub.defaultWarning && (
                              <p className="mb-2 text-[10px] text-rose-700 font-bold max-w-xs">{sub.defaultWarning}</p>
                            )}
                            {sub.approvalStatus === 'Approved' && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded border border-emerald-200">Approved</span>
                            )}
                            {sub.approvalStatus === 'Rejected' && (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-wider rounded border border-rose-200">Rejected</span>
                            )}
                            {(!sub.approvalStatus || sub.approvalStatus === 'Pending') && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-wider rounded border border-amber-200">Pending Approval</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{sub.mailId}</span>
                            <span>•</span>
                            <span>{sub.phoneNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-700 mb-0.5">{sub.domain}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">{sub.collegeName}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            {sub.remainingAmount > 0 ? (
                              <>
                                <div className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded">
                                  <span className="text-[10px] font-bold text-slate-500">Total:</span>
                                  <span className="font-black text-slate-800">₹{sub.totalAmount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center bg-emerald-50 px-2 py-1 rounded border border-emerald-100/50">
                                  <span className="text-[10px] font-bold text-emerald-600">Paid:</span>
                                  <span className="font-black text-emerald-700">₹{sub.amountPaid || 0}</span>
                                </div>
                                <div className="flex justify-between items-center bg-rose-50 px-2 py-1 rounded border border-rose-100/50">
                                  <span className="text-[10px] font-bold text-rose-500">Due {sub.remainingAmountDate ? \`(\${new Date(sub.remainingAmountDate).toLocaleDateString()})\` : ''}:</span>
                                  <span className="font-black text-rose-600">₹{sub.remainingAmount}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between items-center bg-emerald-50 px-2 py-2 rounded border border-emerald-200 shadow-sm">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Total Amount Paid:</span>
                                <span className="font-black text-emerald-700">₹{sub.amountPaid || sub.totalAmount}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2 items-center">
                            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner w-max">
                              <button onClick={() => handleUpdateStatus(sub.id, 'callStatus', 'Answered')} className={\`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all \${sub.callStatus === 'Answered' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}\`}>Call Done</button>
                              <button onClick={() => handleUpdateStatus(sub.id, 'callStatus', 'Dropped')} className={\`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all \${sub.callStatus === 'Dropped' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}\`}>No Ans</button>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner w-max">
                              <button onClick={() => handleUpdateStatus(sub.id, 'paymentStatus', 'Paid')} className={\`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all \${sub.paymentStatus === 'Paid' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}\`}>Fee Paid</button>
                              <button onClick={() => handleUpdateStatus(sub.id, 'paymentStatus', 'Dropped')} className={\`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all \${sub.paymentStatus === 'Dropped' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}\`}>Dropped</button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex flex-col items-end gap-3">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                              {format(new Date(sub.date), 'dd MMM yyyy')}
                            </span>
                            <button 
                              onClick={() => handleDeleteSubmission(sub.id)}
                              className="text-rose-500 hover:bg-rose-100 p-1.5 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                              title="Delete Record"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-semibold italic">No recent intakes found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>`;

const newRecentIntakesBlock = `              <div className="flex-1 p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar bg-slate-50/50">
                {submissions.length > 0 ? submissions.map((sub) => (
                  <div key={sub.id} className={\`relative bg-white rounded-2xl p-5 shadow-sm border-2 transition-all hover:shadow-md \${sub.approvalStatus === 'Defaulted' ? 'border-rose-200 bg-rose-50/30' : sub.approvalStatus === 'Approved' && sub.remainingAmount === 0 ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 hover:border-blue-200'}\`}>
                    
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-lg font-black text-slate-800">{sub.studentName}</h4>
                            <p className="text-sm font-semibold text-slate-500">{sub.domain} • {sub.collegeName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {sub.approvalStatus === 'Defaulted' && (
                              <span className="px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-rose-200">Defaulted</span>
                            )}
                            {sub.approvalStatus === 'Approved' && (
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-emerald-200">Approved</span>
                            )}
                            {(!sub.approvalStatus || sub.approvalStatus === 'Pending') && (
                              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-200">Pending</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium mb-4">
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md"><Mail size={12}/> {sub.mailId}</span>
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md"><Phone size={12}/> {sub.phoneNumber}</span>
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md"><Clock size={12}/> {format(new Date(sub.date), 'dd MMM yyyy')}</span>
                          {sub.courseType && <span className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-1 rounded-md font-bold">{sub.courseType} • {sub.courseDuration} Mon</span>}
                          {sub.fileUrl && (
                            <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold hover:bg-blue-100">
                              <LinkIcon size={12}/> View Receipt
                            </a>
                          )}
                        </div>

                        {sub.approvalStatus === 'Defaulted' && sub.defaultWarning && (
                          <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-bold border border-rose-100 mb-4 flex gap-2 items-start">
                            <AlertCircle size={14} className="mt-0.5 shrink-0"/>
                            <p>{sub.defaultWarning}</p>
                          </div>
                        )}
                      </div>

                      <div className="w-full md:w-64 flex flex-col justify-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                          <span className="font-black text-slate-700">₹{sub.totalAmount || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Paid</span>
                          <span className="font-black text-emerald-600">₹{sub.amountPaid || 0}</span>
                        </div>
                        {sub.remainingAmount > 0 && (
                          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Due {sub.remainingAmountDate ? \`(\${new Date(sub.remainingAmountDate).toLocaleDateString()})\` : ''}</span>
                            <span className="font-black text-rose-600">₹{sub.remainingAmount}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {sub.remainingAmount <= 0 ? (
                          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100">
                            <CheckCircle size={16} />
                            <span className="text-xs font-black tracking-wide">100% COMPLETED</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl border border-blue-100">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-xs font-black tracking-wide">REGISTRATION FEE COMPLETED (10%)</span>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => handleDeleteSubmission(sub.id)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-white hover:bg-rose-500 px-3 py-1.5 rounded-lg transition-colors border border-rose-200 hover:border-rose-500"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>

                  </div>
                )) : (
                  <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText size={32} />
                    </div>
                    <h3 className="text-lg font-black text-slate-700 mb-1">No intakes yet</h3>
                    <p className="text-slate-500 font-medium text-sm">Your logged transactions will appear here.</p>
                  </div>
                )}
              </div>`;

content = content.replace(oldRecentIntakesBlock, newRecentIntakesBlock);

// Replace Mail, Phone missing imports if needed
const oldLucideImport = `import { Calendar, Download, Users, Briefcase, FileText, UploadCloud, Link as LinkIcon, CheckCircle, XCircle, Clock, Wallet, AlertCircle, Trash2 } from 'lucide-react';`;
const newLucideImport = `import { Calendar, Download, Users, Briefcase, FileText, UploadCloud, Link as LinkIcon, CheckCircle, XCircle, Clock, Wallet, AlertCircle, Trash2, Mail, Phone } from 'lucide-react';`;

if (content.includes('Trash2')) {
  if (!content.includes('Mail')) {
    content = content.replace(oldLucideImport, newLucideImport);
  }
}

fs.writeFileSync(file, content, 'utf8');
console.log('Finished UI changes');
