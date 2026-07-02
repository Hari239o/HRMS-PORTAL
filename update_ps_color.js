const fs = require('fs');
const file = 'client/src/app/(protected)/performance/page.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `{completedClearances.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">`;
const newStr = `{completedClearances.map(sub => (
                      <tr key={sub.id} className="bg-green-100 hover:bg-green-200 transition-colors border-b border-slate-100 last:border-0">`;
                      
content = content.replace(targetStr, newStr);
fs.writeFileSync(file, content, 'utf8');
