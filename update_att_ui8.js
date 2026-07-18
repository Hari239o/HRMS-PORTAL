const fs = require('fs');

async function main() {
  const pagePath = 'client/src/app/(protected)/attendance/page.jsx';
  let content = fs.readFileSync(pagePath, 'utf8');

  const startMarker = '<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">';
  const endMarker = '{/* Calendar View */}';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.error('Markers not found!');
    return;
  }

  const newBlock = `<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pendingIssues.map(issue => (
              <div key={issue.id} className="bg-white rounded-[2rem] border border-rose-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative flex flex-col p-6 hover:shadow-[0_8px_30px_rgb(225,29,72,0.1)] transition-all duration-500">
                
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center font-black text-2xl overflow-hidden shadow-sm shrink-0 ring-4 ring-rose-50/50">
                    {issue.requestedByAvatar ? (
                      <img src={issue.requestedByAvatar} alt={issue.requestedByName} className="w-full h-full object-cover" />
                    ) : (
                      (issue.requestedByName || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-slate-800 text-lg truncate pr-2 tracking-tight">{issue.requestedByName}</h4>
                      <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-rose-100 shrink-0 shadow-sm animate-pulse">Missed Checkout</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200 inline-block mt-1.5 shadow-sm">ID: {issue.requestedByEmpId || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-5">
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">{issue.description || 'No reason provided'}</p>
                  </div>

                  {/* Professional Requested Time Block */}
                  <div className="relative group overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-emerald-50 rounded-2xl border border-indigo-100 p-4 mb-6 shadow-inner">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-400/20 blur-2xl rounded-full group-hover:bg-blue-400/40 transition-colors duration-700"></div>
                    <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-emerald-400/20 blur-2xl rounded-full group-hover:bg-emerald-400/40 transition-colors duration-700"></div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-indigo-100 text-indigo-500 relative">
                          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                          <Clock size={16} className="animate-[spin_10s_linear_infinite]" />
                        </div>
                        <span className="text-[10px] font-black text-indigo-900/60 uppercase tracking-widest">Requested Time</span>
                      </div>
                      <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white shadow-sm">
                        <span className="text-sm font-black bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                          {issue.details?.checkoutTime || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full mt-auto">
                  <button onClick={() => resolveIssue(issue.id, 'approve')} className="flex-1 py-3.5 bg-emerald-500 text-white hover:bg-emerald-600 font-black rounded-xl transition-all duration-300 text-[11px] uppercase tracking-wider shadow-md shadow-emerald-500/20 transform hover:-translate-y-1 text-center flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button onClick={() => resolveIssue(issue.id, 'reject')} className="flex-1 py-3.5 bg-white text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-200 hover:border-rose-500 font-black rounded-xl transition-all duration-300 text-[11px] uppercase tracking-wider shadow-sm transform hover:-translate-y-1 text-center flex items-center justify-center gap-2 group/reject">
                    <X size={16} className="group-hover/reject:scale-125 transition-transform" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      `;

  const newContent = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
  fs.writeFileSync(pagePath, newContent);
  console.log('Successfully updated pending issues block with professional requested time');
}

main();
