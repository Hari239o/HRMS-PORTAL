const fs = require('fs');
const file = 'client/src/app/(protected)/performance/page.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace the "Pending by Employee" block with "Employee Wise Revenue"
const oldEmployeeBlock = `<div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden mb-8 border border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Users size={80} />
        </div>
        <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
          Pending by Employee
        </h3>
        <div className="space-y-3 relative z-10 max-h-[150px] overflow-y-auto">
          {Object.entries(
            pendingClearances.reduce((acc, sub) => {
              const name = sub.employeeName || 'Unknown';
              acc[name] = (acc[name] || 0) + (sub.remainingAmount || 0);
              return acc;
            }, {})
          ).map(([empName, amount]) => (
            <div key={empName} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <span className="text-sm font-medium">{empName}</span>
              <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded text-sm">
                ₹{amount.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>`;

const newEmployeeBlock = `<div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden mb-8 border border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Users size={80} />
        </div>
        <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
          Employee Wise Revenue (Post Sales Member Section)
        </h3>
        <div className="space-y-3 relative z-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.entries(
            clearances.reduce((acc, sub) => {
              const name = sub.employeeName || 'Unknown';
              if (!acc[name]) acc[name] = { total: 0, received: 0, pending: 0 };
              acc[name].total += (sub.totalAmount || 0);
              acc[name].received += (sub.amountPaid || 0);
              acc[name].pending += (sub.remainingAmount || 0);
              return acc;
            }, {})
          ).map(([empName, stats]) => (
            <div key={empName} className="flex flex-col bg-slate-800/80 p-4 rounded-xl border border-slate-700/50 transition-all hover:bg-slate-800">
              <span className="text-sm font-bold mb-3 border-b border-slate-700 pb-2">{empName}</span>
              <div className="flex justify-between items-center text-xs">
                <div className="flex flex-col">
                  <span className="text-slate-400 mb-1 uppercase tracking-wider text-[9px]">Total Revenue</span>
                  <span className="font-medium text-slate-200">₹{stats.total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 mb-1 uppercase tracking-wider text-[9px]">Received</span>
                  <span className="font-medium text-emerald-400">₹{stats.received.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 mb-1 uppercase tracking-wider text-[9px]">Pending</span>
                  <span className="font-medium text-amber-400">₹{stats.pending.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>`;

if (content.includes('Pending by Employee')) {
  content = content.replace(oldEmployeeBlock, newEmployeeBlock);
}


// 2. Add handleDelete function
const handleUpdatePaymentLoc = `const handleUpdatePayment = async (e) => {`;
const handleDeleteFunction = `const handleDeleteSubmission = async (id) => {
    if (!window.confirm('Are you sure you want to completely delete this record? This action cannot be undone.')) return;
    try {
      await api.delete(\`/api/tasks/submit/\${id}\`);
      toast.success('Record deleted successfully');
      fetchClearances();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete record');
    }
  };

  const handleUpdatePayment = async (e) => {`;
if (!content.includes('handleDeleteSubmission')) {
  content = content.replace(handleUpdatePaymentLoc, handleDeleteFunction);
}

// 3. Add Delete Button in Pending Clearances
const pendingUpdateBtn = `<button 
                            onClick={() => setSelectedClearance(sub)}
                            className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            <Wallet size={14} /> Update
                            <br/>Payment
                          </button>`;
const pendingUpdateBtnWithDelete = `<div className="flex flex-col gap-2">
                          <button 
                            onClick={() => setSelectedClearance(sub)}
                            className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            <Wallet size={14} /> Update Payment
                          </button>
                          <button 
                            onClick={() => handleDeleteSubmission(sub.id)}
                            className="flex justify-center items-center gap-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                          </div>`;
content = content.replace(pendingUpdateBtn, pendingUpdateBtnWithDelete);

// 4. Add Delete Button in Completed Clearances
const completedBtn = `<button 
                            onClick={() => {}}
                            className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm opacity-70 cursor-not-allowed"
                          >
                            <CheckCircle size={14} /> Fully Paid
                          </button>`;
const completedBtnWithDelete = `<div className="flex flex-col gap-2">
                          <button 
                            className="flex justify-center items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm opacity-80 cursor-default"
                          >
                            <CheckCircle size={14} /> Fully Paid
                          </button>
                          <button 
                            onClick={() => handleDeleteSubmission(sub.id)}
                            className="flex justify-center items-center gap-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                          </div>`;
content = content.replace(completedBtn, completedBtnWithDelete);

// Add Trash2 icon to lucide-react import
const lucideImport = `import { Calendar, Download, Users, Briefcase, FileText, UploadCloud, Link as LinkIcon, CheckCircle, XCircle, Clock, Wallet, AlertCircle } from 'lucide-react';`;
const newLucideImport = `import { Calendar, Download, Users, Briefcase, FileText, UploadCloud, Link as LinkIcon, CheckCircle, XCircle, Clock, Wallet, AlertCircle, Trash2 } from 'lucide-react';`;
if (!content.includes('Trash2')) {
  content = content.replace(lucideImport, newLucideImport);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated Post Sales view!');
