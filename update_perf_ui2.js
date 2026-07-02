const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/src/app/(protected)/performance/page.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add missing imports
if (!content.includes('AlertTriangle')) {
  content = content.replace('Trophy,', 'AlertTriangle, Trophy,');
}

// 2. Add state variables
const stateTarget = `const [paymentAmount, setPaymentAmount] = useState('');`;
const newStates = `const [paymentAmount, setPaymentAmount] = useState('');
  const [isDefaulting, setIsDefaulting] = useState(false);
  const [warningText, setWarningText] = useState('');`;
content = content.replace(stateTarget, newStates);

// 3. Add handleDefaultPayment function
const handleStudentSubmitTarget = `const handleStudentSubmit = async (e) => {`;
const handleDefaultPaymentStr = `
  const handleDefaultPayment = async (e) => {
    e.preventDefault();
    if (!selectedClearance || !warningText) return;
    try {
      await api.patch(\`/api/tasks/submit/\${selectedClearance.id}/default\`, { warning: warningText });
      toast.success('Submission defaulted successfully');
      setSelectedClearance(null);
      setWarningText('');
      setIsDefaulting(false);
      fetchClearances();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to default submission');
    }
  };

  `;
content = content.replace(handleStudentSubmitTarget, handleDefaultPaymentStr + handleStudentSubmitTarget);

// 4. Update Modal in isPostSales
const oldModalStart = `{selectedClearance && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">`;
const oldModalEnd = `</form>
              </div>
            </div>
          )}`;
const startIdx = content.indexOf(oldModalStart);
const endIdx = content.indexOf(oldModalEnd) + oldModalEnd.length;

if (startIdx !== -1 && endIdx !== -1) {
  const newModal = `{selectedClearance && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                <div className={\`absolute top-0 left-0 w-full h-1 \${isDefaulting ? 'bg-rose-500' : 'bg-blue-500'}\`}></div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-800">
                    {isDefaulting ? 'Mark as Defaulted' : 'Update Payment'}
                  </h3>
                  <button 
                    onClick={() => { setSelectedClearance(null); setPaymentAmount(''); setIsDefaulting(false); setWarningText(''); }}
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
                      <span className="text-slate-400">Date: {format(new Date(selectedClearance.updatedAt || selectedClearance.date), 'dd MMM')}</span>
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
          )}`;
  
  content = content.substring(0, startIdx) + newModal + content.substring(endIdx);
}

// 5. Add Defaulted Applications view for isStandardEmployee
const employeeTarget = `{/* DATA ENTRY FORM */}`;
const employeeDefaultedSection = `
          {/* Defaulted / Withdrawn Notifications */}
          {submissions.filter(s => s.approvalStatus === 'Defaulted').length > 0 && (
            <div className="lg:col-span-3 mb-4">
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                    <AlertTriangle size={20} />
                  </div>
                  <h3 className="font-black text-rose-800 text-lg">Defaulted Applications & Warnings</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {submissions.filter(s => s.approvalStatus === 'Defaulted').map(sub => (
                    <div key={sub.id} className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800">{sub.studentName}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{format(new Date(sub.updatedAt), 'dd MMM yyyy')}</span>
                      </div>
                      <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-sm font-semibold text-rose-700">
                        {sub.defaultWarning || "Application defaulted or withdrawn."}
                      </div>
                      <div className="flex justify-between text-xs font-bold mt-1">
                        <span className="text-slate-500">Revenue Deducted: ₹{sub.amountPaid?.toLocaleString()}</span>
                        <span className="text-slate-500">Target Count Deducted: 1</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          `;
content = content.replace(employeeTarget, employeeDefaultedSection + employeeTarget);

// 6. Add Defaulted Applications view for hasAdminAccess
// Find where the Admin Intakes table is rendered.
const adminTarget = `{/* Admin / HR Submissions Log */}`;
const adminDefaultedSection = `
          {/* Defaulted Alerts for Admin */}
          {selectedEmpForIntakes && adminIntakes.filter(s => s.approvalStatus === 'Defaulted').length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 shadow-sm relative overflow-hidden mb-8">
              <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="font-black text-rose-800 text-lg">Employee Default Alerts</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminIntakes.filter(s => s.approvalStatus === 'Defaulted').map(sub => (
                  <div key={sub.id} className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800">{sub.studentName}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{format(new Date(sub.updatedAt), 'dd MMM yyyy')}</span>
                    </div>
                    <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-sm font-semibold text-rose-700">
                      {sub.defaultWarning || "Application defaulted or withdrawn."}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          `;
          
// The admin section doesn't have an exact {/* Admin / HR Submissions Log */} comment in my previous code, let me check the string to replace.
const adminSearch = `<div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mt-8">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">`;
content = content.replace(adminSearch, adminDefaultedSection + adminSearch);


fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated performance UI!');
