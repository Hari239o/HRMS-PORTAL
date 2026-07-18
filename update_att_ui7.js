const fs = require('fs');

async function main() {
  const pagePath = 'client/src/app/(protected)/attendance/page.jsx';
  let content = fs.readFileSync(pagePath, 'utf8');

  const startMarker = '<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">';
  const endMarker = '{/* Calendar View */}';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.error('Markers not found!');
    return;
  }

  const newBlock = `<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {pendingIssues.map(issue => (
              <div key={issue.id} className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden relative flex flex-col p-6">
                
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center font-black text-2xl overflow-hidden shadow-sm shrink-0">
                    {issue.requestedByAvatar ? (
                      <img src={issue.requestedByAvatar} alt={issue.requestedByName} className="w-full h-full object-cover" />
                    ) : (
                      (issue.requestedByName || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-slate-800 text-lg truncate pr-2">{issue.requestedByName}</h4>
                      <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-full uppercase tracking-widest border border-rose-100 shrink-0">Missed Checkout</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 inline-block mt-1">ID: {issue.requestedByEmpId || 'UNKN'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-5 flex-1">
                  <p className="text-xs font-bold text-slate-600 mb-3">{issue.description || 'No reason provided'}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested Time:</span>
                    <span className="text-sm font-black text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">{issue.details?.checkoutTime || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex gap-3 w-full mt-auto">
                  <button onClick={() => resolveIssue(issue.id, 'approve')} className="flex-1 py-3.5 bg-emerald-500 text-white hover:bg-emerald-600 font-black rounded-xl transition-all duration-300 text-[11px] uppercase tracking-wider shadow-sm transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2">
                    Approve
                  </button>
                  <button onClick={() => resolveIssue(issue.id, 'reject')} className="flex-1 py-3.5 bg-white text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-200 hover:border-rose-500 font-black rounded-xl transition-all duration-300 text-[11px] uppercase tracking-wider shadow-sm transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2">
                    Reject
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
  console.log('Successfully updated pending issues block to static visible design');
}

main();
