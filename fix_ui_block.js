const fs = require('fs');
const file = 'client/src/app/(protected)/performance/page.jsx';
let content = fs.readFileSync(file, 'utf8');

const insertAfterEmail = `
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Course Type</label>
                    <select
                      required
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                      value={form.courseType}
                      onChange={(e) => setForm({...form, courseType: e.target.value})}
                    >
                      <option value="Live">Live</option>
                      <option value="Recorded">Recorded</option>
                    </select>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Duration (Months)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                      value={form.courseDuration}
                      onChange={(e) => setForm({...form, courseDuration: e.target.value})}
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Upload Receipt/File (Optional)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm cursor-pointer"
                    onChange={(e) => setForm({...form, file: e.target.files[0]})}
                  />
                </div>`;

const target1 = `                    placeholder="student@example.com"
                  />
                </div>`;
content = content.replace(target1, target1 + '\n' + insertAfterEmail);

const tableOld = `<div className="overflow-x-auto flex-1 p-2">
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
                            <p className="font-black text-slate-800">Paid: ₹{sub.amountPaid}</p>
                            <p className="font-bold text-slate-400">Total: ₹{sub.totalAmount}</p>
                            {sub.remainingAmount > 0 && (
                              <p className="text-rose-500 font-bold bg-rose-50 px-2 py-1 rounded inline-block">
                                Due: ₹{sub.remainingAmount} <br/><span className="text-[9px]">on {format(new Date(sub.remainingAmountDate), 'dd MMM yyyy')}</span>
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className={\`w-2 h-2 rounded-full \${sub.callDone ? 'bg-emerald-500' : 'bg-slate-300'}\`}></div>
                            <div className={\`w-2 h-2 rounded-full \${sub.noAnswer ? 'bg-amber-500' : 'bg-slate-300'}\`}></div>
                            <div className={\`w-2 h-2 rounded-full \${sub.registrationFeePaid ? 'bg-blue-500' : 'bg-slate-300'}\`}></div>
                            <div className={\`w-2 h-2 rounded-full \${sub.dropped ? 'bg-rose-500' : 'bg-slate-300'}\`}></div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <p className="text-xs font-bold text-slate-500 mb-2">
                            {format(new Date(sub.date || sub.createdAt), 'dd MMM, HH:mm')}
                          </p>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <ClipboardList size={32} className="mb-3 opacity-20" />
                            <p className="text-sm font-bold">NO INTAKES LOGGED YET</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>`;

const tableNew = `<div className="flex-1 p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar bg-slate-50/50">
                {submissions.length > 0 ? submissions.map((sub) => {
                  const percentComplete = sub.remainingAmount === 0 ? 100 : 10;
                  return (
                    <div key={sub.id} className={\`bg-white rounded-2xl p-5 border-2 transition-all shadow-sm hover:shadow-md \${sub.approvalStatus === 'Defaulted' ? 'border-rose-200 bg-rose-50/30' : sub.remainingAmount === 0 ? 'border-emerald-200' : 'border-slate-100 hover:border-blue-200'}\`}>
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                        <div className="flex gap-4 items-start">
                          <div className={\`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-inner \${sub.approvalStatus === 'Defaulted' ? 'bg-rose-500' : sub.remainingAmount === 0 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'}\`}>
                            {sub.studentName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
                              {sub.studentName}
                              {sub.approvalStatus === 'Defaulted' && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-rose-200">Defaulted / Withdrawn</span>
                              )}
                              {sub.remainingAmount === 0 && sub.approvalStatus !== 'Defaulted' && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-emerald-200 flex items-center gap-1"><CheckCircle size={10} /> Fully Paid</span>
                              )}
                              {sub.remainingAmount > 0 && sub.approvalStatus !== 'Defaulted' && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-200 flex items-center gap-1"><Clock size={10} /> Pending</span>
                              )}
                            </h4>
                            <div className="text-xs font-bold text-slate-500 flex flex-wrap gap-2 items-center mt-1">
                              <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-slate-600"><Mail size={12}/> {sub.mailId}</span>
                              <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-slate-600"><Phone size={12}/> {sub.phoneNumber}</span>
                            </div>
                            {sub.approvalStatus === 'Defaulted' && sub.defaultWarning && (
                              <p className="mt-2 text-xs text-rose-700 font-bold bg-rose-100/50 p-2 rounded-lg border border-rose-100 flex items-start gap-1"><AlertTriangle size={14} className="mt-0.5 flex-shrink-0"/> {sub.defaultWarning}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enrollment Date</p>
                          <p className="text-sm font-bold text-slate-700">
                            {format(new Date(sub.date || sub.createdAt), 'dd MMM yyyy, HH:mm')}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100/50">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Domain</p>
                          <p className="text-sm font-bold text-slate-800">{sub.domain}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Course Details</p>
                          <p className="text-sm font-bold text-slate-800">{sub.courseType || 'Live'} • {sub.courseDuration || '1'} Month(s)</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">College</p>
                          <p className="text-sm font-bold text-slate-800 line-clamp-1" title={sub.collegeName}>{sub.collegeName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Receipt</p>
                          {sub.fileUrl ? (
                            <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-200 transition-colors">
                              <LinkIcon size={12} /> View File
                            </a>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">No file</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 w-full">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-black text-slate-600">Payment Progress</span>
                            <span className="text-xs font-black text-blue-600">{percentComplete}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                            <div className={\`h-2.5 rounded-full transition-all duration-1000 \${percentComplete === 100 ? 'bg-emerald-500' : 'bg-blue-500'}\`} style={{ width: \`\${percentComplete}%\` }}></div>
                          </div>
                        </div>
                        <div className="flex gap-4 whitespace-nowrap">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Paid</p>
                            <p className="text-sm font-black text-emerald-600">₹{sub.amountPaid?.toLocaleString()}</p>
                          </div>
                          {sub.remainingAmount > 0 && (
                            <div>
                              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest text-right">Due</p>
                              <p className="text-sm font-black text-rose-600">₹{sub.remainingAmount?.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 h-64">
                    <div className="p-4 bg-slate-100 rounded-full mb-3">
                      <ClipboardList size={32} className="opacity-50" />
                    </div>
                    <p className="text-sm font-black tracking-wide">NO INTAKES LOGGED YET</p>
                  </div>
                )}
              </div>`;

if (!content.includes(target1)) {
    console.error('target1 not found!');
}
if (!content.includes(tableOld)) {
    console.error('tableOld not found!');
}

content = content.replace(tableOld, tableNew);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed UI block');
