const fs = require('fs');

async function main() {
  const pagePath = 'client/src/app/(protected)/leaves/page.jsx';
  let content = fs.readFileSync(pagePath, 'utf8');

  // --- LEAVE MODIFICATIONS ---

  // 1. Replace top block for leaves
  const leaveTopOld = `<div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Employee ID</span>
                      <span className="text-lg font-black text-gray-800">{leave.employee?.empId || leave.employeeId?.slice(-5).toUpperCase() || 'UNKN'}</span>
                    </div>`;
  const leaveTopNew = `<div>
                      <h4 className="text-lg font-black text-gray-900 truncate pr-2">{leave.employee?.name || 'Unknown Employee'}</h4>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mt-1">ID: {leave.employee?.empId || leave.employeeId?.slice(-5).toUpperCase() || 'UNKN'}</span>
                    </div>`;
  content = content.replace(leaveTopOld, leaveTopNew);

  // 2. Replace bottom right column for leaves
  const leaveBottomOld = `<div className="w-full md:w-80 shrink-0 flex flex-col gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0 md:pl-10">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Requested By</span>
                      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-full bg-orange-100 text-[#eb4917] font-black flex items-center justify-center text-xl border border-orange-200 shadow-sm shrink-0 overflow-hidden">
                          {leave.employee?.avatar ? (
                            <img src={leave.employee.avatar} alt={leave.employee?.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(leave.employee?.name || 'Unknown')
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-black text-gray-900 truncate">{leave.employee?.name || 'Unknown Employee'}</p>
                          <p className="text-xs text-gray-500 font-bold mt-1">ID: {leave.employee?.empId || leave.employeeId?.slice(-5).toUpperCase() || 'UNKN'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {hasAdminAccess(user) && leave.status === 'Pending' && (
                      <div className="mt-auto pt-2 flex flex-col gap-3 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block text-center mb-1">Admin Actions</span>
                        <button 
                          onClick={() => handleUpdateLeaveStatus(leave.id, 'Approved')}
                          className="w-full py-3.5 bg-green-500 text-white rounded-xl hover:bg-green-600 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 hover:-translate-y-0.5"
                        >
                          <CheckCircle2 size={18} /> Approve
                        </button>
                        <button 
                          onClick={() => handleUpdateLeaveStatus(leave.id, 'Rejected')}
                          className="w-full py-3.5 bg-white text-red-500 border-2 border-red-100 rounded-xl hover:bg-red-50 hover:border-red-200 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle size={18} /> Reject
                        </button>
                      </div>
                    )}
                  </div>`;
  const leaveBottomNew = `{hasAdminAccess(user) && leave.status === 'Pending' && (
                    <div className="w-full md:w-80 shrink-0 flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0 md:pl-10">
                      <div className="flex flex-col gap-3 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block text-center mb-1">Admin Actions</span>
                        <button 
                          onClick={() => handleUpdateLeaveStatus(leave.id, 'Approved')}
                          className="w-full py-3.5 bg-green-500 text-white rounded-xl hover:bg-green-600 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 hover:-translate-y-0.5"
                        >
                          <CheckCircle2 size={18} /> Approve
                        </button>
                        <button 
                          onClick={() => handleUpdateLeaveStatus(leave.id, 'Rejected')}
                          className="w-full py-3.5 bg-white text-red-500 border-2 border-red-100 rounded-xl hover:bg-red-50 hover:border-red-200 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle size={18} /> Reject
                        </button>
                      </div>
                    </div>
                  )}`;
  content = content.replace(leaveBottomOld, leaveBottomNew);


  // --- PROBLEM MODIFICATIONS ---

  // 1. Replace top block for problems
  const problemTopOld = `<div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Employee ID</span>
                      <span className="text-lg font-black text-gray-800">{problem.employee?.empId || problem.employeeId?.slice(-5).toUpperCase() || 'UNKN'}</span>
                    </div>`;
  const problemTopNew = `<div>
                      <h4 className="text-lg font-black text-gray-900 truncate pr-2">{problem.employee?.name || 'Unknown User'}</h4>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mt-1">ID: {problem.employee?.empId || problem.employeeId?.slice(-5).toUpperCase() || 'UNKN'}</span>
                    </div>`;
  content = content.replace(problemTopOld, problemTopNew);

  // 2. Replace bottom right column for problems
  const problemBottomOld = `<div className="w-full md:w-80 shrink-0 flex flex-col gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0 md:pl-10">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Reported By</span>
                      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-full bg-orange-100 text-[#eb4917] font-black flex items-center justify-center text-xl border border-orange-200 shadow-sm shrink-0 overflow-hidden">
                          {problem.employee?.avatar ? (
                            <img src={problem.employee.avatar} alt={problem.employee?.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(problem.employee?.name || 'Unknown')
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-black text-gray-900 truncate">{problem.employee?.name || 'Unknown User'}</p>
                          <p className="text-xs text-gray-500 font-bold mt-1">
                            {new Date(problem.createdAt || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {hasAdminAccess(user) && problem.status === 'Pending' && (
                      <div className="mt-auto pt-2 flex flex-col gap-3 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block text-center mb-1">Admin Actions</span>
                        <button 
                          onClick={() => handleUpdateProblemStatus(problem.id, 'Resolved')}
                          className="w-full py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:-translate-y-0.5"
                        >
                          <CheckCircle2 size={18} /> Mark Resolved
                        </button>
                        <button 
                          onClick={() => handleUpdateProblemStatus(problem.id, 'Rejected')}
                          className="w-full py-3.5 bg-white text-red-500 border-2 border-red-100 rounded-xl hover:bg-red-50 hover:border-red-200 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle size={18} /> Reject Ticket
                        </button>
                      </div>
                    )}
                  </div>`;
  const problemBottomNew = `{hasAdminAccess(user) && problem.status === 'Pending' && (
                    <div className="w-full md:w-80 shrink-0 flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0 md:pl-10">
                      <div className="flex flex-col gap-3 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block text-center mb-1">Admin Actions</span>
                        <button 
                          onClick={() => handleUpdateProblemStatus(problem.id, 'Resolved')}
                          className="w-full py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:-translate-y-0.5"
                        >
                          <CheckCircle2 size={18} /> Mark Resolved
                        </button>
                        <button 
                          onClick={() => handleUpdateProblemStatus(problem.id, 'Rejected')}
                          className="w-full py-3.5 bg-white text-red-500 border-2 border-red-100 rounded-xl hover:bg-red-50 hover:border-red-200 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle size={18} /> Reject Ticket
                        </button>
                      </div>
                    </div>
                  )}`;
  content = content.replace(problemBottomOld, problemBottomNew);

  fs.writeFileSync(pagePath, content);
  console.log('Successfully updated leave and problem blocks');
}

main();
