const fs = require('fs');
const file = 'client/src/app/(protected)/performance/page.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="overflow-x-auto flex-1 p-2">[\s\S]*?<\/table>\s*<\/div>/;

const tableNew = `<div className="flex-1 p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar bg-slate-50/50">
                {submissions.length > 0 ? submissions.map((sub) => {
                  const percentComplete = sub.remainingAmount === 0 ? 100 : 10;
                  return (
                    <div key={sub.id} className={\`bg-white rounded-2xl p-5 border-2 transition-all shadow-sm hover:shadow-md \${sub.approvalStatus === 'Defaulted' ? 'border-rose-200 bg-rose-50/30' : sub.remainingAmount === 0 ? 'border-emerald-200' : 'border-slate-100 hover:border-blue-200'}\`}>
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                        <div className="flex gap-4 items-start">
                          <div className={\`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-inner \${sub.approvalStatus === 'Defaulted' ? 'bg-rose-500' : sub.remainingAmount === 0 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'}\`}>
                            {sub.studentName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
                              {sub.studentName}
                              {sub.approvalStatus === 'Defaulted' && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-rose-200">Defaulted / Withdrawn</span>
                              )}
                              {sub.remainingAmount === 0 && sub.approvalStatus !== 'Defaulted' && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-emerald-200 flex items-center gap-1"><CheckCircle size={10} /> Fully Paid</span>
                              )}
                              {sub.remainingAmount > 0 && sub.approvalStatus !== 'Defaulted' && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-200 flex items-center gap-1"><Clock size={10} /> Pending</span>
                              )}
                            </h4>
                            <div className="text-xs font-bold text-slate-500 flex flex-wrap gap-2 items-center mt-1">
                              <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-slate-600"><Mail size={12}/> {sub.mailId}</span>
                              <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-slate-600"><Phone size={12}/> {sub.phoneNumber}</span>
                            </div>
                            {sub.approvalStatus === 'Defaulted' && sub.defaultWarning && (
                              <p className="mt-2 text-xs text-rose-700 font-bold bg-rose-100/50 p-2 rounded-lg border border-rose-100 flex items-start gap-1"><AlertTriangle size={14} className="mt-0.5 flex-shrink-0"/> {sub.defaultWarning}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enrollment Date</p>
                          <p className="text-sm font-bold text-slate-700">
                            {format(new Date(sub.date || sub.createdAt), 'dd MMM yyyy, HH:mm')}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100/50">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Domain</p>
                          <p className="text-sm font-bold text-slate-800">{sub.domain}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Course Details</p>
                          <p className="text-sm font-bold text-slate-800">{sub.courseType || 'Live'} • {sub.courseDuration || '1'} Month(s)</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">College</p>
                          <p className="text-sm font-bold text-slate-800 line-clamp-1" title={sub.collegeName}>{sub.collegeName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Receipt</p>
                          {sub.fileUrl ? (
                            <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-200 transition-colors">
                              <LinkIcon size={12} /> View File
                            </a>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">No file</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 w-full">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-black text-slate-600">Payment Progress</span>
                            <span className="text-xs font-black text-blue-600">{percentComplete}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                            <div className={\`h-2.5 rounded-full transition-all duration-1000 \${percentComplete === 100 ? 'bg-emerald-500' : 'bg-blue-500'}\`} style={{ width: \`\${percentComplete}%\` }}></div>
                          </div>
                        </div>
                        <div className="flex gap-4 whitespace-nowrap">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Paid</p>
                            <p className="text-sm font-black text-emerald-600">₹{sub.amountPaid?.toLocaleString()}</p>
                          </div>
                          {sub.remainingAmount > 0 && (
                            <div>
                              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest text-right">Due</p>
                              <p className="text-sm font-black text-rose-600">₹{sub.remainingAmount?.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 h-64">
                    <div className="p-4 bg-slate-100 rounded-full mb-3">
                      <ClipboardList size={32} className="opacity-50" />
                    </div>
                    <p className="text-sm font-black tracking-wide">NO INTAKES LOGGED YET</p>
                  </div>
                )}
              </div>`;

if (regex.test(content)) {
    content = content.replace(regex, tableNew);
    console.log("Successfully replaced table.");
} else {
    console.log("table not found");
}

fs.writeFileSync(file, content, 'utf8');
