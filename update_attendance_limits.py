import re

file_path = 'client/backend/routes/attendance.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Allow HR to view all attendance like Admin
content = content.replace("if (role !== 'admin') {", "if (role !== 'admin' && role !== 'hr') {")
content = content.replace("if (role === 'admin') {", "if (role === 'admin' || role === 'hr') {")

# Fix 2: Increase the limits that were truncating yesterday's attendance
content = content.replace("take: 60 // Limit to last 60 records", "take: 180 // Increased to keep history")
content = content.replace("take: 100, // Reduced from 300 to improve initial load speed", "take: 3000, // Increased significantly because 100 truncates yesterday's attendance for the entire company")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated attendance route limits and HR access successfully.")
