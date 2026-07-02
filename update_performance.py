import sys
import re

file_path = 'client/src/app/(protected)/performance/page.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add postSalesMonthFilter state
if 'const [postSalesMonthFilter, setPostSalesMonthFilter]' not in content:
    content = content.replace(
        "const [employeeSearch, setEmployeeSearch] = useState('');",
        "const [employeeSearch, setEmployeeSearch] = useState('');\n  const [postSalesMonthFilter, setPostSalesMonthFilter] = useState('');"
    )

# 2. Update logic and UI
# We need to replace the isPostSales block.

start_marker = "{isPostSales && (() => {\n        const pendingClearances = clearances.filter"
end_marker = "            {pendingClearances.length === 0 ? ("

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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-slate-900 via-[#0f172a] to-slate-900 rounded-[32px] p-6 md:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] -z-10 -mr-20 -mt-20 pointer-events-none"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Target size={28} />
              </div>
              <div>
                <h4 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                  Revenue Matrix
                </h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Financial Overview</p>
              </div>
            </div>
            
            <div className="relative z-10 bg-slate-800/50 backdrop-blur-md p-2 rounded-2xl flex items-center border border-slate-700/50 shadow-inner">
              <input 
                type="month" 
                className="bg-transparent border-none text-white text-sm font-bold focus:ring-0 outline-none w-full [color-scheme:dark] pl-4"
                value={postSalesMonthFilter}
                onChange={(e) => setPostSalesMonthFilter(e.target.value)}
              />
              <button 
                onClick={() => setPostSalesMonthFilter('')}
                className="text-slate-400 hover:text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest border-l border-slate-700 transition-colors ml-2"
              >
                All Time
              </button>
            </div>
          </div>

          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-3xl p-6 shadow-xl border border-emerald-500/20 flex items-center gap-6 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all duration-500"></div>
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center relative z-10 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Shield size={32} />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-bold text-emerald-400/80 uppercase tracking-widest mb-1">Total Cleared Revenue</p>
                <h3 className="text-3xl font-black text-white">₹{totalRevenueCollected.toLocaleString()}</h3>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl p-6 shadow-xl border border-amber-500/20 flex items-center gap-6 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/30 transition-all duration-500"></div>
              <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center relative z-10 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Wallet size={32} />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-bold text-amber-400/80 uppercase tracking-widest mb-1">Total Pending Revenue</p>
                <h3 className="text-3xl font-black text-white">₹{totalRevenuePending.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          {/* Pending Clearances Box */}
          <div className="bg-slate-900 rounded-[32px] shadow-2xl border border-slate-800 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-2xl text-white flex items-center gap-3">
                  <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Wallet size={24} />
                  </div>
                  Pending Clearances
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Manage incomplete transactions</p>
              </div>
            </div>
            
            {pendingClearances.length === 0 ? ("""

# Replace from start to end
import traceback
try:
    idx_start = content.find("{isPostSales && (() => {\n        const pendingClearances = clearances.filter")
    idx_end = content.find("{pendingClearances.length === 0 ? (", idx_start)
    
    if idx_start != -1 and idx_end != -1:
        content = content[:idx_start] + new_block + content[idx_end + len("{pendingClearances.length === 0 ? ("):]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Updated isPostSales block successfully")
    else:
        print("Could not find blocks")
        print(idx_start, idx_end)
except Exception as e:
    traceback.print_exc()
