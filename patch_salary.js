const fs = require('fs');
let c = fs.readFileSync('client/backend/routes/salary.js', 'utf8');

c = c.replace(
  "res.json({ message: 'Payslip released and employee notified successfully' });",
  "await prisma.notification.create({ data: { userId: salary.employeeId, title: 'Payslip Released', message: `Your payslip for ${salary.month} has been released.`, type: 'salary' } });\n    res.json({ message: 'Payslip released and employee notified successfully' });"
);

c = c.replace(
  "res.json({ message: 'Professional payslip sent successfully' });",
  "if (salary.status !== 'Released') { await prisma.notification.create({ data: { userId: salary.employeeId, title: 'Payslip Released', message: `Your payslip for ${salary.month} has been released and sent to your email.`, type: 'salary' } }); }\n    res.json({ message: 'Professional payslip sent successfully' });"
);

fs.writeFileSync('client/backend/routes/salary.js', c);
