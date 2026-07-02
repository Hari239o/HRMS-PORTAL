import re

file_path = 'client/src/app/(protected)/dashboard/page.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find("{/* Search Bar */}")
if start_idx != -1:
    end_marker = "{/* Banner Removed */}"
    end_idx = content.find(end_marker)
    if end_idx != -1:
        # We will remove from start_idx up to end_idx
        content = content[:start_idx] + content[end_idx:]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Removed Search Bar successfully.")
    else:
        print("End marker not found.")
else:
    print("Start marker not found.")
