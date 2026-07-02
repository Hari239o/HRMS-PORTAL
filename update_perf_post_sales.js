const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/src/app/(protected)/performance/page.jsx');
let content = fs.readFileSync(file, 'utf8');

// Add imports
if (!content.includes('import { format } from')) {
  content = content.replace("import { AreaChart", "import { format } from 'date-fns';\nimport { AreaChart");
}
if (!content.includes('Clock')) {
  content = content.replace("Trash2, Download, Search, X, Target, TrendingUp, Sparkles }", "Trash2, Download, Search, X, Target, TrendingUp, Sparkles, Clock, Wallet }");
}

// Add state and isPostSales
const stateCode = `  const isPostSales = user?.role === 'post_sales' || user?.role === 'post sales';
  const [clearances, setClearances] = useState([]);
  const [selectedClearance, setSelectedClearance] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');`;

content = content.replace("  const [loading, setLoading] = useState(true);", stateCode + "\n  const [loading, setLoading] = useState(true);");

// Add fetchClearances and handleUpdatePayment
const funcCode = `
  const fetchClearances = async () => {
    try {
      const res = await api.get('/api/tasks/submit/clearances');
      setClearances(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!selectedClearance || !paymentAmount) return;
    
    try {
      await api.patch(\`/api/tasks/submit/\${selectedClearance.id}/update-payment\`, {
        additionalPayment: paymentAmount
      });
      toast.success('Payment updated successfully');
      setSelectedClearance(null);
      setPaymentAmount('');
      fetchClearances();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update payment');
    }
  };

`;

content = content.replace("const handleStudentSubmit = async", funcCode + "  const handleStudentSubmit = async");

// Call fetchClearances inside fetchWorkforce or a useEffect?
// Let's just add it to a new useEffect that runs if isPostSales
const useEffectCode = `  useEffect(() => {
    if (isPostSales) {
      fetchClearances();
    }
  }, [isPostSales]);
`;

content = content.replace("useEffect(() => {", useEffectCode + "\n  useEffect(() => {");

// Add the UI at the bottom just before the closing </div>
const uiCode = `
      {isPostSales && (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8 mb-12 relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-2xl text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                  <Wallet size={20} />
                </div>
                Pending Clearances
              </h3>
              <p className="text-sm font-semibold text-slate-400 mt-1">Manage and update payments for approved transactions</p>
            </div>
          </div>
          
          {clearances.length === 0 ? (
            <div className="bg-slate-50/50 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-700 mb-1">No pending clearances!</h3>
              <p className="text-slate-500 font-medium text-sm">All approved transactions have been fully paid.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Employee</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Student Info</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Financials</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clearances.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-slate-400" />
                          <span className="text-sm font-bold text-slate-700">{format(new Date(sub.date), 'dd MMM yyyy')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            {sub.employeeName.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-slate-800">{sub.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-800">{sub.studentName}</p>
                        <p className="text-xs font-semibold text-slate-500">{sub.domain} • {sub.collegeName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded-md w-max">
                            Paid: ₹{sub.amountPaid?.toLocaleString()}
                          </span>
                          <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-md w-max">
                            Total: ₹{sub.totalAmount?.toLocaleString()}
                          </span>
                          <span className="text-xs font-bold bg-red-50 text-red-700 px-2 py-1 rounded-md w-max">
                            Remaining: ₹{sub.remainingAmount?.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => setSelectedClearance(sub)}
                          className="px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl transition-colors inline-flex items-center gap-2 font-bold text-xs"
                        >
                          <Wallet size={16} /> Update Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedClearance && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-800">Update Payment</h3>
                  <button 
                    onClick={() => { setSelectedClearance(null); setPaymentAmount(''); }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={handleUpdatePayment} className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-sm font-bold text-slate-700 mb-1">Student: {selectedClearance.studentName}</p>
                    <p className="text-sm font-bold text-red-600">Remaining Balance: ₹{selectedClearance.remainingAmount?.toLocaleString()}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">New Payment Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedClearance.remainingAmount}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-4 font-medium transition-all"
                      placeholder="Enter amount paid"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-lg shadow-blue-500/30"
                  >
                    Confirm Payment
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
`;

content = content.replace("    </div>\n  );\n}\n", uiCode + "    </div>\n  );\n}\n");

fs.writeFileSync(file, content, 'utf8');
console.log('Performance page updated with post_sales clearances UI.');
