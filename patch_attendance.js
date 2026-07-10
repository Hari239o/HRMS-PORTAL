const fs = require('fs');
let c = fs.readFileSync('client/backend/routes/attendance.js', 'utf8');

c = c.replace(
  "const isTodayAfterOffice = a.date === today && currentTime > afterOffice;\n        if (isPastDay || isTodayAfterOffice) {",
  "const isTodayAfterOffice = false; // Checkout allowed till midnight\n        if (isPastDay) {"
);

fs.writeFileSync('client/backend/routes/attendance.js', c);
