const fs = require('fs');
let c = fs.readFileSync('client/backend/routes/attendance.js', 'utf8');

c = c.replace(
  'res.status(201).json({ id: newAttendance.id, employeeId, date: today, status });', 
  "await prisma.notification.create({ data: { userId: employeeId, title: 'Checked In Successfully', message: `You have checked in at ${now.toLocaleString({ hour: '2-digit', minute: '2-digit' })}. Status: ${status}`, type: 'attendance' } });\n    res.status(201).json({ id: newAttendance.id, employeeId, date: today, status });"
);

c = c.replace(
  "res.json({ message: 'Checked out successfully' });",
  "await prisma.notification.create({ data: { userId: employeeId, title: 'Checked Out Successfully', message: `You have checked out at ${now.toLocaleString({ hour: '2-digit', minute: '2-digit' })}. Status: ${finalStatus}`, type: 'attendance' } });\n    res.json({ message: 'Checked out successfully' });"
);

fs.writeFileSync('client/backend/routes/attendance.js', c);
