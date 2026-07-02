const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/src/app/(protected)/approvals/page.jsx');
let content = fs.readFileSync(file, 'utf8');

// Add isPostSales check
content = content.replace(
  "  const { user } = useAuth();",
  "  const { user } = useAuth();\n  const isPostSales = user?.role === 'post_sales' || user?.role === 'post sales';"
);

// Conditionally render Actions header
content = content.replace(
  '<th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>',
  '{isPostSales && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>}'
);

// Conditionally render Actions buttons
const targetButtons = `<td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleApprove(sub.id)}
                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-xs"
                      >
                        <CheckCircle2 size={16} /> Approve
                      </button>
                      <button 
                        onClick={() => handleReject(sub.id)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-xs"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </td>`;

const replaceButtons = `{isPostSales && (
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleApprove(sub.id)}
                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-xs"
                      >
                        <CheckCircle2 size={16} /> Approve
                      </button>
                      <button 
                        onClick={() => handleReject(sub.id)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-xs"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </td>
                    )}`;

content = content.replace(targetButtons, replaceButtons);
fs.writeFileSync(file, content, 'utf8');
console.log('Approvals UI updated.');

// Update tasks.js fallback
const tasksFile = path.join(__dirname, 'client/backend/routes/tasks.js');
let tasksContent = fs.readFileSync(tasksFile, 'utf8');
tasksContent = tasksContent.replace(
  "const employeeName = employeeMap[s.employeeId] || 'Unknown';",
  "const employeeName = employeeMap[s.employeeId] || 'Admin / Unknown';"
);
fs.writeFileSync(tasksFile, tasksContent, 'utf8');
console.log('Tasks fallback updated.');
