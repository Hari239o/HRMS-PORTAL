import re

file_path = 'client/src/app/(protected)/performance/page.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update Completed Clearances block
start_idx = content.find('{/* Completed Clearances Box */}')
end_idx = content.find('          </div>\n        </div>\n      )}', start_idx)

new_completed_block = """{/* Completed Clearances Box */}
          <div className="bg-slate-900 rounded-[32px] shadow-2xl border border-slate-800 p-8 relative overflow-hidden mt-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-2xl text-white flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <Shield size={24} />
                  </div>
                  Completed Clearances
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Fully paid and resolved transactions</p>
              </div>
            </div>
            
            {completedClearances.length === 0 ? (
              <div className="bg-slate-800/40 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-700/50 relative z-10">
                <div className="w-16 h-16 bg-slate-800 text-slate-500 border border-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield size={32} />
                </div>
                <h3 className="text-lg font-black text-white mb-1">No completed clearances yet.</h3>
                <p className="text-slate-400 font-medium text-sm">Clear pending payments to see them here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left border-collapse opacity-90 hover:opacity-100 transition-opacity">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Financials</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {completedClearances.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                            <span className="text-sm font-bold text-slate-400">{format(new Date(sub.date), 'dd MMM yyyy')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center font-black text-xs border border-slate-700 shadow-inner">
                              {sub.employeeName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-black text-slate-300">{sub.employeeName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-black text-slate-300">{sub.studentName}</p>
                          <p className="text-xs font-semibold text-slate-500 mt-1">{sub.domain} • {sub.collegeName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {sub.courseType && <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-black uppercase tracking-wider">{sub.courseType} • {sub.courseDuration} Mon</span>}
                            {sub.fileUrl && <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-[9px] bg-slate-800 text-blue-400 border border-slate-700 px-2 py-0.5 rounded font-black uppercase tracking-wider hover:bg-slate-700 flex items-center gap-1 transition-colors"><LinkIcon size={10}/> Receipt</a>}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-lg w-max border border-emerald-500/20 uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                              Fully Paid: ₹{sub.totalAmount?.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button 
                            onClick={() => handleDeleteSubmission(sub.id, true)}
                            className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 rounded-xl transition-all inline-flex justify-center items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/10 hover:shadow-rose-500/30 hover:-translate-y-0.5"
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
"""

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_completed_block + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Completed Clearances Table")
