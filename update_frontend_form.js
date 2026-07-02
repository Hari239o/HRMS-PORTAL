const fs = require('fs');
const file = 'client/src/app/(protected)/performance/page.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /placeholder="student@example\.com"\s*\/>\s*<\/div>/;

const insertAfterEmail = `placeholder="student@example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Course Type</label>
                    <select
                      required
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                      value={form.courseType}
                      onChange={(e) => setForm({...form, courseType: e.target.value})}
                    >
                      <option value="Live">Live</option>
                      <option value="Recorded">Recorded</option>
                    </select>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Duration (Months)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                      value={form.courseDuration}
                      onChange={(e) => setForm({...form, courseDuration: e.target.value})}
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Upload Receipt/File (Optional)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm cursor-pointer"
                    onChange={(e) => setForm({...form, file: e.target.files[0]})}
                  />
                </div>`;

if (regex.test(content)) {
    content = content.replace(regex, insertAfterEmail);
    console.log("Successfully replaced form fields.");
} else {
    console.log("target1 NOT FOUND");
}

fs.writeFileSync(file, content, 'utf8');
