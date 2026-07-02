import re

file_path = 'client/src/app/(protected)/performance/page.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the incorrect headers object
# Find: await api.post(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tasks/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
# Replace with: await api.post(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tasks/submit`, formData);
content = content.replace(
    "await api.post(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tasks/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});",
    "await api.post(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tasks/submit`, formData);"
)
content = content.replace(
    "await api.put(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tasks/submit/${editingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});",
    "await api.put(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tasks/submit/${editingId}`, formData);"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed multipart/form-data boundary issue in performance page.")
