import re

file_path = 'client/backend/routes/employees.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add safeDelete for studentSubmission and team
search_str = "await safeDelete(prisma.target.deleteMany({ where: { employeeId: req.params.id } }));"
replace_str = """await safeDelete(prisma.target.deleteMany({ where: { employeeId: req.params.id } }));
    await safeDelete(prisma.studentSubmission.deleteMany({ where: { employeeId: req.params.id } }));
    
    // Unassign team members before deleting the team to avoid constraint errors
    const teamsLed = await prisma.team.findMany({ where: { leaderId: req.params.id } });
    for (const team of teamsLed) {
      await safeDelete(prisma.employee.updateMany({
        where: { teamId: team.id },
        data: { teamId: null }
      }));
    }
    await safeDelete(prisma.team.deleteMany({ where: { leaderId: req.params.id } }));"""

content = content.replace(search_str, replace_str)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated employee delete logic successfully.")
