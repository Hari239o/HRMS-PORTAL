import sys

file_path = 'client/src/app/(protected)/employees/page.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">' in line:
        lines[i] = '      {hasAdminAccess(user) && (\n' + line
        print(f"Added hasAdminAccess at line {i+1}")
        break

for i in range(len(lines)-1, -1, -1):
    if '{showModal && (' in lines[i]:
        # found the modal
        # going backwards to find the grid close div
        for j in range(i-1, -1, -1):
            if '</div>' in lines[j]:
                lines[j] = lines[j].replace('</div>', '</div>\n      )}')
                print(f"Closed hasAdminAccess at line {j+1}")
                break
        break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Done")
