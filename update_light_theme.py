import re

file_path = 'client/src/app/(protected)/performance/page.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "{isPostSales && (() => {\n        const [filterYear, filterMonth] = postSalesMonthFilter"
end_marker = "        );\n      })()}"

new_block = """{isPostSales && (() => {
        const [filterYear, filterMonth] = postSalesMonthFilter ? postSalesMonthFilter.split('-') : [null, null];
        const filteredClearances = postSalesMonthFilter
          ? clearances.filter(c => {
              const cDate = new Date(c.date || c.createdAt);
              return cDate.getFullYear() === parseInt(filterYear) && (cDate.getMonth() + 1) === parseInt(filterMonth);
            })
          : clearances;

        const pendingClearances = filteredClearances.filter(c => c.remainingAmount > 0);
        const completedClearances = filteredClearances.filter(c => c.remainingAmount === 0);
        
        const totalRevenueCollected = filteredClearances.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
        const totalRevenuePending = pendingClearances.reduce((sum, c) => sum + (c.remainingAmount || 0), 0);
        
        return (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 mb-12">
          
          {/* Revenue Analytics Header & Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-[80px] -z-10 -mr-20 -mt-20 pointer-events-none"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Target size={28} />
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                  Revenue Matrix
                </h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Financial Overview</p>
              </div>
            </div>
            
            <div className="relative z-10 bg-slate-50 border border-slate-200 p-2 rounded-2xl flex items-center shadow-inner">
              <input 
                type="month" 
                className="bg-transparent border-none text-slate-700 text-sm font-bold focus:ring-0 outline-none w-full pl-4"
                value={postSalesMonthFilter}
                onChange={(e) => setPostSalesMonthFilter(e.target.value)}
              />
              <button 
                onClick={() => setPostSalesMonthFilter('')}
                className="text-slate-500 hover:text-slate-800 px-4 py-2 text-[10px] font-black uppercase tracking-widest border-l border-slate-200 transition-colors ml-2"
              >
                All Time
              </button>
            </div>
          </div>

          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex items-center gap-6 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100 transition-all duration-500"></div>
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-2xl flex items-center justify-center relative z-10">
                <Shield size={32} />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Cleared Revenue</p>
                <h3 className="text-3xl font-black text-slate-800">₹{totalRevenueCollected.toLocaleString()}</h3>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex items-center gap-6 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-50 rounded-full blur-3xl group-hover:bg-amber-100 transition-all duration-500"></div>
              <div className="w-16 h-16 bg-amber-50 text-amber-500 border border-amber-100 rounded-2xl flex items-center justify-center relative z-10">
                <Wallet size={32} />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Total Pending Revenue</p>
                <h3 className="text-3xl font-black text-slate-800">₹{totalRevenuePending.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          {/* Pending Clearances Box */}
          <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-2xl text-slate-800 flex items-center gap-3">
                  <div className="p-3 bg-amber-50 rounded-2xl text-amber-500 border border-amber-100 shadow-sm">
                    <Wallet size={24} />
                  </div>
                  Pending Clearances
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Manage incomplete transactions</p>
              </div>
            </div>
            
            {pendingClearances.length === 0 ? (
              <div className="bg-slate-50/50 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200 relative z-10">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-700 mb-1">No pending clearances!</h3>
                <p className="text-slate-500 font-medium text-sm">All approved transactions have been fully paid.</p>
              </div>
            ) : (
              <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Financials</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pendingClearances.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                            <span className="text-sm font-bold text-slate-700">{format(new Date(sub.date), 'dd MMM yyyy')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs border border-blue-100 shadow-inner">
                              {sub.employeeName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-black text-slate-800">{sub.employeeName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-black text-slate-800">{sub.studentName}</p>
                          <p className="text-xs font-semibold text-slate-500 mt-1">{sub.domain} • {sub.collegeName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {sub.courseType && <span className="text-[9px] bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded font-black uppercase tracking-wider">{sub.courseType} • {sub.courseDuration} Mon</span>}
                            {sub.fileUrl && <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded font-black uppercase tracking-wider hover:bg-blue-100 flex items-center gap-1 transition-colors"><LinkIcon size={10}/> Receipt</a>}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-md w-max uppercase tracking-wider flex items-center justify-between min-w-[120px]">
                              <span className="opacity-70">Paid:</span> <span className="text-xs">₹{sub.amountPaid?.toLocaleString()}</span>
                            </span>
                            <span className="text-[10px] font-black bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md w-max uppercase tracking-wider flex items-center justify-between min-w-[120px]">
                              <span className="opacity-70">Total:</span> <span className="text-xs">₹{sub.totalAmount?.toLocaleString()}</span>
                            </span>
                            <span className="text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-md w-max uppercase tracking-wider flex items-center justify-between min-w-[120px]">
                              <span className="opacity-70">Deficit:</span> <span className="text-xs">₹{sub.remainingAmount?.toLocaleString()}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right space-y-2">
                          <button 
                            onClick={() => setSelectedClearance(sub)}
                            className="w-full px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white border border-blue-100 rounded-xl transition-all inline-flex justify-center items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-blue-500/30 hover:-translate-y-0.5"
                          >
                            <Wallet size={14} /> Update
                          </button>
                          <button 
                            onClick={() => handleDeleteSubmission(sub.id, true)}
                            className="w-full px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-100 rounded-xl transition-all inline-flex justify-center items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-rose-500/30 hover:-translate-y-0.5"
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

          {/* Completed Clearances Box */}
          <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 p-8 relative overflow-hidden mt-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-2xl text-slate-800 flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-500 border border-emerald-100 shadow-sm">
                    <Shield size={24} />
                  </div>
                  Completed Clearances
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Fully paid and resolved transactions</p>
              </div>
            </div>
            
            {completedClearances.length === 0 ? (
              <div className="bg-slate-50/50 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200 relative z-10">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-700 mb-1">No completed clearances yet.</h3>
                <p className="text-slate-500 font-medium text-sm">Clear pending payments to see them here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left border-collapse opacity-90 hover:opacity-100 transition-opacity">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Financials</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {completedClearances.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                            <span className="text-sm font-bold text-slate-600">{format(new Date(sub.date), 'dd MMM yyyy')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xs border border-slate-200 shadow-inner">
                              {sub.employeeName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-black text-slate-700">{sub.employeeName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-black text-slate-700">{sub.studentName}</p>
                          <p className="text-xs font-semibold text-slate-500 mt-1">{sub.domain} • {sub.collegeName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {sub.courseType && <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded font-black uppercase tracking-wider">{sub.courseType} • {sub.courseDuration} Mon</span>}
                            {sub.fileUrl && <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded font-black uppercase tracking-wider hover:bg-blue-100 flex items-center gap-1 transition-colors"><LinkIcon size={10}/> Receipt</a>}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg w-max border border-emerald-100 uppercase tracking-wider shadow-sm">
                              Fully Paid: ₹{sub.totalAmount?.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button 
                            onClick={() => handleDeleteSubmission(sub.id, true)}
                            className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-100 rounded-xl transition-all inline-flex justify-center items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-rose-500/30 hover:-translate-y-0.5"
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

          {/* Update Payment Modal */}
          {selectedClearance && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-2xl text-slate-800">Payment Update</h3>
                  <button 
                    onClick={() => { setSelectedClearance(null); setPaymentAmount(''); setPaymentDate(''); setIsDefaulting(false); setWarningText(''); }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={isDefaulting ? handleDefaultPayment : handleUpdatePayment} className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm font-bold text-slate-700 mb-2">Student: {selectedClearance.studentName}</p>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-600">Total Paid: ₹{selectedClearance.amountPaid?.toLocaleString()}</span>
                      <span className="text-slate-400">Date: {format(new Date(selectedClearance.lastPaymentDate || selectedClearance.updatedAt || selectedClearance.date), 'dd MMM')}</span>
                    </div>
                    <p className="text-sm font-black text-rose-600 mt-2">Remaining Balance: ₹{selectedClearance.remainingAmount?.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <input 
                      type="checkbox" 
                      id="defaultToggle" 
                      checked={isDefaulting}
                      onChange={(e) => setIsDefaulting(e.target.checked)}
                      className="w-4 h-4 text-rose-600 bg-slate-100 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                    />
                    <label htmlFor="defaultToggle" className="text-sm font-bold text-slate-700 cursor-pointer">
                      Application Withdrawn / Default Payment
                    </label>
                  </div>

                  {!isDefaulting ? (
                    <div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Payment Amount (₹)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            max={selectedClearance.remainingAmount}
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-4 font-medium transition-all"
                            placeholder="Enter amount"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Date Received</label>
                          <input
                            type="date"
                            required
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-4 font-medium transition-all"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-lg shadow-blue-500/30"
                      >
                        Confirm Payment
                      </button>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-rose-600">Description / Warning Message</label>
                      <textarea
                        required
                        rows="3"
                        value={warningText}
                        onChange={(e) => setWarningText(e.target.value)}
                        className="w-full bg-rose-50 border border-rose-200 text-rose-900 placeholder-rose-400 text-sm rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent block p-4 font-medium transition-all"
                        placeholder="State the reason for default or withdrawal..."
                      />
                      <button
                        type="submit"
                        className="w-full mt-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2"
                      >
                        <AlertTriangle size={18} /> Submit Default Notice
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>"""

try:
    idx_start = content.find(start_marker)
    idx_end = content.find(end_marker)
    
    if idx_start != -1 and idx_end != -1:
        content = content[:idx_start] + new_block + content[idx_end:]
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Successfully updated the page to a professional light theme.")
    else:
        print("Could not find the markers.")
except Exception as e:
    import traceback
    traceback.print_exc()
