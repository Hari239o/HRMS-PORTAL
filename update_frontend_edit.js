const fs = require('fs');
const file = 'client/src/app/(protected)/performance/page.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add editingId state
if (!content.includes('const [editingId, setEditingId] = useState(null);')) {
    content = content.replace(
        `  const [form, setForm] = useState({`,
        `  const [editingId, setEditingId] = useState(null);\n  const [form, setForm] = useState({`
    );
}

// 2. Update handleStudentSubmit
const submitRegex = /await api\.post\(`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| ''\}\/api\/tasks\/submit`, formData, \{ headers: \{ 'Content-Type': 'multipart\/form-data' \}\}\);\s*toast\.success\('Sale registered successfully!'\);/;
if (submitRegex.test(content)) {
    const replacement = `if (editingId) {
        await api.put(\`\${process.env.NEXT_PUBLIC_API_URL || ''}/api/tasks/submit/\${editingId}\`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
        toast.success('Sale updated successfully!');
        setEditingId(null);
      } else {
        await api.post(\`\${process.env.NEXT_PUBLIC_API_URL || ''}/api/tasks/submit\`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
        toast.success('Sale registered successfully!');
      }`;
    content = content.replace(submitRegex, replacement);
}

// 3. Add handleEditClick before handleStudentSubmit
if (!content.includes('const handleEditClick = (sub) => {')) {
    const handleEditFn = `  const handleEditClick = (sub) => {
    setEditingId(sub.id);
    setForm({
      studentName: sub.studentName || '',
      domain: sub.domain || '',
      collegeName: sub.collegeName || '',
      mailId: sub.mailId || '',
      phoneNumber: sub.phoneNumber || '',
      totalAmount: sub.totalAmount || '',
      amountPaid: sub.amountPaid || '',
      remainingAmount: sub.remainingAmount || '',
      remainingAmountDate: sub.remainingAmountDate ? sub.remainingAmountDate.split('T')[0] : '',
      courseType: sub.courseType || 'Live',
      courseDuration: sub.courseDuration || '1',
      file: null
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
`;
    content = content.replace(`  const handleStudentSubmit = async (e) => {`, handleEditFn + `  const handleStudentSubmit = async (e) => {`);
}

// 4. Update the submit button text and add Cancel button
const btnRegex = /<button\s*type="submit"\s*disabled=\{loading\}\s*className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl shadow-blue-500\/30 flex items-center justify-center gap-2"\s*>\s*\{loading \? \(\s*<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"><\/div>\s*\) : \(\s*<>\s*<Send size=\{18\} \/>\s*<span>Submit Transaction<\/span>\s*<\/>\s*\)\}\s*<\/button>/;

if (btnRegex.test(content)) {
    const newBtn = `<div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>{editingId ? 'Update Transaction' : 'Submit Transaction'}</span>
                      </>
                    )}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setForm({ studentName: '', domain: '', collegeName: '', mailId: '', phoneNumber: '', totalAmount: '', amountPaid: '', remainingAmount: '', remainingAmountDate: '', courseType: 'Live', courseDuration: '1', file: null });
                      }}
                      className="bg-slate-200 text-slate-700 font-black py-4 px-6 rounded-xl hover:bg-slate-300 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <X size={18} /> Cancel
                    </button>
                  )}
                </div>`;
    content = content.replace(btnRegex, newBtn);
}

// 5. Update the "Log New Transaction" title to be dynamic
content = content.replace(/<h2 className="text-xl font-black text-slate-800 flex items-center gap-3">[\s\S]*?Log New Transaction\s*<\/h2>/, `<h2 className="text-xl font-black text-slate-800 flex items-center gap-3">\n                      <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">\n                        <Award size={20} className="stroke-[2.5]" />\n                      </div>\n                      {editingId ? 'Edit Transaction' : 'Log New Transaction'}\n                    </h2>`);

// 6. Add Edit button to cards in Recent Intakes
// Just looking for text-right next to Enrollment Date
const cardDateRegex = /<p className="text-\[10px\] font-black text-slate-400 uppercase tracking-widest mb-1">Enrollment Date<\/p>\s*<p className="text-sm font-bold text-slate-700">\s*\{format\(new Date\(sub\.date \|\| sub\.createdAt\), 'dd MMM yyyy, HH:mm'\)\}\s*<\/p>\s*<\/div>/g;

content = content.replace(cardDateRegex, (match) => {
    return match + `\n                        <div className="mt-3 flex justify-end">
                          <button onClick={() => handleEditClick(sub)} className="text-[10px] font-black px-3 py-1.5 bg-slate-100 text-slate-600 rounded border border-slate-200 hover:bg-slate-200 hover:text-slate-800 transition-colors uppercase tracking-wider flex items-center gap-1">
                            <span className="w-3 h-3 block"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></span> Edit
                          </button>
                        </div>`;
});


fs.writeFileSync(file, content, 'utf8');
console.log('Successfully added edit capabilities');
