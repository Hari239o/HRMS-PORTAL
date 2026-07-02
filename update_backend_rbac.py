import re

file_path = 'client/backend/routes/employees.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the HR restriction block with a rank-based restriction block
start_pattern = "const isSuperAdmin = req.user.role === 'admin' || req.user.email === 'harikishorereddy9908@gmail.com';"
start_idx = content.find(start_pattern)

if start_idx != -1:
    end_idx = content.find("const hashedPassword = await bcrypt.hash(password, 10);", start_idx)
    
    if end_idx != -1:
        new_logic = """const isSuperAdmin = req.user.role === 'admin' || req.user.email === 'harikishorereddy9908@gmail.com';
    
    if (!isSuperAdmin) {
      const rolesRank = {
        'employee': 1,
        'intern': 1,
        'post_sales': 2,
        'team_leader': 5,
        'manager': 8,
        'hr': 8,
        'admin': 10
      };
      
      const userRank = rolesRank[req.user.role] || 0;
      const targetRank = rolesRank[role] || 0;
      
      if (targetRank >= userRank) {
        return res.status(403).json({ error: 'You cannot create an account with a role equal to or higher than your own.' });
      }
    }

    """
        content = content[:start_idx] + new_logic + content[end_idx:]

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Backend RBAC logic updated successfully.")
    else:
        print("End marker not found")
else:
    print("Start marker not found")
