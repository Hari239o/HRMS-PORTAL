import re
import os

backend_path = 'client/backend/routes/teams.js'
with open(backend_path, 'r', encoding='utf-8') as f:
    backend_content = f.read()

# Add team.image signed URL generation in teams.js
if 'if (team.image)' not in backend_content:
    search_str = "if (team.leader && team.leader.avatar) {"
    idx = backend_content.find(search_str)
    if idx != -1:
        insert_code = """
      if (team.image) {
        team.image = await generateSignedUrl(team.image, 60 * 24 * 7);
      }
"""
        backend_content = backend_content[:idx] + insert_code + backend_content[idx:]
        with open(backend_path, 'w', encoding='utf-8') as f:
            f.write(backend_content)
        print("Added team.image to signed URLs.")

frontend_path = 'client/src/app/(protected)/teams/page.jsx'
with open(frontend_path, 'r', encoding='utf-8') as f:
    frontend_content = f.read()

# 1. Remove admin access block
admin_block = """  if (!hasAdminAccess(user)) {
    return <div className="p-8 text-center text-slate-500 font-bold">Access Denied</div>;
  }"""
if admin_block in frontend_content:
    frontend_content = frontend_content.replace(admin_block, "")
    print("Removed Admin access block.")

# 2. Update Create Team button visibility
create_btn_pattern = """<button 
          onClick={() => openModal()}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Create Team
        </button>"""
new_create_btn = """{hasAdminAccess(user) && (
        <button 
          onClick={() => openModal()}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Create Team
        </button>
        )}"""
if create_btn_pattern in frontend_content:
    frontend_content = frontend_content.replace(create_btn_pattern, new_create_btn)
    print("Wrapped Create Team button in hasAdminAccess.")

# 3. Update Banner logic
banner_pattern = """<div className="h-24 w-full relative" style={{ backgroundColor: team.color || '#4f46e5' }}>
                <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => openModal(team)} className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-colors"><Edit3 size={16}/></button>
                  <button onClick={() => handleDelete(team.id)} className="p-2 bg-white/20 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-colors"><Trash2 size={16}/></button>
                </div>"""

new_banner = """<div className="h-32 w-full relative bg-cover bg-center" style={{ backgroundColor: team.color || '#4f46e5', backgroundImage: team.image ? `url(${team.image})` : 'none' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {hasAdminAccess(user) && <button onClick={() => openModal(team)} className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-colors"><Edit3 size={16}/></button>}
                  {hasAdminAccess(user) && <button onClick={() => handleDelete(team.id)} className="p-2 bg-white/20 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-colors"><Trash2 size={16}/></button>}
                </div>"""
if banner_pattern in frontend_content:
    frontend_content = frontend_content.replace(banner_pattern, new_banner)
    print("Updated Banner background and action buttons.")

with open(frontend_path, 'w', encoding='utf-8') as f:
    f.write(frontend_content)

print("Frontend updates complete.")
