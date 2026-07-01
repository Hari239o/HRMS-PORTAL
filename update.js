const fs = require('fs');
const path = require('path');

const perfFile = path.join(__dirname, 'client/src/app/(protected)/performance/page.jsx');
let perfContent = fs.readFileSync(perfFile, 'utf8');

// Replace totalIntakes logic
perfContent = perfContent.replace(
  "  const totalIntakes = submissions.length;",
  "  const totalIntakes = submissions.filter(s => s.approvalStatus === 'Approved').length;\n  const pendingIntakes = submissions.filter(s => !s.approvalStatus || s.approvalStatus === 'Pending').length;"
);

// Replace Widget 2 logic
perfContent = perfContent.replace(
  '<p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500/70">Total Intakes</p>',
  '<p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500/70">Total Approved Intakes</p>'
);
perfContent = perfContent.replace(
  '<p className="mt-1 text-xs font-semibold text-slate-500">Logged this month</p>',
  '<p className="mt-1 text-xs font-semibold text-slate-500">{pendingIntakes > 0 ? `${pendingIntakes} pending approval` : \'Logged this month\'}</p>'
);

fs.writeFileSync(perfFile, perfContent, 'utf8');

const sidebarFile = path.join(__dirname, 'client/src/components/Sidebar.jsx');
let sidebarContent = fs.readFileSync(sidebarFile, 'utf8');
sidebarContent = sidebarContent.replace(
  "{ name: 'Approvals', icon: ClipboardList, path: '/approvals' },",
  "{ name: 'Post Sales Task Box', icon: ClipboardList, path: '/approvals' },"
);
fs.writeFileSync(sidebarFile, sidebarContent, 'utf8');

const approvalsFile = path.join(__dirname, 'client/src/app/(protected)/approvals/page.jsx');
let approvalsContent = fs.readFileSync(approvalsFile, 'utf8');
approvalsContent = approvalsContent.replace(
  "Pending Approvals",
  "Post Sales Task Box"
);
approvalsContent = approvalsContent.replace(
  "Pending Approvals",
  "Post Sales Task Box"
);
fs.writeFileSync(approvalsFile, approvalsContent, 'utf8');

console.log('Update complete.');
