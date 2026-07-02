const fs = require('fs');
const file = 'client/src/app/(protected)/employees/page.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const [clearances, setClearances] = useState([]);')) {
    content = content.replace('const [employees, setEmployees] = useState([]);', 'const [employees, setEmployees] = useState([]);\n  const [clearances, setClearances] = useState([]);');
}

if (!content.includes('api.get(`/api/tasks/submit/clearances`)')) {
    const fetchDataRegex = /const fetchData = async \(\) => \{\s*await Promise\.all\(\[fetchEmployees\(\), fetchAttendanceData\(\)\]\);\s*\};/;
    if (fetchDataRegex.test(content)) {
        content = content.replace(fetchDataRegex, `const fetchData = async () => {
    const promises = [fetchEmployees(), fetchAttendanceData()];
    if (user?.role === 'post_sales' || user?.role === 'post sales') {
        promises.push(
            api.get(\`/api/tasks/submit/clearances\`)
               .then(res => setClearances(res.data))
               .catch(err => console.error(err))
        );
    }
    await Promise.all(promises);
  };`);
    } else {
        console.log('fetchData block not found');
    }
}

const analyticsBlock = `
      { (user?.role === 'post_sales' || user?.role === 'post sales') && (
        <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-700 col-span-1 md:col-span-3 mb-6">
          <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-widest flex items-center gap-2">
            <Users size={16} className="text-blue-400" />
            Employee Wise Revenue Analytics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(
              clearances.reduce((acc, sub) => {
                const name = sub.employeeName || 'Unknown';
                if (!acc[name]) acc[name] = { total: 0, received: 0, pending: 0 };
                acc[name].total += (sub.totalAmount || 0);
                acc[name].received += (sub.amountPaid || 0);
                acc[name].pending += (sub.remainingAmount || 0);
                return acc;
              }, {})
            ).map(([emp, stats]) => (
              <div key={emp} className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50">
                <span className="text-sm font-bold text-white mb-3 block border-b border-slate-700 pb-2">{emp}</span>
                <div className="flex justify-between text-xs mt-2">
                  <div className="flex flex-col">
                    <span className="text-slate-500 uppercase tracking-widest text-[9px]">Total</span>
                    <span className="font-medium text-slate-200">₹{stats.total.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 uppercase tracking-widest text-[9px]">Received</span>
                    <span className="font-medium text-emerald-400">₹{stats.received.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 uppercase tracking-widest text-[9px]">Pending</span>
                    <span className="font-medium text-amber-400">₹{stats.pending.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
`;

if (!content.includes('Employee Wise Revenue Analytics')) {
    content = content.replace(/<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">/, analyticsBlock + '\n      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated employees page');
