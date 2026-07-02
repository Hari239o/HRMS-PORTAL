import re

file_path = 'client/src/app/(protected)/employees/page.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I need to insert `getAvailableRoles` function inside the `Employees` component.
# Let's find `const Employees = () => {` and insert it after the state declarations.

state_end_pattern = "const [formData, setFormData] = useState({"
state_end_idx = content.find(state_end_pattern)
if state_end_idx != -1:
    # Find the closing brace of formData
    formdata_end = content.find("});", state_end_idx)
    if formdata_end != -1:
        insert_idx = formdata_end + 3
        
        roles_logic = """
  const getAvailableRoles = () => {
    const roles = [
      { value: 'employee', label: 'Standard Employee', rank: 1 },
      { value: 'intern', label: 'Intern / Trainee', rank: 1 },
      { value: 'post_sales', label: 'Post Sales (Operations)', rank: 2 },
      { value: 'team_leader', label: 'Team Leader', rank: 5 },
      { value: 'hr', label: 'HR Professional', rank: 8 },
      { value: 'manager', label: 'Manager', rank: 8 },
      { value: 'admin', label: 'System Admin', rank: 10 }
    ];

    if (!user) return roles;
    if (user.role === 'admin') return roles;

    let userRank = 0;
    const userRoleObj = roles.find(r => r.value === user.role);
    if (userRoleObj) userRank = userRoleObj.rank;

    return roles.filter(r => r.rank < userRank);
  };
"""
        content = content[:insert_idx] + roles_logic + content[insert_idx:]
        
# Now replace the select options
select_pattern = """<select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-800"
                  >"""

start_select_idx = content.find(select_pattern)
if start_select_idx != -1:
    end_select_idx = content.find("</select>", start_select_idx)
    if end_select_idx != -1:
        new_select = """<select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-800"
                  >
                    {getAvailableRoles().map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>"""
                  
        content = content[:start_select_idx] + new_select + content[end_select_idx + 9:]

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Updated roles dropdown logic.")
    else:
        print("Could not find end of select.")
else:
    print("Could not find start of select.")
