const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/src/app/(protected)/performance/page.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove Employee Defaulted Box
const empBoxStart = `{/* Defaulted / Withdrawn Notifications */}`;
const empBoxEnd = `          {/* DATA ENTRY FORM */}`;
if (content.includes(empBoxStart)) {
  const s = content.indexOf(empBoxStart);
  const e = content.indexOf(empBoxEnd);
  content = content.substring(0, s) + empBoxEnd + content.substring(e + empBoxEnd.length);
}

// 2. Remove Admin Defaulted Box
const adminBoxStart = `{/* Defaulted Alerts for Admin */}`;
const adminBoxEnd = `<div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mt-8">`;
if (content.includes(adminBoxStart)) {
  const s = content.indexOf(adminBoxStart);
  const e = content.indexOf(adminBoxEnd);
  content = content.substring(0, s) + adminBoxEnd + content.substring(e + adminBoxEnd.length);
}

// 3. Update Employee Row
const oldEmpRow = `<tr key={sub.id} className="hover:bg-blue-50/30 transition-all border-b border-slate-50 last:border-0 group">`;
const newEmpRow = `<tr key={sub.id} className={\`transition-all border-b border-slate-50 last:border-0 group \${sub.approvalStatus === 'Defaulted' ? 'bg-rose-50 hover:bg-rose-100/80' : sub.approvalStatus === 'Approved' && sub.remainingAmount === 0 ? 'bg-emerald-50 hover:bg-emerald-100/80' : 'hover:bg-blue-50/30'}\`}>`;
content = content.replace(oldEmpRow, newEmpRow);

// Add default badge to employee row
const oldEmpBadgeArea = `<div className="mb-2">`;
const newEmpBadgeArea = `<div className="mb-2">
                            {sub.approvalStatus === 'Defaulted' && (
                              <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider rounded border border-rose-700 block w-max mb-1">Defaulted / Withdrawn</span>
                            )}
                            {sub.approvalStatus === 'Defaulted' && sub.defaultWarning && (
                              <p className="mb-2 text-[10px] text-rose-700 font-bold max-w-xs">{sub.defaultWarning}</p>
                            )}`;
content = content.replace(oldEmpBadgeArea, newEmpBadgeArea);

// 4. Update Admin Row
const oldAdminRow = `<tr key={sub.id} className="hover:bg-blue-50/30 transition-all group">`;
const newAdminRow = `<tr key={sub.id} className={\`transition-all group \${sub.approvalStatus === 'Defaulted' ? 'bg-rose-50 hover:bg-rose-100/80' : sub.approvalStatus === 'Approved' && sub.remainingAmount === 0 ? 'bg-emerald-50 hover:bg-emerald-100/80' : 'hover:bg-blue-50/30'}\`}>`;
content = content.replace(oldAdminRow, newAdminRow);

// Add default badge to admin row
const oldAdminBadgeArea = `<p className="text-[10px] text-slate-400 mt-1">{sub.collegeName}</p>`;
const newAdminBadgeArea = `<p className="text-[10px] text-slate-400 mt-1">{sub.collegeName}</p>
                          {sub.approvalStatus === 'Defaulted' && (
                            <div className="mt-2">
                              <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider rounded border border-rose-700 block w-max mb-1">Defaulted / Withdrawn</span>
                              {sub.defaultWarning && <p className="mt-1 text-[10px] text-rose-700 font-bold max-w-[200px]">{sub.defaultWarning}</p>}
                            </div>
                          )}`;
content = content.replace(oldAdminBadgeArea, newAdminBadgeArea);


fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated performance UI colors!');
