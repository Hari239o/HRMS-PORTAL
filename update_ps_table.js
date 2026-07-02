const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'client/src/app/(protected)/performance/page.jsx');
let content = fs.readFileSync(file, 'utf8');

// For Pending Clearances
content = content.replace(
  /<p className="text-sm font-bold text-slate-800">{sub\.studentName}<\/p>\s*<p className="text-xs font-semibold text-slate-500">{sub\.domain} • {sub\.collegeName}<\/p>/,
  `<p className="text-sm font-bold text-slate-800">{sub.studentName}</p>
                          <p className="text-xs font-semibold text-slate-500">{sub.domain} • {sub.collegeName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {sub.courseType && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-bold">{sub.courseType} • {sub.courseDuration} Mon</span>}
                            {sub.fileUrl && <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold hover:bg-blue-100 flex items-center gap-1"><LinkIcon size={10}/> Receipt</a>}
                          </div>`
);

// For Completed Clearances
content = content.replace(
  /<p className="text-sm font-bold text-slate-600">{sub\.studentName}<\/p>\s*<p className="text-xs font-semibold text-slate-400">{sub\.domain} • {sub\.collegeName}<\/p>/,
  `<p className="text-sm font-bold text-slate-600">{sub.studentName}</p>
                          <p className="text-xs font-semibold text-slate-400">{sub.domain} • {sub.collegeName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {sub.courseType && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-bold opacity-75">{sub.courseType} • {sub.courseDuration} Mon</span>}
                            {sub.fileUrl && <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold hover:bg-blue-100 flex items-center gap-1 opacity-75"><LinkIcon size={10}/> Receipt</a>}
                          </div>`
);

fs.writeFileSync(file, content);
console.log("Post Sales tables updated!");
