import re

file_path = 'client/src/app/(protected)/employees/page.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the hierarchy rendering logic
start_pattern = '<h4 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4">Organizational Hierarchy</h4>'
start_idx = content.find(start_pattern)

if start_idx != -1:
    end_idx = content.find('</div>\n                </div>', start_idx)
    
    if end_idx != -1:
        new_hierarchy = """<h4 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4">Organizational Hierarchy</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['employee', 'intern', 'post_sales', 'team_leader'].includes(formData.role) && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Direct Manager</label>
                      <select 
                        value={formData.manager}
                        onChange={(e) => setFormData({...formData, manager: e.target.value})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="">-- None --</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    )}
                    {['employee', 'intern', 'post_sales', 'team_leader', 'manager'].includes(formData.role) && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">HR Representative</label>
                      <select 
                        value={formData.hrManager}
                        onChange={(e) => setFormData({...formData, hrManager: e.target.value})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="">-- None --</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    )}
                    {['employee', 'intern', 'post_sales'].includes(formData.role) && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Team Leader</label>
                      <select 
                        value={formData.teamLeader}
                        onChange={(e) => setFormData({...formData, teamLeader: e.target.value})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="">-- None --</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    )}
                  </div>"""
                  
        content = content[:start_idx] + new_hierarchy + content[end_idx:]

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Updated hierarchy visibility logic.")
    else:
        print("End marker not found")
else:
    print("Start marker not found")
