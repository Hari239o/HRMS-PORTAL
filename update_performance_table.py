import re

file_path = 'client/src/app/(protected)/performance/page.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update Pending Clearances empty state and table
start_idx = content.find('{pendingClearances.length === 0 ? (')
end_idx = content.find('          {/* Completed Clearances Box */}')

new_pending_block = """{pendingClearances.length === 0 ? (
              <div className="bg-slate-800/40 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-700/50 relative z-10">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-black text-white mb-1">No pending clearances!</h3>
                <p className="text-slate-400 font-medium text-sm">All approved transactions have been fully paid.</p>
              </div>
            ) : (
              <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Financials</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {pendingClearances.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                            <span className="text-sm font-bold text-slate-300">{format(new Date(sub.date), 'dd MMM yyyy')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs border border-blue-500/30 shadow-inner">
                              {sub.employeeName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-black text-white">{sub.employeeName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-black text-white">{sub.studentName}</p>
                          <p className="text-xs font-semibold text-slate-400 mt-1">{sub.domain} • {sub.collegeName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {sub.courseType && <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">{sub.courseType} • {sub.courseDuration} Mon</span>}
                            {sub.fileUrl && <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider hover:bg-blue-500/30 flex items-center gap-1 transition-colors"><LinkIcon size={10}/> Receipt</a>}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md w-max uppercase tracking-wider flex items-center justify-between min-w-[120px]">
                              <span className="opacity-70">Paid:</span> <span className="text-xs">₹{sub.amountPaid?.toLocaleString()}</span>
                            </span>
                            <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md w-max uppercase tracking-wider flex items-center justify-between min-w-[120px]">
                              <span className="opacity-70">Total:</span> <span className="text-xs">₹{sub.totalAmount?.toLocaleString()}</span>
                            </span>
                            <span className="text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-md w-max uppercase tracking-wider flex items-center justify-between min-w-[120px]">
                              <span className="opacity-70">Deficit:</span> <span className="text-xs">₹{sub.remainingAmount?.toLocaleString()}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right space-y-2">
                          <button 
                            onClick={() => setSelectedClearance(sub)}
                            className="w-full px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/30 rounded-xl transition-all inline-flex justify-center items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:shadow-blue-500/30 hover:-translate-y-0.5"
                          >
                            <Wallet size={14} /> Update
                          </button>
                          <button 
                            onClick={() => handleDeleteSubmission(sub.id, true)}
                            className="w-full px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 rounded-xl transition-all inline-flex justify-center items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/10 hover:shadow-rose-500/30 hover:-translate-y-0.5"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

"""

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_pending_block + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Pending Clearances Table")
