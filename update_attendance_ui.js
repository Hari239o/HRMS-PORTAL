const fs = require('fs');

async function main() {
  try {
    const pagePath = 'client/src/app/(protected)/attendance/page.jsx';
    let content = fs.readFileSync(pagePath, 'utf8');

    const originalBlock = `{pendingIssues.map(issue => (
              <div key={issue.id} className="bg-white rounded-2xl p-5 border border-rose-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-400"></div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800">{issue.requestedByName}</h4>
                  <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md">Missed Checkout</span>
                </div>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{issue.description || 'No reason provided'}</p>
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Requested Time</p>
                    <p className="text-sm font-bold text-slate-700">{issue.details?.checkoutTime || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => resolveIssue(issue.id, 'approve')} className="flex-1 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold rounded-xl transition-colors text-sm">Approve</button>
                  <button onClick={() => resolveIssue(issue.id, 'reject')} className="flex-1 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-colors text-sm">Reject</button>
                </div>
              </div>
            ))}`;

    const newBlock = `{pendingIssues.map(issue => (
              <div key={issue.id} className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden relative group cursor-pointer transition-all duration-300 hover:shadow-md h-56 flex flex-col items-center justify-center p-6">
                
                {/* Normal State: Avatar, Name, ID */}
                <div className="flex flex-col items-center justify-center transition-opacity duration-300 group-hover:opacity-0 group-hover:pointer-events-none absolute inset-0 z-10 w-full h-full bg-white">
                  <div className="w-20 h-20 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center font-black text-2xl mb-4 overflow-hidden shadow-sm shrink-0">
                    {issue.requestedByAvatar ? (
                      <img src={issue.requestedByAvatar} alt={issue.requestedByName} className="w-full h-full object-cover" />
                    ) : (
                      (issue.requestedByName || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <h4 className="font-black text-slate-800 text-lg">{issue.requestedByName}</h4>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {issue.requestedByEmpId || 'UNKN'}</span>
                </div>

                {/* Hover State: Details and Actions */}
                <div className="flex flex-col items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:pointer-events-auto absolute inset-0 z-20 bg-rose-50/95 backdrop-blur-sm p-5 w-full h-full">
                  <span className="text-[10px] font-black text-rose-500 bg-white px-3 py-1.5 rounded-lg mb-3 shadow-sm border border-rose-100 uppercase tracking-wider">Missed Checkout</span>
                  <p className="text-sm font-bold text-slate-700 text-center mb-4 line-clamp-2">{issue.description || 'No reason provided'}</p>
                  <div className="bg-white/80 px-4 py-2 rounded-xl border border-rose-100 mb-4 w-full text-center shadow-sm">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Requested Time</p>
                    <p className="text-base font-black text-slate-800">{issue.details?.checkoutTime || 'N/A'}</p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <button onClick={() => resolveIssue(issue.id, 'approve')} className="flex-1 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 font-black rounded-xl transition-all duration-300 text-xs uppercase tracking-wider shadow-sm transform hover:-translate-y-0.5">Approve</button>
                    <button onClick={() => resolveIssue(issue.id, 'reject')} className="flex-1 py-2.5 bg-white text-slate-700 hover:text-white hover:bg-slate-800 border border-slate-200 font-black rounded-xl transition-all duration-300 text-xs uppercase tracking-wider shadow-sm transform hover:-translate-y-0.5">Reject</button>
                  </div>
                </div>
              </div>
            ))}`;

    if (content.includes(originalBlock)) {
      content = content.replace(originalBlock, newBlock);
      fs.writeFileSync(pagePath, content);
      console.log('Successfully updated attendance/page.jsx UI');
    } else {
      console.error('Original block not found in attendance/page.jsx');
    }

    const approvalsPath = 'client/backend/routes/approvals.js';
    let appContent = fs.readFileSync(approvalsPath, 'utf8');
    
    if (!appContent.includes("const { generateSignedUrl } = require('../utils/gcs');")) {
      appContent = appContent.replace(
        "const { ownerOrAdmin } = require('../middleware/rbac');",
        "const { ownerOrAdmin } = require('../middleware/rbac');\nconst { generateSignedUrl } = require('../utils/gcs');"
      );
    }

    const oldResponse = `    const requests = await prisma.approval.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ requests });`;

    const newResponse = `    const requests = await prisma.approval.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    const enrichedRequests = await Promise.all(requests.map(async req => {
      const emp = await prisma.employee.findUnique({ where: { id: req.requestedBy }});
      if (emp) {
        return { 
          ...req, 
          requestedByAvatar: emp.avatar ? await generateSignedUrl(emp.avatar, 60 * 24 * 7) : null,
          requestedByEmpId: emp.empId || 'UNKN'
        };
      }
      return req;
    }));

    res.json({ requests: enrichedRequests });`;

    if (appContent.includes(oldResponse)) {
      appContent = appContent.replace(oldResponse, newResponse);
      fs.writeFileSync(approvalsPath, appContent);
      console.log('Successfully updated approvals.js to include avatars and empIds');
    } else {
      console.error('Original response block not found in approvals.js');
    }

  } catch (err) {
    console.error(err);
  }
}

main();
