const fs = require('fs');
let c = fs.readFileSync('client/backend/routes/employees.js', 'utf8');

c = c.replace(
  "res.json({ message: 'Employee updated' });",
  "if (weekOff && empToUpdate.weekOff !== weekOff) {\n      await prisma.notification.create({ data: { userId: req.params.id, title: 'Weekly Off Updated', message: `Your weekly off day has been updated to ${weekOff}.`, type: 'weekoff' } });\n    }\n    res.json({ message: 'Employee updated' });"
);

c = c.replace(
  "res.json({ success: true, message: 'Recognition level adjusted.' });",
  "if (badgeStr !== 'none') {\n      await prisma.notification.create({ data: { userId: req.params.id, title: 'Star Performer Badge Awarded!', message: `Congratulations! You have been recognized as a Star Performer: ${badgeStr}. Keep up the great work!`, type: 'performance' } });\n    }\n    res.json({ success: true, message: 'Recognition level adjusted.' });"
);

fs.writeFileSync('client/backend/routes/employees.js', c);
