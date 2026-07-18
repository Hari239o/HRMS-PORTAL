const fs = require('fs');

async function main() {
  const pagePath = 'client/src/app/(protected)/attendance/page.jsx';
  let content = fs.readFileSync(pagePath, 'utf8');

  const startMarker = '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
  const endMarker = '{/* Calendar View */}';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.error('Markers not found!');
    return;
  }

  const newBlock = `<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {pendingIssues.map(issue => (
              <div key={issue.id} className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden relative group cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-rose-300 h-72 flex flex-col items-center justify-center p-6">
                
                {/* Normal State: Avatar, Name, ID */}
                <div className="flex flex-col items-center justify-center transition-all duration-300 group-hover:opacity-0 group-hover:scale-95 group-hover:pointer-events-none absolute inset-0 z-10 w-full h-full bg-white">
                  <div className="w-24 h-24 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center font-black text-4xl mb-4 overflow-hidden shadow-sm shrink-0">
                    {issue.requestedByAvatar ? (
                      <img src={issue.requestedByAvatar} alt={issue.requestedByName} className="w-full h-full object-cover" />
                    ) : (
                      (issue.requestedByName || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <h4 className="font-black text-slate-800 text-lg text-center leading-tight mb-2 px-4 line-clamp-1">{issue.requestedByName}</h4>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">ID: {issue.requestedByEmpId || 'UNKN'}</span>
                </div>

                {/* Hover State: Details and Actions */}
                <div className="flex flex-col items-center justify-center opacity-0 scale-105 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto absolute inset-0 z-20 bg-white/95 backdrop-blur-md p-5 w-full h-full border border-rose-200">
                  <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full mb-3 shadow-sm uppercase tracking-widest border border-rose-100">Missed Checkout</span>
                  <p className="text-xs font-bold text-slate-700 text-center mb-4 line-clamp-2">{issue.description || 'No reason provided'}</p>
                  
                  <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 mb-4 w-full text-center shadow-sm flex flex-col items-center justify-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Requested Time</p>
                    <p className="text-base font-black text-slate-800">{issue.details?.checkoutTime || 'N/A'}</p>
                  </div>

                  <div className="flex gap-2 w-full mt-auto">
                    <button onClick={() => resolveIssue(issue.id, 'approve')} className="flex-1 py-3 bg-emerald-500 text-white hover:bg-emerald-600 font-black rounded-xl transition-all duration-300 text-[10px] uppercase tracking-wider shadow-sm transform hover:-translate-y-0.5 text-center">Approve</button>
                    <button onClick={() => resolveIssue(issue.id, 'reject')} className="flex-1 py-3 bg-white text-slate-700 hover:text-white hover:bg-slate-800 border border-slate-200 font-black rounded-xl transition-all duration-300 text-[10px] uppercase tracking-wider shadow-sm transform hover:-translate-y-0.5 text-center">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      `;

  const newContent = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
  fs.writeFileSync(pagePath, newContent);
  console.log('Successfully updated pending issues block');
}

main();
